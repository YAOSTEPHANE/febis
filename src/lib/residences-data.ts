import type { Db } from "mongodb";
import { getDb } from "@/lib/mongodb";
import {
  FALLBACK_LODGINGS,
  buildCalendarDays,
  eachDateKey,
  nightsBetween,
  serializeLodging,
  type PublicLodging,
} from "@/lib/residences";
import type { LodgingDoc, ReservationDoc } from "@/lib/types";

type LodgingRecord = LodgingDoc & { _id: { toString(): string } };

async function tryDb(): Promise<Db | null> {
  try {
    return await Promise.race([
      getDb(),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 3000);
      }),
    ]);
  } catch {
    return null;
  }
}

export async function listPublicLodgings(): Promise<PublicLodging[]> {
  const db = await tryDb();
  if (!db) return FALLBACK_LODGINGS;

  try {
    const docs = await db
      .collection<LodgingRecord>("lodgings")
      .find({})
      .sort({ title: 1 })
      .limit(50)
      .toArray();

    if (docs.length === 0) return FALLBACK_LODGINGS;
    return docs.map((doc) => serializeLodging(doc));
  } catch {
    return FALLBACK_LODGINGS;
  }
}

export async function getPublicLodgingBySlug(
  slug: string,
): Promise<PublicLodging | null> {
  const db = await tryDb();
  if (!db) {
    return FALLBACK_LODGINGS.find((l) => l.slug === slug) ?? null;
  }

  try {
    const doc = await db.collection<LodgingRecord>("lodgings").findOne({ slug });
    if (doc) return serializeLodging(doc);
    return FALLBACK_LODGINGS.find((l) => l.slug === slug) ?? null;
  } catch {
    return FALLBACK_LODGINGS.find((l) => l.slug === slug) ?? null;
  }
}

export async function getReservedRangesForSlug(slug: string) {
  const db = await tryDb();
  if (!db) {
    // Démo : quelques jours réservés au milieu du mois courant
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return [
      { checkIn: `${y}-${m}-08`, checkOut: `${y}-${m}-12` },
      { checkIn: `${y}-${m}-20`, checkOut: `${y}-${m}-23` },
    ];
  }

  try {
    const reservations = await db
      .collection<ReservationDoc>("reservations")
      .find({
        lodgingSlug: slug,
        step: {
          $in: [
            "reservation",
            "acompte",
            "check_in",
            "check_out",
            "etat_des_lieux",
          ],
        },
      })
      .project({ checkIn: 1, checkOut: 1 })
      .toArray();

    return reservations.map((r) => ({
      checkIn: r.checkIn,
      checkOut: r.checkOut,
    }));
  } catch {
    return [];
  }
}

export async function getCalendarForSlug(
  slug: string,
  year: number,
  month: number,
) {
  const lodging = await getPublicLodgingBySlug(slug);
  if (!lodging) return null;

  const reservedRanges = await getReservedRangesForSlug(slug);
  const days = buildCalendarDays({
    month: new Date(year, month - 1, 1),
    lodgingStatus: lodging.status,
    reservedRanges,
  });

  return { lodging, days, year, month };
}

export async function createReservationDemande(input: {
  lodgingSlug: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  message?: string;
  paymentChannel?: ReservationDoc["paymentChannel"];
}) {
  const lodging = await getPublicLodgingBySlug(input.lodgingSlug);
  if (!lodging) {
    throw new Error("Logement introuvable.");
  }
  if (lodging.status === "maintenance") {
    throw new Error("Ce logement est en maintenance.");
  }

  const nights = nightsBetween(input.checkIn, input.checkOut);
  if (nights < 1) {
    throw new Error("La date de départ doit être après l’arrivée.");
  }

  const reserved = await getReservedRangesForSlug(input.lodgingSlug);
  const requested = new Set(eachDateKey(input.checkIn, input.checkOut));
  for (const range of reserved) {
    for (const key of eachDateKey(range.checkIn, range.checkOut)) {
      if (requested.has(key)) {
        throw new Error("Certaines dates sélectionnées sont déjà réservées.");
      }
    }
  }

  const totalAmount = nights * lodging.pricePerNight;
  const depositAmount = Math.round(
    (totalAmount * lodging.depositPercent) / 100,
  );
  const now = new Date();

  const doc: Omit<ReservationDoc, "_id"> = {
    lodgingId: lodging.id,
    lodgingSlug: lodging.slug,
    lodgingTitle: lodging.title,
    guestName: input.guestName,
    guestEmail: input.guestEmail.toLowerCase(),
    guestPhone: input.guestPhone,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    nights,
    guests: input.guests,
    totalAmount,
    depositAmount,
    currency: "XOF",
    step: "demande",
    message: input.message,
    paymentChannel: input.paymentChannel ?? null,
    createdAt: now,
    updatedAt: now,
  };

  const db = await tryDb();
  if (!db) {
    return {
      ...doc,
      id: `local-${Date.now()}`,
      persisted: false as const,
    };
  }

  const result = await db.collection("reservations").insertOne(doc);

  const clients = db.collection<{
    email: string;
    name: string;
    phone: string;
    createdAt: Date;
    updatedAt: Date;
    interactions: Array<{
      type: string;
      activity: string;
      message: string;
      at: Date;
    }>;
  }>("clients");

  await clients.updateOne(
    { email: doc.guestEmail },
    {
      $set: {
        name: doc.guestName,
        email: doc.guestEmail,
        phone: doc.guestPhone,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
      $push: {
        interactions: {
          type: "reservation_demande",
          activity: "residences",
          message: `${doc.lodgingTitle} · ${doc.checkIn} → ${doc.checkOut}`,
          at: now,
        },
      },
    },
    { upsert: true },
  );

  return {
    ...doc,
    id: result.insertedId.toString(),
    persisted: true as const,
  };
}

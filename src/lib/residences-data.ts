import "server-only";
import { ObjectId, type Db, type Filter } from "mongodb";
import { getDb } from "@/lib/mongodb";
import {
  FALLBACK_LODGINGS,
  buildCalendarDays,
  eachDateKey,
  nightsBetween,
  serializeLodging,
  type PublicLodging,
} from "@/lib/residences";
import type {
  LodgingDoc,
  LodgingStatus,
  PaymentChannel,
  ReservationDoc,
  ReservationStep,
} from "@/lib/types";
import { RESERVATION_STEPS } from "@/lib/types";
import { linkProjectAndInvoice, touchClient } from "@/lib/crm";
import {
  isReservationStep,
  type SerializedReservation,
} from "@/lib/residences-shared";

type LodgingRecord = Omit<LodgingDoc, "_id"> & { _id: ObjectId };
type ReservationRecord = Omit<ReservationDoc, "_id"> & { _id: ObjectId };

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

function toIso(value: Date | string | undefined | null) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function serializeReservation(
  doc: Omit<ReservationDoc, "_id"> & { _id?: { toString(): string } },
  idOverride?: string,
): SerializedReservation {
  return {
    id: idOverride ?? doc._id?.toString?.() ?? "",
    lodgingId: doc.lodgingId,
    lodgingSlug: doc.lodgingSlug,
    lodgingTitle: doc.lodgingTitle,
    guestName: doc.guestName,
    guestEmail: doc.guestEmail,
    guestPhone: doc.guestPhone,
    checkIn: doc.checkIn,
    checkOut: doc.checkOut,
    nights: doc.nights,
    guests: doc.guests,
    totalAmount: doc.totalAmount,
    depositAmount: doc.depositAmount,
    currency: "XOF",
    step: doc.step,
    message: doc.message ?? "",
    paymentChannel: doc.paymentChannel ?? null,
    inventoryNotes: doc.inventoryNotes ?? "",
    cancelled: Boolean(doc.cancelled),
    createdAt: toIso(doc.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(doc.updatedAt) ?? new Date(0).toISOString(),
  };
}

export type { SerializedReservation };

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
        cancelled: { $ne: true },
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
    cancelled: false,
    createdAt: now,
    updatedAt: now,
  };

  const db = await tryDb();
  if (!db) {
    return {
      ...serializeReservation(doc, `local-${Date.now()}`),
      persisted: false as const,
    };
  }

  const result = await db.collection("reservations").insertOne(doc);

  const { clientId } = await touchClient({
    name: doc.guestName,
    email: doc.guestEmail,
    phone: doc.guestPhone,
    activity: "residences",
    interaction: {
      type: "reservation_demande",
      title: "Demande de réservation",
      message: `${doc.lodgingTitle} · ${doc.checkIn} → ${doc.checkOut}`,
      refType: "reservation",
      refId: result.insertedId.toString(),
    },
  });

  if (clientId) {
    await linkProjectAndInvoice({
      clientId,
      clientName: doc.guestName,
      clientEmail: doc.guestEmail,
      activity: "residences",
      title: `Résidence · ${doc.lodgingTitle}`,
      amount: doc.totalAmount,
      sourceType: "reservation",
      sourceId: result.insertedId.toString(),
      invoiceStatus: "brouillon",
      projectStatus: "ouvert",
    });
  }

  return {
    ...serializeReservation(doc, result.insertedId.toString()),
    persisted: true as const,
  };
}

export async function listAdminReservations(filters?: {
  q?: string;
  step?: string;
  lodgingSlug?: string;
  includeCancelled?: boolean;
}): Promise<SerializedReservation[]> {
  const db = await tryDb();
  if (!db) return [];

  const filter: Filter<ReservationRecord> = {};
  if (!filters?.includeCancelled) {
    filter.cancelled = { $ne: true };
  }
  if (filters?.step && filters.step !== "all" && isReservationStep(filters.step)) {
    filter.step = filters.step;
  }
  if (filters?.lodgingSlug && filters.lodgingSlug !== "all") {
    filter.lodgingSlug = filters.lodgingSlug;
  }

  const rows = await db
    .collection<ReservationRecord>("reservations")
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  let list = rows.map((row) => serializeReservation(row, row._id.toString()));
  const q = filters?.q?.trim().toLowerCase();
  if (q) {
    list = list.filter((r) => {
      const hay = `${r.guestName} ${r.guestEmail} ${r.guestPhone} ${r.lodgingTitle} ${r.lodgingSlug}`.toLowerCase();
      return hay.includes(q);
    });
  }
  return list;
}

export async function getAdminReservation(
  id: string,
): Promise<SerializedReservation | null> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) return null;
  const doc = await db
    .collection<ReservationRecord>("reservations")
    .findOne({ _id: new ObjectId(id) });
  return doc ? serializeReservation(doc, doc._id.toString()) : null;
}

export async function updateReservation(
  id: string,
  patch: {
    step?: ReservationStep;
    paymentChannel?: PaymentChannel | null;
    inventoryNotes?: string;
    message?: string;
    cancelled?: boolean;
    guests?: number;
  },
): Promise<SerializedReservation | null> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) return null;

  const existing = await db
    .collection<ReservationRecord>("reservations")
    .findOne({ _id: new ObjectId(id) });
  if (!existing) return null;

  if (patch.step && !isReservationStep(patch.step)) {
    throw new Error("Étape invalide.");
  }

  // Bloquer le calendrier : si on confirme une réservation, vérifier conflits
  if (
    patch.step &&
    ["reservation", "acompte", "check_in"].includes(patch.step) &&
    existing.step === "demande" &&
    !existing.cancelled
  ) {
    const reserved = await getReservedRangesForSlug(existing.lodgingSlug);
    const requested = new Set(
      eachDateKey(existing.checkIn, existing.checkOut),
    );
    for (const range of reserved) {
      for (const key of eachDateKey(range.checkIn, range.checkOut)) {
        if (requested.has(key)) {
          throw new Error(
            "Conflit de dates : une autre réservation occupe déjà cette période.",
          );
        }
      }
    }
  }

  const $set: Partial<ReservationDoc> = { updatedAt: new Date() };
  if (patch.step !== undefined) $set.step = patch.step;
  if (patch.paymentChannel !== undefined) {
    $set.paymentChannel = patch.paymentChannel;
  }
  if (patch.inventoryNotes !== undefined) {
    $set.inventoryNotes = patch.inventoryNotes.trim();
  }
  if (patch.message !== undefined) $set.message = patch.message.trim();
  if (patch.cancelled !== undefined) $set.cancelled = patch.cancelled;
  if (patch.guests !== undefined) {
    $set.guests = Math.max(1, Math.min(20, Math.round(patch.guests)));
  }

  await db
    .collection("reservations")
    .updateOne({ _id: existing._id }, { $set });

  // Mettre à jour le statut logement si check-in / check-out
  if (patch.step === "check_in") {
    await db.collection("lodgings").updateOne(
      { slug: existing.lodgingSlug },
      { $set: { status: "reserve" as LodgingStatus, updatedAt: new Date() } },
    );
  }
  if (patch.step === "check_out" || patch.step === "etat_des_lieux") {
    await db.collection("lodgings").updateOne(
      { slug: existing.lodgingSlug },
      {
        $set: { status: "disponible" as LodgingStatus, updatedAt: new Date() },
      },
    );
  }
  if (patch.cancelled) {
    await db.collection("lodgings").updateOne(
      { slug: existing.lodgingSlug, status: "reserve" },
      {
        $set: { status: "disponible" as LodgingStatus, updatedAt: new Date() },
      },
    );
  }

  return getAdminReservation(id);
}

export async function createAdminReservation(input: {
  lodgingSlug: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  message?: string;
  paymentChannel?: PaymentChannel | null;
  step?: ReservationStep;
}): Promise<SerializedReservation | null> {
  const created = await createReservationDemande({
    lodgingSlug: input.lodgingSlug,
    guestName: input.guestName,
    guestEmail: input.guestEmail,
    guestPhone: input.guestPhone,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
    message: input.message,
    paymentChannel: input.paymentChannel ?? undefined,
  });

  if (!("id" in created) || !created.id) return null;

  const step = input.step && isReservationStep(input.step) ? input.step : "demande";
  if (step !== "demande" && created.persisted) {
    return updateReservation(created.id, { step });
  }

  if (!created.persisted) {
    return {
      ...serializeReservation(
        {
          lodgingId: created.lodgingId,
          lodgingSlug: created.lodgingSlug,
          lodgingTitle: created.lodgingTitle,
          guestName: created.guestName,
          guestEmail: created.guestEmail,
          guestPhone: created.guestPhone,
          checkIn: created.checkIn,
          checkOut: created.checkOut,
          nights: created.nights,
          guests: created.guests,
          totalAmount: created.totalAmount,
          depositAmount: created.depositAmount,
          currency: "XOF",
          step: "demande",
          message: created.message,
          paymentChannel: created.paymentChannel ?? null,
          cancelled: false,
          createdAt: new Date(created.createdAt),
          updatedAt: new Date(created.updatedAt),
        },
        created.id,
      ),
    };
  }

  return getAdminReservation(created.id);
}

export async function updateLodgingStatus(
  slug: string,
  status: LodgingStatus,
): Promise<PublicLodging | null> {
  const db = await tryDb();
  if (!db) return null;
  await db.collection("lodgings").updateOne(
    { slug },
    { $set: { status, updatedAt: new Date() } },
  );
  return getPublicLodgingBySlug(slug);
}

export async function getReservationStats() {
  const all = await listAdminReservations({ includeCancelled: true });
  const active = all.filter((r) => !r.cancelled);
  const byStep = Object.fromEntries(
    RESERVATION_STEPS.map((s) => [s, active.filter((r) => r.step === s).length]),
  ) as Record<ReservationStep, number>;
  const revenue = active
    .filter((r) =>
      ["acompte", "check_in", "check_out", "etat_des_lieux"].includes(r.step),
    )
    .reduce((sum, r) => sum + r.totalAmount, 0);
  const deposits = active
    .filter((r) =>
      ["acompte", "check_in", "check_out", "etat_des_lieux"].includes(r.step),
    )
    .reduce((sum, r) => sum + r.depositAmount, 0);

  return {
    total: active.length,
    cancelled: all.filter((r) => r.cancelled).length,
    demandes: byStep.demande ?? 0,
    enCours:
      (byStep.reservation ?? 0) +
      (byStep.acompte ?? 0) +
      (byStep.check_in ?? 0),
    byStep,
    revenue,
    deposits,
  };
}

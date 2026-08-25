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
  LodgingCategory,
  LodgingDoc,
  LodgingStatus,
  PaymentChannel,
  ReservationDoc,
  ReservationStep,
} from "@/lib/types";
import { RESERVATION_STEPS } from "@/lib/types";
import { linkProjectAndInvoice, touchClient } from "@/lib/crm";
import {
  notifyReservationCreated,
  notifyReservationUpdated,
} from "@/lib/notifications";
import {
  isLodgingCategory,
  isLodgingStatus,
  isReservationStep,
  slugifyLodgingTitle,
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

    return docs.map((doc) => serializeLodging(doc));
  } catch {
    return FALLBACK_LODGINGS;
  }
}

export async function listAdminLodgings(): Promise<PublicLodging[]> {
  const db = await tryDb();
  if (!db) return [];
  const docs = await db
    .collection<LodgingRecord>("lodgings")
    .find({})
    .sort({ updatedAt: -1 })
    .limit(200)
    .toArray();
  return docs.map((doc) => serializeLodging(doc));
}

export async function getAdminLodgingBySlug(
  slug: string,
): Promise<PublicLodging | null> {
  const db = await tryDb();
  if (!db) return null;
  const doc = await db
    .collection<LodgingRecord>("lodgings")
    .findOne({ slug: slug.trim().toLowerCase() });
  return doc ? serializeLodging(doc) : null;
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

  const reservationId = result.insertedId.toString();
  void notifyReservationCreated({
    id: reservationId,
    lodgingTitle: doc.lodgingTitle,
    guestName: doc.guestName,
    guestEmail: doc.guestEmail,
    guestPhone: doc.guestPhone,
    checkIn: doc.checkIn,
    checkOut: doc.checkOut,
    nights: doc.nights,
    totalAmount: doc.totalAmount,
  }).catch(() => undefined);

  return {
    ...serializeReservation(doc, reservationId),
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
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    checkIn?: string;
    checkOut?: string;
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

  const nextCheckIn = patch.checkIn?.trim() || existing.checkIn;
  const nextCheckOut = patch.checkOut?.trim() || existing.checkOut;
  const datesChanged =
    nextCheckIn !== existing.checkIn || nextCheckOut !== existing.checkOut;

  if (datesChanged) {
    if (nextCheckOut <= nextCheckIn) {
      throw new Error("La date de départ doit être après l’arrivée.");
    }
  }

  // Bloquer le calendrier : confirmation ou changement de dates
  const needsConflictCheck =
    !existing.cancelled &&
    ((patch.step &&
      ["reservation", "acompte", "check_in"].includes(patch.step) &&
      existing.step === "demande") ||
      (datesChanged &&
        ["reservation", "acompte", "check_in"].includes(
          patch.step ?? existing.step,
        )));

  if (needsConflictCheck) {
    const reserved = await getReservedRangesForSlug(existing.lodgingSlug);
    const requested = new Set(eachDateKey(nextCheckIn, nextCheckOut));
    for (const range of reserved) {
      if (
        range.checkIn === existing.checkIn &&
        range.checkOut === existing.checkOut
      ) {
        continue;
      }
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
  if (typeof patch.guestName === "string" && patch.guestName.trim()) {
    $set.guestName = patch.guestName.trim();
  }
  if (typeof patch.guestEmail === "string" && patch.guestEmail.trim()) {
    $set.guestEmail = patch.guestEmail.trim().toLowerCase();
  }
  if (typeof patch.guestPhone === "string" && patch.guestPhone.trim()) {
    $set.guestPhone = patch.guestPhone.trim();
  }
  if (datesChanged) {
    const nights = nightsBetween(nextCheckIn, nextCheckOut);
    const lodging = await db
      .collection<{ pricePerNight?: number; depositPercent?: number }>(
        "lodgings",
      )
      .findOne({ slug: existing.lodgingSlug });
    const pricePerNight =
      lodging?.pricePerNight ??
      (existing.nights > 0
        ? Math.round(existing.totalAmount / existing.nights)
        : 0);
    const depositPercent = lodging?.depositPercent ?? 30;
    const totalAmount = nights * pricePerNight;
    $set.checkIn = nextCheckIn;
    $set.checkOut = nextCheckOut;
    $set.nights = nights;
    $set.totalAmount = totalAmount;
    $set.depositAmount = Math.round((totalAmount * depositPercent) / 100);
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

  const stepChanged =
    patch.step !== undefined && patch.step !== existing.step;
  const cancelledChanged =
    patch.cancelled !== undefined && patch.cancelled !== existing.cancelled;

  if (stepChanged || cancelledChanged) {
    void notifyReservationUpdated({
      id,
      lodgingTitle: existing.lodgingTitle,
      guestName: existing.guestName,
      guestEmail: existing.guestEmail,
      guestPhone: existing.guestPhone,
      checkIn: existing.checkIn,
      checkOut: existing.checkOut,
      step: patch.step ?? existing.step,
      cancelled: Boolean(patch.cancelled ?? existing.cancelled),
    }).catch(() => undefined);
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
  return getAdminLodgingBySlug(slug);
}

export async function createLodging(input: {
  title: string;
  slug?: string;
  description: string;
  longDescription?: string;
  photos?: string[];
  pricePerNight: number;
  depositPercent?: number;
  status?: string;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  location: string;
  neighborhood: string;
  category: string;
  amenities?: string[];
  highlights?: string[];
}): Promise<PublicLodging | null> {
  const db = await tryDb();
  if (!db) return null;

  const title = input.title.trim();
  if (title.length < 2) throw new Error("Titre du logement requis.");
  if (!isLodgingCategory(input.category)) {
    throw new Error("Catégorie invalide.");
  }

  let slug = (input.slug?.trim() || slugifyLodgingTitle(title)).toLowerCase();
  if (!slug) slug = `logement-${Date.now().toString(36)}`;

  const existing = await db.collection("lodgings").findOne({ slug });
  if (existing) throw new Error("Ce slug existe déjà.");

  const status: LodgingStatus =
    input.status && isLodgingStatus(input.status)
      ? input.status
      : "disponible";

  const photos = (input.photos ?? [])
    .map((p) => p.trim())
    .filter(Boolean);
  if (photos.length === 0) {
    photos.push("/images/pole-residences.jpg");
  }

  const now = new Date();
  const doc: Omit<LodgingDoc, "_id"> = {
    title,
    slug,
    description: input.description.trim() || "—",
    longDescription: input.longDescription?.trim() || undefined,
    photos,
    pricePerNight: Math.max(0, Math.round(Number(input.pricePerNight) || 0)),
    depositPercent: Math.min(
      100,
      Math.max(0, Math.round(Number(input.depositPercent ?? 30) || 0)),
    ),
    currency: "XOF",
    status,
    capacity: Math.max(1, Math.round(Number(input.capacity) || 1)),
    bedrooms: Math.max(0, Math.round(Number(input.bedrooms) || 0)),
    bathrooms: Math.max(0, Math.round(Number(input.bathrooms) || 0)),
    location: input.location.trim() || "Abidjan",
    neighborhood: input.neighborhood.trim() || "—",
    category: input.category as LodgingCategory,
    amenities: (input.amenities ?? []).map((a) => a.trim()).filter(Boolean),
    highlights: (input.highlights ?? []).map((h) => h.trim()).filter(Boolean),
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("lodgings").insertOne(doc as never);
  return serializeLodging({ ...doc, _id: result.insertedId } as LodgingRecord);
}

export async function updateLodging(
  slug: string,
  input: {
    title?: string;
    slug?: string;
    description?: string;
    longDescription?: string;
    photos?: string[];
    pricePerNight?: number;
    depositPercent?: number;
    status?: string;
    capacity?: number;
    bedrooms?: number;
    bathrooms?: number;
    location?: string;
    neighborhood?: string;
    category?: string;
    amenities?: string[];
    highlights?: string[];
  },
): Promise<PublicLodging | null> {
  const db = await tryDb();
  if (!db) return null;

  const existing = await db
    .collection<LodgingRecord>("lodgings")
    .findOne({ slug: slug.trim().toLowerCase() });
  if (!existing) return null;

  const $set: Partial<LodgingDoc> = { updatedAt: new Date() };

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (title.length < 2) throw new Error("Titre invalide.");
    $set.title = title;
  }
  if (input.slug !== undefined) {
    const nextSlug =
      input.slug.trim().toLowerCase() ||
      slugifyLodgingTitle(input.title ?? existing.title);
    const clash = await db.collection("lodgings").findOne({
      slug: nextSlug,
      _id: { $ne: existing._id },
    });
    if (clash) throw new Error("Ce slug existe déjà.");
    $set.slug = nextSlug;
  }
  if (input.description !== undefined) {
    $set.description = input.description.trim() || "—";
  }
  if (input.longDescription !== undefined) {
    $set.longDescription = input.longDescription.trim() || undefined;
  }
  if (input.photos !== undefined) {
    const photos = input.photos.map((p) => p.trim()).filter(Boolean);
    $set.photos =
      photos.length > 0 ? photos : ["/images/pole-residences.jpg"];
  }
  if (input.pricePerNight !== undefined) {
    $set.pricePerNight = Math.max(0, Math.round(Number(input.pricePerNight) || 0));
  }
  if (input.depositPercent !== undefined) {
    $set.depositPercent = Math.min(
      100,
      Math.max(0, Math.round(Number(input.depositPercent) || 0)),
    );
  }
  if (input.status !== undefined) {
    if (!isLodgingStatus(input.status)) throw new Error("Statut invalide.");
    $set.status = input.status;
  }
  if (input.capacity !== undefined) {
    $set.capacity = Math.max(1, Math.round(Number(input.capacity) || 1));
  }
  if (input.bedrooms !== undefined) {
    $set.bedrooms = Math.max(0, Math.round(Number(input.bedrooms) || 0));
  }
  if (input.bathrooms !== undefined) {
    $set.bathrooms = Math.max(0, Math.round(Number(input.bathrooms) || 0));
  }
  if (input.location !== undefined) {
    $set.location = input.location.trim() || existing.location;
  }
  if (input.neighborhood !== undefined) {
    $set.neighborhood = input.neighborhood.trim() || existing.neighborhood;
  }
  if (input.category !== undefined) {
    if (!isLodgingCategory(input.category)) {
      throw new Error("Catégorie invalide.");
    }
    $set.category = input.category;
  }
  if (input.amenities !== undefined) {
    $set.amenities = input.amenities.map((a) => a.trim()).filter(Boolean);
  }
  if (input.highlights !== undefined) {
    $set.highlights = input.highlights.map((h) => h.trim()).filter(Boolean);
  }

  await db.collection("lodgings").updateOne({ _id: existing._id }, { $set });
  const nextSlug = $set.slug ?? existing.slug;
  return getAdminLodgingBySlug(nextSlug);
}

export async function deleteLodging(slug: string): Promise<boolean> {
  const db = await tryDb();
  if (!db) return false;
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return false;
  const result = await db.collection("lodgings").deleteOne({ slug: normalized });
  return result.deletedCount === 1;
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

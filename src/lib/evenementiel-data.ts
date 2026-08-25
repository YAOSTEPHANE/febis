import "server-only";
import { ObjectId, type Db, type Filter } from "mongodb";
import { getDb } from "@/lib/mongodb";
import {
  FALLBACK_EQUIPMENT,
  buildQuoteLine,
  daysBetween,
  serializeEquipment,
  type PublicEquipment,
} from "@/lib/evenementiel";
import {
  isEquipmentCategory,
  isEquipmentStatus,
  isMovementType,
  isQuoteStatus,
  slugifyEquipment,
  type SerializedEventQuote,
  type SerializedMovement,
} from "@/lib/evenementiel-shared";
import type {
  EquipmentDoc,
  EquipmentMovementDoc,
  EquipmentStatus,
  EventQuoteDoc,
  EventQuoteLine,
  MovementType,
  QuoteStatus,
} from "@/lib/types";
import { linkProjectAndInvoice, touchClient } from "@/lib/crm";
import { notifyStockLowItem } from "@/lib/notifications";

type EquipmentRecord = Omit<EquipmentDoc, "_id"> & { _id: ObjectId };
type QuoteRecord = Omit<EventQuoteDoc, "_id"> & { _id: ObjectId };
type MovementRecord = Omit<EquipmentMovementDoc, "_id"> & { _id: ObjectId };

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

function deriveEquipmentStatus(
  quantityAvailable: number,
  quantityTotal: number,
  forced?: EquipmentStatus,
): EquipmentStatus {
  if (forced === "maintenance") return "maintenance";
  if (quantityAvailable <= 0) return "loue";
  if (quantityAvailable < quantityTotal) return "loue";
  return "disponible";
}

export function serializeEventQuote(
  doc: Omit<EventQuoteDoc, "_id"> & { _id?: { toString(): string } },
  idOverride?: string,
): SerializedEventQuote {
  return {
    id: idOverride ?? doc._id?.toString?.() ?? "",
    clientName: doc.clientName,
    clientEmail: doc.clientEmail,
    clientPhone: doc.clientPhone,
    eventDate: doc.eventDate,
    returnDate: doc.returnDate,
    message: doc.message ?? "",
    lines: doc.lines,
    rentalTotal: doc.rentalTotal,
    depositTotal: doc.depositTotal,
    currency: "XOF",
    status: doc.status,
    createdAt: toIso(doc.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(doc.updatedAt) ?? new Date(0).toISOString(),
  };
}

export async function listPublicEquipment(): Promise<PublicEquipment[]> {
  const db = await tryDb();
  if (!db) return FALLBACK_EQUIPMENT;

  try {
    const docs = await db
      .collection<EquipmentRecord>("equipment")
      .find({})
      .sort({ name: 1 })
      .limit(100)
      .toArray();

    if (docs.length === 0) return FALLBACK_EQUIPMENT;
    return docs.map((doc) => serializeEquipment(doc));
  } catch {
    return FALLBACK_EQUIPMENT;
  }
}

export async function getEquipmentBySlug(
  slug: string,
): Promise<PublicEquipment | null> {
  const all = await listPublicEquipment();
  return all.find((item) => item.slug === slug) ?? null;
}

export async function listAdminEquipment(filters?: {
  q?: string;
  category?: string;
  status?: string;
}): Promise<PublicEquipment[]> {
  const db = await tryDb();
  if (!db) return FALLBACK_EQUIPMENT;

  const filter: Filter<EquipmentRecord> = {};
  if (filters?.category && filters.category !== "all" && isEquipmentCategory(filters.category)) {
    filter.category = filters.category;
  }
  if (filters?.status && filters.status !== "all" && isEquipmentStatus(filters.status)) {
    filter.status = filters.status;
  }

  const docs = await db
    .collection<EquipmentRecord>("equipment")
    .find(filter)
    .sort({ name: 1 })
    .limit(200)
    .toArray();

  let rows = docs.map((doc) => serializeEquipment(doc));
  const q = filters?.q?.trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }
  return rows;
}

export async function createEquipment(input: {
  name: string;
  slug?: string;
  category: string;
  description?: string;
  photo?: string;
  pricePerDay?: number;
  depositAmount?: number;
  quantityTotal?: number;
  quantityAvailable?: number;
  status?: string;
  penaltyPerDamage?: number;
}): Promise<PublicEquipment | null> {
  const name = input.name.trim();
  if (!name) throw new Error("Nom requis.");
  if (!isEquipmentCategory(input.category)) {
    throw new Error("Catégorie invalide.");
  }

  const db = await tryDb();
  if (!db) return null;

  const slug = (input.slug?.trim() || slugifyEquipment(name)).toLowerCase();
  if (!slug) throw new Error("Slug invalide.");

  const existing = await db.collection("equipment").findOne({ slug });
  if (existing) throw new Error("Un article avec ce slug existe déjà.");

  const quantityTotal = Math.max(0, Math.floor(Number(input.quantityTotal) || 0));
  let quantityAvailable = Math.floor(
    Number(input.quantityAvailable ?? quantityTotal),
  );
  quantityAvailable = Math.min(quantityTotal, Math.max(0, quantityAvailable));

  const forcedStatus =
    typeof input.status === "string" && isEquipmentStatus(input.status)
      ? input.status
      : undefined;

  const now = new Date();
  const doc: Omit<EquipmentDoc, "_id"> = {
    name,
    slug,
    category: input.category,
    description: input.description?.trim() || "",
    photo: input.photo?.trim() || "/images/event-materiel.jpg",
    pricePerDay: Math.max(0, Number(input.pricePerDay) || 0),
    depositAmount: Math.max(0, Number(input.depositAmount) || 0),
    currency: "XOF",
    quantityTotal,
    quantityAvailable,
    status: deriveEquipmentStatus(quantityAvailable, quantityTotal, forcedStatus),
    penaltyPerDamage: Math.max(0, Number(input.penaltyPerDamage) || 0),
    createdAt: now,
    updatedAt: now,
  };

  if (forcedStatus === "maintenance") {
    doc.status = "maintenance";
  }

  const result = await db.collection("equipment").insertOne(doc);
  return serializeEquipment({ ...doc, _id: result.insertedId });
}

export async function updateEquipment(
  slug: string,
  patch: {
    name?: string;
    category?: string;
    description?: string;
    photo?: string;
    pricePerDay?: number;
    depositAmount?: number;
    quantityTotal?: number;
    quantityAvailable?: number;
    status?: string;
    penaltyPerDamage?: number;
  },
): Promise<PublicEquipment | null> {
  const db = await tryDb();
  if (!db) return null;

  const existing = await db
    .collection<EquipmentRecord>("equipment")
    .findOne({ slug });
  if (!existing) return null;

  const $set: Partial<EquipmentDoc> = { updatedAt: new Date() };

  if (typeof patch.name === "string" && patch.name.trim()) {
    $set.name = patch.name.trim();
  }
  if (typeof patch.category === "string" && isEquipmentCategory(patch.category)) {
    $set.category = patch.category;
  }
  if (typeof patch.description === "string") {
    $set.description = patch.description.trim();
  }
  if (typeof patch.photo === "string" && patch.photo.trim()) {
    $set.photo = patch.photo.trim();
  }
  if (typeof patch.pricePerDay === "number" && Number.isFinite(patch.pricePerDay)) {
    $set.pricePerDay = Math.max(0, patch.pricePerDay);
  }
  if (
    typeof patch.depositAmount === "number" &&
    Number.isFinite(patch.depositAmount)
  ) {
    $set.depositAmount = Math.max(0, patch.depositAmount);
  }
  if (
    typeof patch.penaltyPerDamage === "number" &&
    Number.isFinite(patch.penaltyPerDamage)
  ) {
    $set.penaltyPerDamage = Math.max(0, patch.penaltyPerDamage);
  }

  let quantityTotal = existing.quantityTotal;
  let quantityAvailable = existing.quantityAvailable;

  if (
    typeof patch.quantityTotal === "number" &&
    Number.isFinite(patch.quantityTotal)
  ) {
    quantityTotal = Math.max(0, Math.floor(patch.quantityTotal));
    $set.quantityTotal = quantityTotal;
  }
  if (
    typeof patch.quantityAvailable === "number" &&
    Number.isFinite(patch.quantityAvailable)
  ) {
    quantityAvailable = Math.min(
      quantityTotal,
      Math.max(0, Math.floor(patch.quantityAvailable)),
    );
    $set.quantityAvailable = quantityAvailable;
  } else if ($set.quantityTotal !== undefined) {
    quantityAvailable = Math.min(quantityTotal, quantityAvailable);
    $set.quantityAvailable = quantityAvailable;
  }

  if (typeof patch.status === "string" && isEquipmentStatus(patch.status)) {
    $set.status =
      patch.status === "maintenance"
        ? "maintenance"
        : deriveEquipmentStatus(quantityAvailable, quantityTotal, patch.status);
  } else if (
    $set.quantityAvailable !== undefined ||
    $set.quantityTotal !== undefined
  ) {
    if (existing.status !== "maintenance") {
      $set.status = deriveEquipmentStatus(quantityAvailable, quantityTotal);
    }
  }

  await db.collection("equipment").updateOne({ slug }, { $set });

  if (
    quantityTotal > 0 &&
    quantityAvailable / quantityTotal <= 0.2
  ) {
    void notifyStockLowItem({
      source: "equipment",
      name: ($set.name as string | undefined) ?? existing.name,
      available: quantityAvailable,
      total: quantityTotal,
      ref: slug,
    }).catch(() => undefined);
  }

  return getEquipmentBySlug(slug);
}

export async function deleteEquipment(slug: string): Promise<boolean> {
  const db = await tryDb();
  if (!db) return false;
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return false;
  const result = await db.collection("equipment").deleteOne({ slug: normalized });
  return result.deletedCount === 1;
}

export async function createEventQuote(input: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventDate: string;
  returnDate: string;
  message?: string;
  items: Array<{ slug: string; quantity: number }>;
  status?: QuoteStatus;
}) {
  const days = daysBetween(input.eventDate, input.returnDate);
  const catalog = await listPublicEquipment();
  const lines: EventQuoteLine[] = [];

  for (const item of input.items) {
    const equipment = catalog.find((e) => e.slug === item.slug);
    if (!equipment) {
      throw new Error(`Article introuvable : ${item.slug}`);
    }
    if (equipment.status === "maintenance") {
      throw new Error(`${equipment.name} est en maintenance.`);
    }
    if (item.quantity > equipment.quantityAvailable) {
      throw new Error(
        `Stock insuffisant pour ${equipment.name} (dispo : ${equipment.quantityAvailable}).`,
      );
    }
    lines.push(
      buildQuoteLine({
        equipment,
        quantity: item.quantity,
        days,
      }),
    );
  }

  if (lines.length === 0) {
    throw new Error("Ajoutez au moins un article au devis.");
  }

  const rentalTotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const depositTotal = lines.reduce((sum, line) => sum + line.lineDeposit, 0);
  const now = new Date();
  const status: QuoteStatus =
    input.status && isQuoteStatus(input.status) ? input.status : "envoye";

  const doc: Omit<EventQuoteDoc, "_id"> = {
    clientName: input.clientName,
    clientEmail: input.clientEmail.toLowerCase(),
    clientPhone: input.clientPhone,
    eventDate: input.eventDate,
    returnDate: input.returnDate,
    message: input.message,
    lines,
    rentalTotal,
    depositTotal,
    currency: "XOF",
    status,
    createdAt: now,
    updatedAt: now,
  };

  const db = await tryDb();
  if (!db) {
    return {
      ...serializeEventQuote(doc, `local-quote-${Date.now()}`),
      persisted: false as const,
    };
  }

  const result = await db.collection("eventQuotes").insertOne(doc);
  const id = result.insertedId.toString();

  const { clientId } = await touchClient({
    name: doc.clientName,
    email: doc.clientEmail,
    phone: doc.clientPhone,
    activity: "evenementiel",
    interaction: {
      type: "event_quote",
      title: "Devis événementiel",
      message: `Devis ${lines.length} article(s) · ${doc.eventDate}`,
      refType: "event_quote",
      refId: id,
    },
  });

  if (clientId) {
    await linkProjectAndInvoice({
      clientId,
      clientName: doc.clientName,
      clientEmail: doc.clientEmail,
      activity: "evenementiel",
      title: `Event · ${doc.eventDate}`,
      amount: doc.rentalTotal,
      sourceType: "event_quote",
      sourceId: id,
      invoiceStatus: "brouillon",
      projectStatus: "ouvert",
    });
  }

  return {
    ...serializeEventQuote(doc, id),
    persisted: true as const,
  };
}

export async function listEventQuotes(filters?: {
  q?: string;
  status?: string;
}): Promise<SerializedEventQuote[]> {
  const db = await tryDb();
  if (!db) return [];

  const filter: Filter<QuoteRecord> = {};
  if (filters?.status && filters.status !== "all" && isQuoteStatus(filters.status)) {
    filter.status = filters.status;
  }

  const docs = await db
    .collection<QuoteRecord>("eventQuotes")
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  let rows = docs.map((doc) => serializeEventQuote(doc));
  const q = filters?.q?.trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (r) =>
        r.clientName.toLowerCase().includes(q) ||
        r.clientEmail.toLowerCase().includes(q) ||
        r.clientPhone.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    );
  }
  return rows;
}

export async function getEventQuote(
  id: string,
): Promise<SerializedEventQuote | null> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) return null;
  const doc = await db
    .collection<QuoteRecord>("eventQuotes")
    .findOne({ _id: new ObjectId(id) });
  return doc ? serializeEventQuote(doc) : null;
}

export async function updateEventQuoteStatus(
  id: string,
  status: QuoteStatus,
): Promise<SerializedEventQuote | null> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id) || !isQuoteStatus(status)) return null;

  await db.collection("eventQuotes").updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, updatedAt: new Date() } },
  );

  const quote = await getEventQuote(id);
  if (quote && (status === "accepte" || status === "refuse")) {
    await touchClient({
      name: quote.clientName,
      email: quote.clientEmail,
      phone: quote.clientPhone,
      activity: "evenementiel",
      interaction: {
        type: "event_quote",
        title: status === "accepte" ? "Devis accepté" : "Devis refusé",
        message: `Devis event ${quote.eventDate} · ${status}`,
        refType: "event_quote",
        refId: id,
      },
    });
  }
  return quote;
}

async function adjustStock(
  db: Db,
  slug: string,
  deltaAvailable: number,
): Promise<PublicEquipment | null> {
  const existing = await db
    .collection<EquipmentRecord>("equipment")
    .findOne({ slug });
  if (!existing) throw new Error(`Article introuvable : ${slug}`);

  const quantityAvailable = Math.min(
    existing.quantityTotal,
    Math.max(0, existing.quantityAvailable + deltaAvailable),
  );

  const status =
    existing.status === "maintenance"
      ? "maintenance"
      : deriveEquipmentStatus(quantityAvailable, existing.quantityTotal);

  await db.collection("equipment").updateOne(
    { slug },
    {
      $set: {
        quantityAvailable,
        status,
        updatedAt: new Date(),
      },
    },
  );

  if (
    existing.quantityTotal > 0 &&
    quantityAvailable / existing.quantityTotal <= 0.2
  ) {
    void notifyStockLowItem({
      source: "equipment",
      name: existing.name,
      available: quantityAvailable,
      total: existing.quantityTotal,
      ref: slug,
    }).catch(() => undefined);
  }

  return serializeEquipment({
    ...existing,
    quantityAvailable,
    status,
  });
}

export async function recordMovement(input: {
  equipmentSlug: string;
  type: string;
  quantity: number;
  quoteId?: string;
  note?: string;
  damageReported?: boolean;
  penaltyAmount?: number;
}): Promise<SerializedMovement | null> {
  if (!isMovementType(input.type)) {
    throw new Error("Type de mouvement invalide.");
  }
  const type: MovementType = input.type;
  const quantity = Math.max(1, Math.floor(Number(input.quantity) || 0));
  if (!quantity) throw new Error("Quantité invalide.");

  const db = await tryDb();
  if (!db) return null;

  const equipment = await db
    .collection<EquipmentRecord>("equipment")
    .findOne({ slug: input.equipmentSlug });
  if (!equipment) throw new Error("Article introuvable.");

  if (type === "sortie") {
    if (equipment.status === "maintenance") {
      throw new Error("Article en maintenance — sortie impossible.");
    }
    if (quantity > equipment.quantityAvailable) {
      throw new Error(
        `Stock insuffisant (dispo : ${equipment.quantityAvailable}).`,
      );
    }
    await adjustStock(db, equipment.slug, -quantity);
  } else {
    await adjustStock(db, equipment.slug, quantity);
  }

  let penaltyAmount = Math.max(0, Number(input.penaltyAmount) || 0);
  const damageReported = Boolean(input.damageReported);
  if (type === "retour" && damageReported && !penaltyAmount) {
    penaltyAmount = quantity * (equipment.penaltyPerDamage || 0);
  }

  if (input.quoteId && ObjectId.isValid(input.quoteId)) {
    const quote = await getEventQuote(input.quoteId);
    if (!quote) throw new Error("Devis lié introuvable.");
  }

  const doc: Omit<EquipmentMovementDoc, "_id"> = {
    quoteId: input.quoteId && ObjectId.isValid(input.quoteId) ? input.quoteId : undefined,
    equipmentSlug: equipment.slug,
    type,
    quantity,
    note: input.note?.trim() || undefined,
    damageReported: type === "retour" ? damageReported : false,
    penaltyAmount: type === "retour" ? penaltyAmount : 0,
    createdAt: new Date(),
  };

  const result = await db.collection("equipmentMovements").insertOne(doc);

  return {
    id: result.insertedId.toString(),
    quoteId: doc.quoteId ?? null,
    equipmentSlug: doc.equipmentSlug,
    equipmentName: equipment.name,
    type: doc.type,
    quantity: doc.quantity,
    note: doc.note ?? "",
    damageReported: Boolean(doc.damageReported),
    penaltyAmount: doc.penaltyAmount ?? 0,
    createdAt: toIso(doc.createdAt) ?? new Date().toISOString(),
  };
}

export async function listMovements(filters?: {
  q?: string;
  type?: string;
  quoteId?: string;
}): Promise<SerializedMovement[]> {
  const db = await tryDb();
  if (!db) return [];

  const filter: Filter<MovementRecord> = {};
  if (filters?.type && filters.type !== "all" && isMovementType(filters.type)) {
    filter.type = filters.type;
  }
  if (filters?.quoteId && ObjectId.isValid(filters.quoteId)) {
    filter.quoteId = filters.quoteId;
  }

  const docs = await db
    .collection<MovementRecord>("equipmentMovements")
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  const catalog = await listPublicEquipment();
  const bySlug = new Map(catalog.map((e) => [e.slug, e.name]));

  let rows: SerializedMovement[] = docs.map((doc) => ({
    id: doc._id.toString(),
    quoteId: doc.quoteId ?? null,
    equipmentSlug: doc.equipmentSlug,
    equipmentName: bySlug.get(doc.equipmentSlug) ?? doc.equipmentSlug,
    type: doc.type,
    quantity: doc.quantity,
    note: doc.note ?? "",
    damageReported: Boolean(doc.damageReported),
    penaltyAmount: doc.penaltyAmount ?? 0,
    createdAt: toIso(doc.createdAt) ?? new Date(0).toISOString(),
  }));

  const q = filters?.q?.trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (r) =>
        r.equipmentName.toLowerCase().includes(q) ||
        r.equipmentSlug.toLowerCase().includes(q) ||
        (r.quoteId ?? "").toLowerCase().includes(q) ||
        r.note.toLowerCase().includes(q),
    );
  }

  return rows;
}

export async function getEvenementielStats() {
  const [equipment, quotes, movements] = await Promise.all([
    listAdminEquipment(),
    listEventQuotes(),
    listMovements(),
  ]);

  const available = equipment.filter((e) => e.status === "disponible").length;
  const rented = equipment.filter((e) => e.status === "loue").length;
  const maintenance = equipment.filter((e) => e.status === "maintenance").length;
  const pendingQuotes = quotes.filter(
    (q) => q.status === "envoye" || q.status === "brouillon",
  ).length;
  const acceptedQuotes = quotes.filter((q) => q.status === "accepte").length;
  const rentalValue = quotes
    .filter((q) => q.status === "accepte" || q.status === "envoye")
    .reduce((sum, q) => sum + q.rentalTotal, 0);
  const penalties = movements
    .filter((m) => m.damageReported)
    .reduce((sum, m) => sum + m.penaltyAmount, 0);

  return {
    articles: equipment.length,
    available,
    rented,
    maintenance,
    quotes: quotes.length,
    pendingQuotes,
    acceptedQuotes,
    rentalValue,
    movements: movements.length,
    penalties,
  };
}

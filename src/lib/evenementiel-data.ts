import type { Db } from "mongodb";
import { getDb } from "@/lib/mongodb";
import {
  FALLBACK_EQUIPMENT,
  buildQuoteLine,
  daysBetween,
  serializeEquipment,
  type PublicEquipment,
} from "@/lib/evenementiel";
import type { EquipmentDoc, EventQuoteDoc, EventQuoteLine } from "@/lib/types";
import { linkProjectAndInvoice, touchClient } from "@/lib/crm";

type EquipmentRecord = EquipmentDoc & { _id: { toString(): string } };

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

export async function createEventQuote(input: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventDate: string;
  returnDate: string;
  message?: string;
  items: Array<{ slug: string; quantity: number }>;
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
    status: "envoye",
    createdAt: now,
    updatedAt: now,
  };

  const db = await tryDb();
  if (!db) {
    return {
      ...doc,
      id: `local-quote-${Date.now()}`,
      persisted: false as const,
    };
  }

  const result = await db.collection("eventQuotes").insertOne(doc);

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
      refId: result.insertedId.toString(),
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
      sourceId: result.insertedId.toString(),
      invoiceStatus: "brouillon",
      projectStatus: "ouvert",
    });
  }

  return {
    ...doc,
    id: result.insertedId.toString(),
    persisted: true as const,
  };
}

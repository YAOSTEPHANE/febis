import "server-only";
import { ObjectId, type Db } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { recordPayment } from "@/lib/finance";
import { initiateMobileMoneyPayment } from "@/lib/payment-providers";
import { isPaymentChannel } from "@/lib/payment-providers/types";
import { isMobileMoneyProvider } from "@/lib/types";
import { paymentChannelLabel } from "@/lib/finance-shared";
import { updateReservation } from "@/lib/residences-data";
import { updateOrderStatus } from "@/lib/boutique-data";
import { updateEventQuoteStatus } from "@/lib/evenementiel-data";
import { notifyEvent } from "@/lib/notifications";
import type { Activity, PaymentChannel } from "@/lib/types";
import {
  isPaymentSourceType,
  type PaymentIntentStatus,
  type PaymentSourceType,
  type SerializedPaymentIntent,
} from "@/lib/paiements-shared";

export type {
  PaymentIntentStatus,
  PaymentSourceType,
  SerializedPaymentIntent,
} from "@/lib/paiements-shared";
export {
  isPaymentSourceType,
  isPaymentIntentStatus,
  paymentIntentStatusLabel,
  PAYMENT_SOURCE_TYPES,
  PAYMENT_INTENT_STATUSES,
} from "@/lib/paiements-shared";

type PaymentIntentDoc = {
  _id?: ObjectId;
  reference: string;
  sourceType: PaymentSourceType;
  sourceId: string;
  activity: Activity | "general";
  amount: number;
  currency: "XOF";
  channel: PaymentChannel;
  status: PaymentIntentStatus;
  title: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  instructions?: string;
  merchantPhone?: string;
  merchantName?: string;
  mode?: "manual" | "api";
  providerStatus?: string;
  checkoutUrl?: string;
  externalId?: string;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
};

async function tryDb(): Promise<Db | null> {
  try {
    return await getDb();
  } catch {
    return null;
  }
}

function toIso(value: Date | string | undefined | null) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

function serializeIntent(
  doc: PaymentIntentDoc & { _id: ObjectId },
): SerializedPaymentIntent {
  return {
    id: doc._id.toString(),
    reference: doc.reference,
    sourceType: doc.sourceType,
    sourceId: doc.sourceId,
    activity: String(doc.activity),
    amount: doc.amount,
    currency: "XOF",
    channel: doc.channel,
    status: doc.status,
    title: doc.title,
    clientName: doc.clientName ?? "",
    clientEmail: doc.clientEmail ?? "",
    clientPhone: doc.clientPhone ?? "",
    instructions: doc.instructions ?? "",
    merchantPhone: doc.merchantPhone ?? "",
    merchantName: doc.merchantName ?? "",
    mode: doc.mode ?? "manual",
    providerStatus: doc.providerStatus ?? "",
    checkoutUrl: doc.checkoutUrl ?? "",
    paymentId: doc.paymentId ?? "",
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
    confirmedAt: toIso(doc.confirmedAt),
  };
}

function activityForSource(sourceType: PaymentSourceType): Activity {
  switch (sourceType) {
    case "reservation":
      return "residences";
    case "boutique":
      return "boutique";
    case "evenementiel":
      return "evenementiel";
    case "btp":
      return "btp";
    default: {
      const _exhaustive: never = sourceType;
      return _exhaustive;
    }
  }
}

async function nextReference(db: Db) {
  const year = new Date().getFullYear();
  const counter = await db.collection("counters").findOneAndUpdate(
    { _id: "payment_intents" as unknown as ObjectId },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  const seq = Number(
    (counter as unknown as { seq?: number } | null)?.seq ?? 1,
  );
  return `PAY-${year}-${String(seq).padStart(5, "0")}`;
}

export async function createPaymentIntent(input: {
  sourceType: PaymentSourceType;
  sourceId: string;
  amount: number;
  channel: string;
  title: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
}): Promise<SerializedPaymentIntent> {
  if (!isPaymentSourceType(input.sourceType)) {
    throw new Error("Type de source invalide.");
  }
  if (!isPaymentChannel(input.channel)) {
    throw new Error("Canal de paiement invalide.");
  }
  const amount = Math.max(0, Math.round(Number(input.amount) || 0));
  if (amount < 1) throw new Error("Montant invalide.");
  const sourceId = input.sourceId.trim();
  if (!sourceId) throw new Error("Référence métier manquante.");

  const db = await tryDb();
  if (!db) throw new Error("Base de données indisponible.");

  const activity = activityForSource(input.sourceType);
  const reference = await nextReference(db);
  const now = new Date();

  let instructions = "";
  let merchantPhone: string | undefined;
  let merchantName: string | undefined;
  let mode: "manual" | "api" = "manual";
  let providerStatus = "pending_manual";
  let checkoutUrl: string | undefined;
  let externalId: string | undefined;

  if (isMobileMoneyProvider(input.channel)) {
    const provider = await initiateMobileMoneyPayment({
      provider: input.channel,
      amount,
      currency: "XOF",
      reference,
      customerPhone: input.clientPhone,
      customerName: input.clientName,
      description: input.title,
    });
    if (provider.status === "unavailable") {
      throw new Error(provider.message || "Moyen de paiement indisponible.");
    }
    instructions = provider.instructions;
    merchantPhone = provider.merchantPhone;
    merchantName = provider.merchantName;
    mode = provider.mode;
    providerStatus = provider.status;
    checkoutUrl = provider.checkoutUrl;
    externalId = provider.externalId;
  } else {
    instructions = `Paiement par ${paymentChannelLabel(input.channel)} — conservez votre preuve, confirmation manuelle FEBiS.`;
  }

  const doc: PaymentIntentDoc = {
    reference,
    sourceType: input.sourceType,
    sourceId,
    activity,
    amount,
    currency: "XOF",
    channel: input.channel,
    status: "pending",
    title: input.title.trim() || `Paiement ${reference}`,
    clientName: input.clientName?.trim() || undefined,
    clientEmail: input.clientEmail?.trim().toLowerCase() || undefined,
    clientPhone: input.clientPhone?.trim() || undefined,
    instructions,
    merchantPhone,
    merchantName,
    mode,
    providerStatus,
    checkoutUrl,
    externalId,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db
    .collection<PaymentIntentDoc>("paymentIntents")
    .insertOne(doc);

  return serializeIntent({ ...doc, _id: result.insertedId });
}

export async function getPaymentIntent(
  id: string,
): Promise<SerializedPaymentIntent | null> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) return null;
  const doc = await db
    .collection<PaymentIntentDoc>("paymentIntents")
    .findOne({ _id: new ObjectId(id) });
  return doc?._id ? serializeIntent(doc as PaymentIntentDoc & { _id: ObjectId }) : null;
}

export async function listPendingPaymentIntents(limit = 50) {
  const db = await tryDb();
  if (!db) return [];
  const rows = await db
    .collection<PaymentIntentDoc>("paymentIntents")
    .find({ status: "pending" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return rows
    .filter((r): r is PaymentIntentDoc & { _id: ObjectId } => Boolean(r._id))
    .map(serializeIntent);
}

async function applySourceTransition(intent: PaymentIntentDoc) {
  switch (intent.sourceType) {
    case "reservation":
      await updateReservation(intent.sourceId, { step: "acompte" });
      break;
    case "boutique":
      await updateOrderStatus(intent.sourceId, "confirmee");
      break;
    case "evenementiel":
      await updateEventQuoteStatus(intent.sourceId, "accepte");
      break;
    case "btp":
      // Le prospect public reste en étape prospect ; le paiement BTP est rare.
      break;
    default: {
      const _exhaustive: never = intent.sourceType;
      return _exhaustive;
    }
  }
}

export async function confirmPaymentIntent(
  id: string,
  options?: { note?: string },
): Promise<SerializedPaymentIntent> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) {
    throw new Error("Intent introuvable.");
  }

  const existing = await db
    .collection<PaymentIntentDoc>("paymentIntents")
    .findOne({ _id: new ObjectId(id) });
  if (!existing?._id) throw new Error("Intent introuvable.");
  if (existing.status === "confirmed") {
    return serializeIntent(existing as PaymentIntentDoc & { _id: ObjectId });
  }
  if (existing.status !== "pending") {
    throw new Error("Cet intent n’est plus en attente.");
  }

  const payment = await recordPayment({
    activity: existing.activity,
    channel: existing.channel,
    amount: existing.amount,
    title: existing.title,
    reference: existing.reference,
    clientName: existing.clientName,
    notes:
      options?.note?.trim() ||
      `Confirmation intent ${existing.reference} · ${existing.sourceType}:${existing.sourceId}`,
  });

  if (!payment) throw new Error("Enregistrement du paiement impossible.");

  await applySourceTransition(existing);

  const now = new Date();
  await db.collection("paymentIntents").updateOne(
    { _id: existing._id },
    {
      $set: {
        status: "confirmed",
        paymentId: payment.id,
        updatedAt: now,
        confirmedAt: now,
      },
    },
  );

  void notifyEvent({
    event: "paiement",
    fingerprint: `intent-confirm-${id}`,
    clientEmail: existing.clientEmail,
    clientPhone: existing.clientPhone,
    subject: `FEBiS — Paiement confirmé · ${existing.reference}`,
    body: [
      `Paiement confirmé.`,
      `Réf. ${existing.reference}`,
      `Montant : ${existing.amount.toLocaleString("fr-FR")} FCFA`,
      `Objet : ${existing.title}`,
    ].join("\n"),
    meta: {
      intentId: id,
      sourceType: existing.sourceType,
      sourceId: existing.sourceId,
    },
  }).catch(() => undefined);

  const updated = await getPaymentIntent(id);
  if (!updated) throw new Error("Intent introuvable après confirmation.");
  return updated;
}

export async function failPaymentIntent(id: string, reason?: string) {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) throw new Error("Intent introuvable.");
  const now = new Date();
  const result = await db.collection("paymentIntents").findOneAndUpdate(
    { _id: new ObjectId(id), status: "pending" },
    {
      $set: {
        status: "failed",
        updatedAt: now,
        instructions: reason?.trim() || "Paiement échoué / refusé.",
      },
    },
    { returnDocument: "after" },
  );
  const doc = result as (PaymentIntentDoc & { _id: ObjectId }) | null;
  if (!doc?._id) throw new Error("Intent introuvable ou déjà traité.");
  return serializeIntent(doc);
}

export async function findPendingIntentByReference(reference: string) {
  const db = await tryDb();
  if (!db) return null;
  const doc = await db
    .collection<PaymentIntentDoc>("paymentIntents")
    .findOne({ reference, status: "pending" });
  return doc?._id
    ? serializeIntent(doc as PaymentIntentDoc & { _id: ObjectId })
    : null;
}

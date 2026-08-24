import { ObjectId, type Db } from "mongodb";
import { getDb } from "@/lib/mongodb";

export const NOTIFICATION_CHANNELS = ["email", "whatsapp", "sms"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_EVENTS = [
  "reservation",
  "paiement",
  "echeance",
  "stock_faible",
] as const;
export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

export type NotificationDoc = {
  _id?: string;
  channel: NotificationChannel;
  event: NotificationEvent;
  to: string;
  subject: string;
  body: string;
  status: "queued" | "sent" | "failed" | "simulated";
  meta?: Record<string, string | number | boolean>;
  error?: string;
  createdAt: Date;
  sentAt?: Date;
};

export type SerializedNotification = {
  id: string;
  channel: NotificationChannel;
  event: NotificationEvent;
  to: string;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
  sentAt: string | null;
};

async function tryDb(): Promise<Db | null> {
  try {
    return await getDb();
  } catch {
    return null;
  }
}

function serialize(doc: NotificationDoc & { _id: ObjectId }): SerializedNotification {
  return {
    id: doc._id.toString(),
    channel: doc.channel,
    event: doc.event,
    to: doc.to,
    subject: doc.subject,
    body: doc.body,
    status: doc.status,
    createdAt: new Date(doc.createdAt).toISOString(),
    sentAt: doc.sentAt ? new Date(doc.sentAt).toISOString() : null,
  };
}

export function notificationEventLabel(event: string) {
  switch (event) {
    case "reservation":
      return "Réservation";
    case "paiement":
      return "Paiement";
    case "echeance":
      return "Échéance";
    case "stock_faible":
      return "Stock faible";
    default:
      return event;
  }
}

export function notificationChannelLabel(channel: string) {
  switch (channel) {
    case "email":
      return "Email";
    case "whatsapp":
      return "WhatsApp";
    case "sms":
      return "SMS";
    default:
      return channel;
  }
}

export function getNotificationProviderStatus() {
  return {
    email: Boolean(process.env.SMTP_HOST || process.env.RESEND_API_KEY),
    whatsapp: Boolean(process.env.WHATSAPP_TOKEN || process.env.TWILIO_WHATSAPP_FROM),
    sms: Boolean(process.env.SMS_API_KEY || process.env.TWILIO_ACCOUNT_SID),
    mode:
      process.env.NOTIFICATIONS_MODE === "live" ? ("live" as const) : ("simulate" as const),
  };
}

async function dispatchChannel(
  channel: NotificationChannel,
  to: string,
  subject: string,
  body: string,
): Promise<{ ok: boolean; simulated: boolean; error?: string }> {
  const providers = getNotificationProviderStatus();
  if (providers.mode === "simulate" || !providers[channel]) {
    return { ok: true, simulated: true };
  }

  // Hooks live — à brancher sur le fournisseur retenu en cadrage
  try {
    if (channel === "email" && process.env.RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM ?? "FEBiS <noreply@febis.ci>",
          to: [to],
          subject,
          text: body,
        }),
      });
      if (!res.ok) {
        return { ok: false, simulated: false, error: await res.text() };
      }
      return { ok: true, simulated: false };
    }

    // WhatsApp / SMS : enregistrement live stub jusqu’au fournisseur final
    return {
      ok: false,
      simulated: false,
      error: `Fournisseur ${channel} non configuré (cadrage CDC §4.10).`,
    };
  } catch (error) {
    return {
      ok: false,
      simulated: false,
      error: error instanceof Error ? error.message : "Erreur envoi",
    };
  }
}

export async function enqueueNotification(input: {
  channel: NotificationChannel;
  event: NotificationEvent;
  to: string;
  subject: string;
  body: string;
  meta?: NotificationDoc["meta"];
}): Promise<SerializedNotification | null> {
  const db = await tryDb();
  if (!db) return null;

  const now = new Date();
  const dispatch = await dispatchChannel(
    input.channel,
    input.to,
    input.subject,
    input.body,
  );

  const doc: NotificationDoc = {
    channel: input.channel,
    event: input.event,
    to: input.to.trim(),
    subject: input.subject.trim(),
    body: input.body.trim(),
    status: dispatch.ok
      ? dispatch.simulated
        ? "simulated"
        : "sent"
      : "failed",
    meta: input.meta,
    error: dispatch.error,
    createdAt: now,
    sentAt: dispatch.ok ? now : undefined,
  };

  const result = await db
    .collection<NotificationDoc>("notifications")
    .insertOne(doc as NotificationDoc & { _id?: ObjectId });

  return serialize({ ...doc, _id: result.insertedId } as unknown as NotificationDoc & { _id: ObjectId });
}

export async function notifyAllChannels(input: {
  event: NotificationEvent;
  toEmail?: string;
  toPhone?: string;
  subject: string;
  body: string;
  meta?: NotificationDoc["meta"];
}) {
  const results: SerializedNotification[] = [];
  if (input.toEmail) {
    const n = await enqueueNotification({
      channel: "email",
      event: input.event,
      to: input.toEmail,
      subject: input.subject,
      body: input.body,
      meta: input.meta,
    });
    if (n) results.push(n);
  }
  if (input.toPhone) {
    const wa = await enqueueNotification({
      channel: "whatsapp",
      event: input.event,
      to: input.toPhone,
      subject: input.subject,
      body: input.body,
      meta: input.meta,
    });
    if (wa) results.push(wa);
    const sms = await enqueueNotification({
      channel: "sms",
      event: input.event,
      to: input.toPhone,
      subject: input.subject,
      body: input.body,
      meta: input.meta,
    });
    if (sms) results.push(sms);
  }
  return results;
}

export async function listNotifications(limit = 50): Promise<SerializedNotification[]> {
  const db = await tryDb();
  if (!db) return [];
  const rows = await db
    .collection<NotificationDoc>("notifications")
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return rows
    .filter((r): r is NotificationDoc & { _id: ObjectId } => Boolean(r._id))
    .map(serialize);
}

/** Alerte stocks faibles → notifications direction */
export async function scanLowStockAndNotify(toEmail: string, toPhone?: string) {
  const db = await tryDb();
  if (!db) return [];

  const equipment = await db
    .collection<{
      name: string;
      quantityAvailable: number;
      quantityTotal: number;
    }>("equipment")
    .find({})
    .toArray();

  const low = equipment.filter(
    (e) =>
      e.quantityTotal > 0 && e.quantityAvailable / e.quantityTotal <= 0.2,
  );

  if (low.length === 0) return [];

  const body = low
    .map(
      (e) =>
        `• ${e.name} : ${e.quantityAvailable}/${e.quantityTotal}`,
    )
    .join("\n");

  return notifyAllChannels({
    event: "stock_faible",
    toEmail,
    toPhone,
    subject: `FEBiS — ${low.length} stock(s) faible(s)`,
    body: `Alertes stock événementiel :\n${body}`,
    meta: { count: low.length },
  });
}

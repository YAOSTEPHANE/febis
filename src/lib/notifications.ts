import "server-only";
import { ObjectId, type Db } from "mongodb";
import { getDb } from "@/lib/mongodb";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENTS,
  notificationChannelLabel,
  notificationEventLabel,
  type NotificationChannel,
  type NotificationEvent,
  type SerializedNotification,
} from "@/lib/direction-shared";

export {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENTS,
  notificationChannelLabel,
  notificationEventLabel,
};
export type {
  NotificationChannel,
  NotificationEvent,
  SerializedNotification,
} from "@/lib/direction-shared";

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

  const [equipment, products] = await Promise.all([
    db
      .collection<{
        name: string;
        quantityAvailable: number;
        quantityTotal: number;
      }>("equipment")
      .find({})
      .toArray(),
    db
      .collection<{
        name: string;
        variants?: Array<{ stock?: number }>;
      }>("products")
      .find({})
      .toArray(),
  ]);

  const lowEquip = equipment.filter(
    (e) =>
      e.quantityTotal > 0 && e.quantityAvailable / e.quantityTotal <= 0.2,
  );
  const lowProducts = products
    .map((p) => ({
      name: p.name,
      stock: (p.variants ?? []).reduce(
        (sum, v) => sum + Number(v.stock ?? 0),
        0,
      ),
    }))
    .filter((p) => p.stock <= 2);

  if (lowEquip.length === 0 && lowProducts.length === 0) return [];

  const body = [
    ...lowEquip.map(
      (e) => `• [Évén.] ${e.name} : ${e.quantityAvailable}/${e.quantityTotal}`,
    ),
    ...lowProducts.map(
      (p) => `• [Boutique] ${p.name} : stock ${p.stock}`,
    ),
  ].join("\n");

  return notifyAllChannels({
    event: "stock_faible",
    toEmail,
    toPhone,
    subject: `FEBiS — ${lowEquip.length + lowProducts.length} stock(s) faible(s)`,
    body: `Alertes stock :\n${body}`,
    meta: {
      count: lowEquip.length + lowProducts.length,
    },
  });
}

/** Factures émises depuis > 7 jours → échéances */
export async function scanDueInvoicesAndNotify(
  toEmail: string,
  toPhone?: string,
) {
  const db = await tryDb();
  if (!db) return [];

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const overdue = await db
    .collection("invoices")
    .find({ status: "emise", createdAt: { $lte: cutoff } })
    .sort({ createdAt: 1 })
    .limit(40)
    .toArray();

  if (overdue.length === 0) return [];

  const body = overdue
    .map((inv) => {
      const amount = Number(inv.amount ?? 0);
      return `• ${String(inv.number)} · ${String(inv.clientName)} · ${amount.toLocaleString("fr-FR")} XOF`;
    })
    .join("\n");

  return notifyAllChannels({
    event: "echeance",
    toEmail,
    toPhone,
    subject: `FEBiS — ${overdue.length} échéance(s) / impayé(s)`,
    body: `Factures émises non réglées (> 7 j) :\n${body}`,
    meta: { count: overdue.length },
  });
}

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

async function getOpsRecipients(): Promise<{ email?: string; phone?: string }> {
  const email =
    process.env.NOTIFY_OPS_EMAIL?.trim() ||
    process.env.ADMIN_NOTIFY_EMAIL?.trim() ||
    undefined;
  const phone =
    process.env.NOTIFY_OPS_PHONE?.trim() ||
    process.env.ADMIN_NOTIFY_PHONE?.trim() ||
    undefined;

  if (email) return { email, phone };

  const db = await tryDb();
  if (!db) return { phone };
  const admin = await db.collection("users").findOne(
    { active: true, role: { $in: ["admin", "direction"] } },
    { projection: { email: 1, phone: 1 } },
  );
  return {
    email: typeof admin?.email === "string" ? admin.email : undefined,
    phone:
      phone ||
      (typeof admin?.phone === "string" ? admin.phone : undefined),
  };
}

async function wasRecentlyNotified(
  event: NotificationEvent,
  fingerprint: string,
  withinMs = 12 * 60 * 60 * 1000,
): Promise<boolean> {
  const db = await tryDb();
  if (!db) return false;
  const since = new Date(Date.now() - withinMs);
  const existing = await db.collection("notifications").findOne({
    event,
    "meta.fingerprint": fingerprint,
    createdAt: { $gte: since },
  });
  return Boolean(existing);
}

/** Destinataires ops + client (email/téléphone). */
export async function notifyEvent(input: {
  event: NotificationEvent;
  subject: string;
  body: string;
  clientEmail?: string;
  clientPhone?: string;
  fingerprint?: string;
  meta?: NotificationDoc["meta"];
  /** Si true, n’envoie qu’aux ops (pas au client). */
  opsOnly?: boolean;
}) {
  if (input.fingerprint) {
    const dup = await wasRecentlyNotified(input.event, input.fingerprint);
    if (dup) return [];
  }

  const ops = await getOpsRecipients();
  const results: SerializedNotification[] = [];
  const meta = {
    ...input.meta,
    ...(input.fingerprint ? { fingerprint: input.fingerprint } : {}),
  };

  const opsResults = await notifyAllChannels({
    event: input.event,
    toEmail: ops.email,
    toPhone: ops.phone,
    subject: input.subject,
    body: input.body,
    meta: { ...meta, audience: "ops" },
  });
  results.push(...opsResults);

  if (!input.opsOnly) {
    const clientResults = await notifyAllChannels({
      event: input.event,
      toEmail: input.clientEmail,
      toPhone: input.clientPhone,
      subject: input.subject,
      body: input.body,
      meta: { ...meta, audience: "client" },
    });
    results.push(...clientResults);
  }

  return results;
}

export async function notifyReservationCreated(input: {
  id: string;
  lodgingTitle: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
}) {
  const amount = input.totalAmount.toLocaleString("fr-FR");
  return notifyEvent({
    event: "reservation",
    fingerprint: `reservation-create-${input.id}`,
    clientEmail: input.guestEmail,
    clientPhone: input.guestPhone,
    subject: `FEBiS — Demande de réservation · ${input.lodgingTitle}`,
    body: [
      `Nouvelle demande de réservation.`,
      `Client : ${input.guestName}`,
      `Logement : ${input.lodgingTitle}`,
      `Séjour : ${input.checkIn} → ${input.checkOut} (${input.nights} nuit(s))`,
      `Montant : ${amount} XOF`,
      `Réf. : ${input.id}`,
    ].join("\n"),
    meta: { reservationId: input.id },
  });
}

export async function notifyReservationUpdated(input: {
  id: string;
  lodgingTitle: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  step: string;
  cancelled?: boolean;
}) {
  const label = input.cancelled
    ? "annulée"
    : `étape « ${input.step} »`;
  return notifyEvent({
    event: "reservation",
    fingerprint: `reservation-${input.id}-${input.cancelled ? "cancel" : input.step}`,
    clientEmail: input.guestEmail,
    clientPhone: input.guestPhone,
    subject: `FEBiS — Réservation ${label} · ${input.lodgingTitle}`,
    body: [
      `Mise à jour réservation (${label}).`,
      `Client : ${input.guestName}`,
      `Logement : ${input.lodgingTitle}`,
      `Séjour : ${input.checkIn} → ${input.checkOut}`,
      `Réf. : ${input.id}`,
    ].join("\n"),
    meta: { reservationId: input.id, step: input.step },
  });
}

export async function notifyPaymentReceived(input: {
  id: string;
  title: string;
  amount: number;
  channel: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  invoiceNumber?: string;
  activity: string;
}) {
  const amount = input.amount.toLocaleString("fr-FR");
  return notifyEvent({
    event: "paiement",
    fingerprint: `paiement-${input.id}`,
    clientEmail: input.clientEmail,
    clientPhone: input.clientPhone,
    subject: `FEBiS — Paiement confirmé · ${amount} XOF`,
    body: [
      `Paiement entrant confirmé.`,
      `Titre : ${input.title}`,
      `Montant : ${amount} XOF`,
      `Canal : ${input.channel}`,
      `Activité : ${input.activity}`,
      input.clientName ? `Client : ${input.clientName}` : null,
      input.invoiceNumber ? `Facture : ${input.invoiceNumber}` : null,
      `Réf. : ${input.id}`,
    ]
      .filter(Boolean)
      .join("\n"),
    meta: { paymentId: input.id },
  });
}

export async function notifyInvoiceIssued(input: {
  id: string;
  number: string;
  clientName: string;
  clientEmail?: string;
  amount: number;
}) {
  const amount = input.amount.toLocaleString("fr-FR");
  return notifyEvent({
    event: "echeance",
    fingerprint: `invoice-issue-${input.id}`,
    clientEmail: input.clientEmail,
    subject: `FEBiS — Facture émise · ${input.number}`,
    body: [
      `Facture émise.`,
      `Client : ${input.clientName}`,
      `Numéro : ${input.number}`,
      `Montant : ${amount} XOF`,
      `Merci de procéder au règlement à l’échéance.`,
    ].join("\n"),
    meta: { invoiceId: input.id },
  });
}

export async function notifyStockLowItem(input: {
  source: "equipment" | "product";
  name: string;
  available: number;
  total?: number;
  ref: string;
}) {
  const detail =
    input.total !== undefined
      ? `${input.available}/${input.total}`
      : String(input.available);
  return notifyEvent({
    event: "stock_faible",
    fingerprint: `stock-${input.source}-${input.ref}-${input.available}`,
    opsOnly: true,
    subject: `FEBiS — Stock faible · ${input.name}`,
    body: [
      `Alerte stock faible.`,
      `Article : ${input.name}`,
      `Source : ${input.source === "equipment" ? "Événementiel" : "Boutique"}`,
      `Niveau : ${detail}`,
    ].join("\n"),
    meta: {
      source: input.source,
      ref: input.ref,
      available: input.available,
    },
  });
}

/** Alerte stocks faibles → notifications direction */
export async function scanLowStockAndNotify(toEmail?: string, toPhone?: string) {
  const db = await tryDb();
  if (!db) return [];

  const ops = await getOpsRecipients();
  const email = toEmail?.trim() || ops.email;
  const phone = toPhone?.trim() || ops.phone;

  const [equipment, products] = await Promise.all([
    db
      .collection<{
        name: string;
        slug?: string;
        quantityAvailable: number;
        quantityTotal: number;
      }>("equipment")
      .find({})
      .toArray(),
    db
      .collection<{
        name: string;
        slug?: string;
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
      slug: p.slug ?? p.name,
      stock: (p.variants ?? []).reduce(
        (sum, v) => sum + Number(v.stock ?? 0),
        0,
      ),
    }))
    .filter((p) => p.stock <= 2);

  if (lowEquip.length === 0 && lowProducts.length === 0) return [];

  const fingerprint = `scan-stock-${new Date().toISOString().slice(0, 10)}`;
  if (await wasRecentlyNotified("stock_faible", fingerprint, 6 * 60 * 60 * 1000)) {
    return [];
  }

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
    toEmail: email,
    toPhone: phone,
    subject: `FEBiS — ${lowEquip.length + lowProducts.length} stock(s) faible(s)`,
    body: `Alertes stock :\n${body}`,
    meta: {
      count: lowEquip.length + lowProducts.length,
      fingerprint,
      audience: "ops",
    },
  });
}

/** Factures émises depuis > 7 jours → échéances */
export async function scanDueInvoicesAndNotify(
  toEmail?: string,
  toPhone?: string,
) {
  const db = await tryDb();
  if (!db) return [];

  const ops = await getOpsRecipients();
  const email = toEmail?.trim() || ops.email;
  const phone = toPhone?.trim() || ops.phone;

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const overdue = await db
    .collection("invoices")
    .find({ status: "emise", createdAt: { $lte: cutoff } })
    .sort({ createdAt: 1 })
    .limit(40)
    .toArray();

  if (overdue.length === 0) return [];

  const fingerprint = `scan-echeance-${new Date().toISOString().slice(0, 10)}`;
  if (await wasRecentlyNotified("echeance", fingerprint, 12 * 60 * 60 * 1000)) {
    return [];
  }

  const body = overdue
    .map((inv) => {
      const amount = Number(inv.amount ?? 0);
      return `• ${String(inv.number)} · ${String(inv.clientName)} · ${amount.toLocaleString("fr-FR")} XOF`;
    })
    .join("\n");

  const results = await notifyAllChannels({
    event: "echeance",
    toEmail: email,
    toPhone: phone,
    subject: `FEBiS — ${overdue.length} échéance(s) / impayé(s)`,
    body: `Factures émises non réglées (> 7 j) :\n${body}`,
    meta: { count: overdue.length, fingerprint, audience: "ops" },
  });

  // Notifie aussi chaque client concerné (email facture)
  for (const inv of overdue.slice(0, 20)) {
    const clientEmail =
      typeof inv.clientEmail === "string" ? inv.clientEmail : undefined;
    if (!clientEmail) continue;
    const amount = Number(inv.amount ?? 0).toLocaleString("fr-FR");
    const fp = `echeance-client-${String(inv._id)}`;
    if (await wasRecentlyNotified("echeance", fp, 3 * 24 * 60 * 60 * 1000)) {
      continue;
    }
    const clientNotifs = await notifyAllChannels({
      event: "echeance",
      toEmail: clientEmail,
      subject: `FEBiS — Rappel d’échéance · ${String(inv.number)}`,
      body: [
        `Bonjour ${String(inv.clientName ?? "")},`,
        `Votre facture ${String(inv.number)} de ${amount} XOF est en attente de règlement.`,
        `Merci de procéder au paiement ou de nous contacter.`,
      ].join("\n"),
      meta: { fingerprint: fp, audience: "client", invoiceId: String(inv._id) },
    });
    results.push(...clientNotifs);
  }

  return results;
}

/** Scans périodiques (stock + échéances) — anti-doublon intégré. */
export async function runAutomaticNotificationScans() {
  const [stock, due] = await Promise.all([
    scanLowStockAndNotify(),
    scanDueInvoicesAndNotify(),
  ]);
  return { stock, due };
}

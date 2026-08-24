import "server-only";
import { ObjectId, type Db } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type {
  Activity,
  ExpenseCategory,
  ExpenseDoc,
  InvoiceDoc,
  PaymentChannel,
  PaymentDoc,
  PaymentDirection,
} from "@/lib/types";
import { ACTIVITIES, PAYMENT_CHANNELS } from "@/lib/types";
import {
  activityLabel,
  expenseCategoryLabel,
  formatXof,
  paymentChannelLabel,
  type ActivityMoneyRow,
  type ChannelMoneyRow,
  type FinanceDashboard,
  type SerializedExpense,
  type SerializedPayment,
  type SerializedUnpaid,
} from "@/lib/finance-shared";

export {
  activityLabel,
  expenseCategoryLabel,
  formatXof,
  paymentChannelLabel,
};
export type {
  ActivityMoneyRow,
  ChannelMoneyRow,
  FinanceDashboard,
  SerializedExpense,
  SerializedPayment,
  SerializedUnpaid,
} from "@/lib/finance-shared";

async function tryDb(): Promise<Db | null> {
  try {
    return await getDb();
  } catch {
    return null;
  }
}

function toIso(value: Date | string | undefined | null) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function emptyActivityRows(): ActivityMoneyRow[] {
  return ACTIVITIES.map((activity) => ({
    activity,
    label: activityLabel(activity),
    revenue: 0,
    expenses: 0,
    net: 0,
    unpaid: 0,
  }));
}

function emptyChannelRows(): ChannelMoneyRow[] {
  return PAYMENT_CHANNELS.map((channel) => ({
    channel,
    label: paymentChannelLabel(channel),
    inbound: 0,
    outbound: 0,
    count: 0,
  }));
}

function serializeExpense(doc: ExpenseDoc & { _id: ObjectId }): SerializedExpense {
  return {
    id: doc._id.toString(),
    activity: doc.activity,
    category: doc.category,
    title: doc.title,
    amount: doc.amount,
    paymentChannel: doc.paymentChannel ?? "",
    reference: doc.reference ?? "",
    notes: doc.notes ?? "",
    spentAt: toIso(doc.spentAt) ?? new Date(0).toISOString(),
    createdAt: toIso(doc.createdAt) ?? new Date(0).toISOString(),
  };
}

function serializePayment(doc: PaymentDoc & { _id: ObjectId }): SerializedPayment {
  return {
    id: doc._id.toString(),
    activity: String(doc.activity),
    channel: doc.channel,
    direction: doc.direction,
    amount: doc.amount,
    status: doc.status,
    title: doc.title,
    reference: doc.reference ?? "",
    clientName: doc.clientName ?? "",
    invoiceId: doc.invoiceId ?? "",
    invoiceNumber: doc.invoiceNumber ?? "",
    paidAt: toIso(doc.paidAt) ?? new Date(0).toISOString(),
    createdAt: toIso(doc.createdAt) ?? new Date(0).toISOString(),
  };
}

function serializeUnpaid(doc: InvoiceDoc & { _id: ObjectId }): SerializedUnpaid {
  const created = doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt);
  const ageDays = Math.max(
    0,
    Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)),
  );
  return {
    id: doc._id.toString(),
    number: doc.number,
    clientName: doc.clientName,
    activity: String(doc.activity),
    title: doc.title,
    amount: doc.amount,
    status: doc.status,
    createdAt: toIso(doc.createdAt) ?? new Date(0).toISOString(),
    ageDays,
  };
}

export async function getFinanceDashboard(): Promise<FinanceDashboard> {
  const empty: FinanceDashboard = {
    totals: {
      revenue: 0,
      expenses: 0,
      net: 0,
      unpaid: 0,
      unpaidCount: 0,
      paymentsIn: 0,
      paymentsOut: 0,
    },
    byActivity: emptyActivityRows(),
    byChannel: emptyChannelRows(),
    unpaid: [],
    recentPayments: [],
    recentExpenses: [],
  };

  const db = await tryDb();
  if (!db) return empty;

  const byActivity = emptyActivityRows();
  const byChannel = emptyChannelRows();
  const activityIndex = Object.fromEntries(
    byActivity.map((row, i) => [row.activity, i]),
  ) as Record<Activity, number>;
  const channelIndex = Object.fromEntries(
    byChannel.map((row, i) => [row.channel, i]),
  ) as Record<PaymentChannel, number>;

  const [invoices, expenses, payments] = await Promise.all([
    db.collection<InvoiceDoc>("invoices").find({}).limit(2000).toArray(),
    db.collection<ExpenseDoc>("expenses").find({}).limit(2000).toArray(),
    db.collection<PaymentDoc>("payments").find({}).limit(2000).toArray(),
  ]);

  let revenue = 0;
  let unpaidTotal = 0;
  const unpaidList: SerializedUnpaid[] = [];

  for (const inv of invoices) {
    if (!inv._id) continue;
    const activity =
      inv.activity !== "general" && ACTIVITIES.includes(inv.activity as Activity)
        ? (inv.activity as Activity)
        : null;

    if (inv.status === "payee") {
      revenue += inv.amount;
      if (activity != null) {
        byActivity[activityIndex[activity]]!.revenue += inv.amount;
      }
    }

    if (inv.status === "emise") {
      unpaidTotal += inv.amount;
      unpaidList.push(serializeUnpaid(inv as InvoiceDoc & { _id: ObjectId }));
      if (activity != null) {
        byActivity[activityIndex[activity]]!.unpaid += inv.amount;
      }
    }
  }

  let expenseTotal = 0;
  for (const exp of expenses) {
    if (!exp._id) continue;
    expenseTotal += exp.amount;
    if (ACTIVITIES.includes(exp.activity)) {
      byActivity[activityIndex[exp.activity]]!.expenses += exp.amount;
    }
  }

  let paymentsIn = 0;
  let paymentsOut = 0;
  for (const pay of payments) {
    if (!pay._id || pay.status !== "confirme") continue;
    const idx = channelIndex[pay.channel];
    if (idx == null) continue;
    byChannel[idx]!.count += 1;
    if (pay.direction === "entrant") {
      paymentsIn += pay.amount;
      byChannel[idx]!.inbound += pay.amount;
    } else {
      paymentsOut += pay.amount;
      byChannel[idx]!.outbound += pay.amount;
    }
  }

  for (const row of byActivity) {
    row.net = row.revenue - row.expenses;
  }

  unpaidList.sort((a, b) => b.ageDays - a.ageDays);

  const recentPayments = payments
    .filter((p): p is PaymentDoc & { _id: ObjectId } => Boolean(p._id))
    .sort(
      (a, b) =>
        new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
    )
    .slice(0, 12)
    .map(serializePayment);

  const recentExpenses = expenses
    .filter((e): e is ExpenseDoc & { _id: ObjectId } => Boolean(e._id))
    .sort(
      (a, b) =>
        new Date(b.spentAt).getTime() - new Date(a.spentAt).getTime(),
    )
    .slice(0, 12)
    .map(serializeExpense);

  return {
    totals: {
      revenue,
      expenses: expenseTotal,
      net: revenue - expenseTotal,
      unpaid: unpaidTotal,
      unpaidCount: unpaidList.length,
      paymentsIn,
      paymentsOut,
    },
    byActivity,
    byChannel,
    unpaid: unpaidList.slice(0, 50),
    recentPayments,
    recentExpenses,
  };
}

export async function listExpenses(filters?: {
  activity?: string;
}): Promise<SerializedExpense[]> {
  const db = await tryDb();
  if (!db) return [];
  const query: Record<string, unknown> = {};
  if (filters?.activity && filters.activity !== "all") {
    query.activity = filters.activity;
  }
  const rows = await db
    .collection<ExpenseDoc>("expenses")
    .find(query)
    .sort({ spentAt: -1 })
    .limit(200)
    .toArray();
  return rows
    .filter((row): row is ExpenseDoc & { _id: ObjectId } => Boolean(row._id))
    .map(serializeExpense);
}

export async function listPayments(filters?: {
  channel?: string;
  activity?: string;
  direction?: string;
}): Promise<SerializedPayment[]> {
  const db = await tryDb();
  if (!db) return [];
  const query: Record<string, unknown> = {};
  if (filters?.channel && filters.channel !== "all") {
    query.channel = filters.channel;
  }
  if (filters?.activity && filters.activity !== "all") {
    query.activity = filters.activity;
  }
  if (filters?.direction && filters.direction !== "all") {
    query.direction = filters.direction;
  }
  const rows = await db
    .collection<PaymentDoc>("payments")
    .find(query)
    .sort({ paidAt: -1 })
    .limit(200)
    .toArray();
  return rows
    .filter((row): row is PaymentDoc & { _id: ObjectId } => Boolean(row._id))
    .map(serializePayment);
}

export async function createExpense(input: {
  activity: Activity;
  category: ExpenseCategory;
  title: string;
  amount: number;
  paymentChannel?: PaymentChannel;
  reference?: string;
  notes?: string;
  spentAt?: string;
}): Promise<SerializedExpense | null> {
  const db = await tryDb();
  if (!db) return null;

  const now = new Date();
  const spentAt = input.spentAt ? new Date(input.spentAt) : now;
  const doc: ExpenseDoc = {
    activity: input.activity,
    category: input.category,
    title: input.title.trim(),
    amount: Math.max(0, Math.round(input.amount)),
    currency: "XOF",
    paymentChannel: input.paymentChannel,
    reference: input.reference?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    spentAt: Number.isNaN(spentAt.getTime()) ? now : spentAt,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db
    .collection<ExpenseDoc>("expenses")
    .insertOne(doc as ExpenseDoc & { _id?: ObjectId });

  if (input.paymentChannel) {
    await db.collection<PaymentDoc>("payments").insertOne({
      activity: input.activity,
      channel: input.paymentChannel,
      direction: "sortant",
      amount: doc.amount,
      currency: "XOF",
      status: "confirme",
      title: `Dépense · ${doc.title}`,
      reference: doc.reference,
      notes: doc.notes,
      paidAt: doc.spentAt,
      createdAt: now,
      updatedAt: now,
    } as PaymentDoc & { _id?: ObjectId });
  }

  return serializeExpense({ ...doc, _id: result.insertedId } as unknown as ExpenseDoc & { _id: ObjectId });
}

export async function recordPayment(input: {
  activity: Activity | "general";
  channel: PaymentChannel;
  direction?: PaymentDirection;
  amount: number;
  title: string;
  reference?: string;
  clientId?: string;
  clientName?: string;
  invoiceId?: string;
  notes?: string;
  markInvoicePaid?: boolean;
}): Promise<SerializedPayment | null> {
  const db = await tryDb();
  if (!db) return null;

  const now = new Date();
  let invoiceNumber: string | undefined;
  let clientName = input.clientName;
  let clientId = input.clientId;
  let activity = input.activity;
  let amount = Math.max(0, Math.round(input.amount));

  if (input.invoiceId && ObjectId.isValid(input.invoiceId)) {
    const invoice = await db.collection("invoices").findOne({
      _id: new ObjectId(input.invoiceId),
    });
    if (invoice) {
      const inv = invoice as InvoiceDoc & { _id: ObjectId };
      invoiceNumber = inv.number;
      clientName = clientName || inv.clientName;
      clientId = clientId || inv.clientId;
      activity =
        inv.activity === "general"
          ? "general"
          : (inv.activity as Activity);
      if (!amount) amount = inv.amount;

      if (input.markInvoicePaid !== false) {
        await db.collection("invoices").updateOne(
          { _id: new ObjectId(input.invoiceId) },
          { $set: { status: "payee", updatedAt: now } },
        );
      }
    }
  }

  const doc: PaymentDoc = {
    activity,
    channel: input.channel,
    direction: input.direction ?? "entrant",
    amount,
    currency: "XOF",
    status: "confirme",
    title: input.title.trim(),
    reference: input.reference?.trim() || undefined,
    clientId,
    clientName,
    invoiceId: input.invoiceId,
    invoiceNumber,
    notes: input.notes?.trim() || undefined,
    paidAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db
    .collection<PaymentDoc>("payments")
    .insertOne(doc as PaymentDoc & { _id?: ObjectId });

  return serializePayment({ ...doc, _id: result.insertedId } as unknown as PaymentDoc & { _id: ObjectId });
}

export async function listUnpaidInvoices(): Promise<SerializedUnpaid[]> {
  const db = await tryDb();
  if (!db) return [];
  const rows = await db
    .collection<InvoiceDoc>("invoices")
    .find({ status: "emise" })
    .sort({ createdAt: 1 })
    .limit(200)
    .toArray();
  return rows
    .filter((row): row is InvoiceDoc & { _id: ObjectId } => Boolean(row._id))
    .map(serializeUnpaid);
}

/** Passe une facture brouillon en émise (devient un impayé suivi). */
export async function issueInvoice(invoiceId: string): Promise<boolean> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(invoiceId)) return false;
  const result = await db.collection("invoices").updateOne(
    { _id: new ObjectId(invoiceId), status: "brouillon" },
    { $set: { status: "emise", updatedAt: new Date() } },
  );
  return result.modifiedCount > 0;
}

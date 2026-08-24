import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { ObjectId, type Db } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getFinanceDashboard } from "@/lib/finance";
import {
  activityLabel,
  billingTypeLabel,
  formatXof,
  isBillingDocType,
  type SerializedBillingDoc,
} from "@/lib/facturation-shared";
import type {
  Activity,
  BillingDocType,
  BillingDocumentDoc,
  BillingLine,
  EventQuoteDoc,
  InvoiceDoc,
  ReservationDoc,
  ShopOrderDoc,
} from "@/lib/types";
import { linkProjectAndInvoice, touchClient } from "@/lib/crm";

export {
  activityLabel,
  billingTypeLabel,
  formatXof,
  isBillingDocType,
};
export type { SerializedBillingDoc } from "@/lib/facturation-shared";

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

function serializeDoc(
  doc: BillingDocumentDoc & { _id: ObjectId },
): SerializedBillingDoc {
  return {
    id: doc._id.toString(),
    type: doc.type,
    number: doc.number,
    title: doc.title,
    activity: String(doc.activity),
    clientName: doc.clientName,
    clientEmail: doc.clientEmail ?? "",
    clientPhone: doc.clientPhone ?? "",
    subtotal: doc.subtotal,
    taxAmount: doc.taxAmount,
    total: doc.total,
    currency: "XOF",
    notes: doc.notes ?? "",
    sourceType: doc.sourceType ?? "",
    sourceId: doc.sourceId ?? "",
    createdAt: toIso(doc.createdAt) ?? new Date(0).toISOString(),
  };
}

async function nextNumber(db: Db, type: BillingDocType) {
  const prefixMap: Record<BillingDocType, string> = {
    devis: "DEV",
    facture: "FAC",
    recu: "REC",
    contrat: "CTR",
    rapport: "RPT",
  };
  const counters = db.collection<{ _id: string; seq: number }>("counters");
  const result = await counters.findOneAndUpdate(
    { _id: `billing_${type}` },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  const seq = result?.seq ?? 1;
  return `${prefixMap[type]}-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`;
}

export async function listBillingDocuments(filters?: {
  type?: BillingDocType | "all";
}): Promise<SerializedBillingDoc[]> {
  const db = await tryDb();
  if (!db) return [];
  const query =
    filters?.type && filters.type !== "all" ? { type: filters.type } : {};
  const rows = await db
    .collection<BillingDocumentDoc>("billingDocuments")
    .find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
  return rows
    .filter((row): row is BillingDocumentDoc & { _id: ObjectId } => Boolean(row._id))
    .map(serializeDoc);
}

export async function getBillingDocument(id: string) {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(id)) return null;
  const doc = await db
    .collection("billingDocuments")
    .findOne({ _id: new ObjectId(id) });
  if (!doc?._id) return null;
  return doc as BillingDocumentDoc & { _id: ObjectId };
}

type CreateBillingInput = {
  type: BillingDocType;
  title: string;
  activity?: Activity | "general";
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientCompany?: string;
  lines: BillingLine[];
  taxRate?: number;
  notes?: string;
  validUntil?: string;
  sourceType?: BillingDocumentDoc["sourceType"];
  sourceId?: string;
  meta?: BillingDocumentDoc["meta"];
};

export async function createBillingDocument(
  input: CreateBillingInput,
): Promise<SerializedBillingDoc | null> {
  const db = await tryDb();
  if (!db) return null;

  const now = new Date();
  const lines = input.lines.map((line) => ({
    label: line.label,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    total: Math.round(line.quantity * line.unitPrice),
  }));
  const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
  const taxRate = input.taxRate ?? 0;
  const taxAmount = Math.round(subtotal * (taxRate / 100));
  const total = subtotal + taxAmount;
  const number = await nextNumber(db, input.type);

  const doc: BillingDocumentDoc = {
    type: input.type,
    number,
    title: input.title.trim(),
    activity: input.activity ?? "general",
    clientId: input.clientId,
    clientName: input.clientName.trim(),
    clientEmail: input.clientEmail?.trim().toLowerCase(),
    clientPhone: input.clientPhone?.trim(),
    clientCompany: input.clientCompany?.trim(),
    lines,
    subtotal,
    taxRate,
    taxAmount,
    total,
    currency: "XOF",
    notes: input.notes?.trim(),
    validUntil: input.validUntil,
    sourceType: input.sourceType ?? "manual",
    sourceId: input.sourceId,
    meta: input.meta,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db
    .collection<BillingDocumentDoc>("billingDocuments")
    .insertOne(doc as BillingDocumentDoc & { _id?: ObjectId });

  const docId = result.insertedId.toString();

  // Sync CRM transversal (CDC §4.6) — fiche client + historique
  try {
    const activity =
      doc.activity === "residences" ||
      doc.activity === "btp" ||
      doc.activity === "evenementiel" ||
      doc.activity === "boutique"
        ? doc.activity
        : "general";

    const { clientId } = await touchClient({
      name: doc.clientName,
      email: doc.clientEmail,
      phone: doc.clientPhone,
      company: doc.clientCompany,
      activity,
      interaction: {
        type: doc.type === "facture" || doc.type === "devis" ? "facture" : "note",
        title: `${doc.type.toUpperCase()} ${doc.number}`,
        message: `${doc.title} · ${doc.total} XOF`,
        refType: "invoice",
        refId: docId,
      },
    });

    if (clientId && (doc.type === "facture" || doc.type === "devis")) {
      await db.collection("billingDocuments").updateOne(
        { _id: result.insertedId } as never,
        { $set: { clientId } },
      );
      await linkProjectAndInvoice({
        clientId,
        clientName: doc.clientName,
        clientEmail: doc.clientEmail,
        activity,
        title: doc.title,
        amount: doc.total,
        sourceType: "manual",
        sourceId: docId,
        invoiceStatus: doc.type === "facture" ? "emise" : "brouillon",
        projectStatus: "ouvert",
      });
    }
  } catch {
    // Ne bloque pas la facturation si le CRM est indisponible
  }

  return serializeDoc({ ...doc, _id: result.insertedId } as unknown as BillingDocumentDoc & { _id: ObjectId });
}

export async function generateFromSource(input: {
  type: BillingDocType;
  sourceType:
    | "event_quote"
    | "invoice"
    | "reservation"
    | "shop_order"
    | "btp";
  sourceId: string;
}): Promise<SerializedBillingDoc | null> {
  const db = await tryDb();
  if (!db || !ObjectId.isValid(input.sourceId)) return null;

  if (input.sourceType === "event_quote") {
    const quote = await db.collection("eventQuotes").findOne({
      _id: new ObjectId(input.sourceId),
    });
    if (!quote) return null;
    const q = quote as EventQuoteDoc & { _id: ObjectId };
    return createBillingDocument({
      type: input.type,
      title: `Prestation événementielle · ${q.eventDate}`,
      activity: "evenementiel",
      clientName: q.clientName,
      clientEmail: q.clientEmail,
      clientPhone: q.clientPhone,
      lines: q.lines.map((line) => ({
        label: `${line.equipmentName} (${line.days} j)`,
        quantity: line.quantity,
        unitPrice: line.unitPrice * line.days,
        total: line.lineTotal,
      })),
      notes: `Caution estimée : ${formatXof(q.depositTotal)}. ${q.message ?? ""}`.trim(),
      sourceType: "event_quote",
      sourceId: input.sourceId,
      meta: {
        eventDate: q.eventDate,
        returnDate: q.returnDate,
        depositTotal: q.depositTotal,
      },
    });
  }

  if (input.sourceType === "invoice") {
    const invoice = await db.collection("invoices").findOne({
      _id: new ObjectId(input.sourceId),
    });
    if (!invoice) return null;
    const inv = invoice as InvoiceDoc & { _id: ObjectId };
    return createBillingDocument({
      type: input.type,
      title: inv.title,
      activity: inv.activity,
      clientId: inv.clientId,
      clientName: inv.clientName,
      clientEmail: inv.clientEmail,
      lines: [
        {
          label: inv.title,
          quantity: 1,
          unitPrice: inv.amount,
          total: inv.amount,
        },
      ],
      sourceType: "invoice",
      sourceId: input.sourceId,
      meta: { invoiceNumber: inv.number, invoiceStatus: inv.status },
    });
  }

  if (input.sourceType === "reservation") {
    const reservation = await db.collection("reservations").findOne({
      _id: new ObjectId(input.sourceId),
    });
    if (!reservation) return null;
    const r = reservation as ReservationDoc & { _id: ObjectId };
    return createBillingDocument({
      type: input.type,
      title: `Séjour · ${r.lodgingTitle}`,
      activity: "residences",
      clientName: r.guestName,
      clientEmail: r.guestEmail,
      clientPhone: r.guestPhone,
      lines: [
        {
          label: `${r.lodgingTitle} · ${r.nights} nuit(s)`,
          quantity: r.nights,
          unitPrice: Math.round(r.totalAmount / Math.max(1, r.nights)),
          total: r.totalAmount,
        },
      ],
      notes: `Acompte prévu : ${formatXof(r.depositAmount)}. ${r.checkIn} → ${r.checkOut}`,
      sourceType: "reservation",
      sourceId: input.sourceId,
    });
  }

  if (input.sourceType === "btp") {
    const project = await db.collection("btpProjects").findOne({
      _id: new ObjectId(input.sourceId),
    });
    if (!project) return null;
    const p = project as {
      _id: ObjectId;
      title: string;
      clientName: string;
      clientEmail?: string;
      clientPhone?: string;
      clientCompany?: string;
      quoteAmount?: number;
      contractAmount?: number;
      location?: string;
      reference?: string;
    };
    const amount = p.contractAmount || p.quoteAmount || 0;
    return createBillingDocument({
      type: input.type,
      title: `BTP · ${p.title}`,
      activity: "btp",
      clientName: p.clientName,
      clientEmail: p.clientEmail,
      clientPhone: p.clientPhone,
      clientCompany: p.clientCompany,
      lines: [
        {
          label: `${p.reference ?? "Chantier"} · ${p.location ?? ""}`.trim(),
          quantity: 1,
          unitPrice: amount,
          total: amount,
        },
      ],
      notes:
        input.type === "contrat"
          ? "Contrat de travaux FEBiS — exécution selon planning convenu."
          : undefined,
      sourceType: "btp",
      sourceId: input.sourceId,
      meta: { btpProjectId: input.sourceId },
    });
  }

  const order = await db.collection("shopOrders").findOne({
    _id: new ObjectId(input.sourceId),
  });
  if (!order) return null;
  const o = order as ShopOrderDoc & { _id: ObjectId };
  return createBillingDocument({
    type: input.type,
    title: `Commande boutique ${o.orderNumber}`,
    activity: "boutique",
    clientName: o.clientName,
    clientEmail: o.clientEmail,
    clientPhone: o.clientPhone,
    lines: o.lines.map((line) => ({
      label: `${line.productName}${line.size || line.color ? ` (${[line.color, line.size].filter(Boolean).join(" / ")})` : ""}`,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: line.lineTotal,
    })),
    notes: o.deliveryAddress,
    sourceType: "shop_order",
    sourceId: input.sourceId,
  });
}

/** Duplique un document vers un autre type (ex. devis → facture / contrat / reçu). */
export async function convertBillingDocument(
  id: string,
  toType: BillingDocType,
): Promise<SerializedBillingDoc | null> {
  const source = await getBillingDocument(id);
  if (!source) return null;

  return createBillingDocument({
    type: toType,
    title: source.title,
    activity: source.activity,
    clientId: source.clientId,
    clientName: source.clientName,
    clientEmail: source.clientEmail,
    clientPhone: source.clientPhone,
    clientCompany: source.clientCompany,
    lines: source.lines,
    taxRate: source.taxRate,
    notes:
      toType === "recu"
        ? `Reçu établi à partir de ${source.number}. ${source.notes ?? ""}`.trim()
        : toType === "contrat"
          ? `Contrat établi à partir de ${source.number}. ${source.notes ?? ""}`.trim()
          : source.notes,
    validUntil: source.validUntil,
    sourceType: "manual",
    sourceId: id,
    meta: {
      convertedFrom: source.number,
      convertedFromType: source.type,
    },
  });
}

export async function generateFinanceReport(): Promise<SerializedBillingDoc | null> {
  const dashboard = await getFinanceDashboard();
  const lines: BillingLine[] = dashboard.byActivity.map((row) => ({
    label: `CA ${row.label}`,
    quantity: 1,
    unitPrice: row.revenue,
    total: row.revenue,
  }));

  lines.push(
    ...dashboard.byActivity.map((row) => ({
      label: `Dépenses ${row.label}`,
      quantity: 1,
      unitPrice: -row.expenses,
      total: -row.expenses,
    })),
  );

  return createBillingDocument({
    type: "rapport",
    title: `Rapport financier FEBiS · ${new Date().toLocaleDateString("fr-FR")}`,
    activity: "general",
    clientName: "Direction FEBiS",
    clientEmail: "direction@febis.ci",
    lines: lines.filter((l) => l.total !== 0).length
      ? lines.filter((l) => l.total !== 0)
      : [
          {
            label: "Aucune écriture sur la période",
            quantity: 1,
            unitPrice: 0,
            total: 0,
          },
        ],
    notes: `Revenus ${formatXof(dashboard.totals.revenue)} · Dépenses ${formatXof(dashboard.totals.expenses)} · Net ${formatXof(dashboard.totals.net)} · Impayés ${formatXof(dashboard.totals.unpaid)} (${dashboard.totals.unpaidCount})`,
    sourceType: "report",
    meta: {
      revenue: dashboard.totals.revenue,
      expenses: dashboard.totals.expenses,
      net: dashboard.totals.net,
      unpaid: dashboard.totals.unpaid,
    },
  });
}

/* ——— PDF rendering ——— */

const FEBIS_RED = rgb(0.843, 0.098, 0.125);
const INK = rgb(0.1, 0.07, 0.06);
const MUTED = rgb(0.35, 0.3, 0.28);
const GOLD = rgb(0.83, 0.66, 0.29);

function drawHeader(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  title: string,
  number: string,
) {
  const { width, height } = page.getSize();
  page.drawRectangle({
    x: 0,
    y: height - 72,
    width,
    height: 72,
    color: rgb(0.1, 0.07, 0.06),
  });
  page.drawText("FEBiS", {
    x: 48,
    y: height - 42,
    size: 22,
    font: bold,
    color: GOLD,
  });
  page.drawText("NOYA Industries · Plateforme digitale", {
    x: 48,
    y: height - 58,
    size: 9,
    font,
    color: rgb(0.85, 0.8, 0.75),
  });
  page.drawText(title.toUpperCase(), {
    x: width - 220,
    y: height - 38,
    size: 14,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(number, {
    x: width - 220,
    y: height - 54,
    size: 10,
    font,
    color: GOLD,
  });
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function buildBillingPdf(
  doc: BillingDocumentDoc,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([595, 842]);
  const { width, height } = page.getSize();

  drawHeader(
    page,
    font,
    bold,
    billingTypeLabel(doc.type),
    doc.number,
  );

  let y = height - 110;
  page.drawText(doc.title, {
    x: 48,
    y,
    size: 16,
    font: bold,
    color: INK,
  });
  y -= 22;
  page.drawText(`Activité : ${activityLabel(String(doc.activity))}`, {
    x: 48,
    y,
    size: 10,
    font,
    color: MUTED,
  });
  page.drawText(
    `Date : ${new Date(doc.createdAt).toLocaleDateString("fr-FR")}`,
    {
      x: width - 180,
      y,
      size: 10,
      font,
      color: MUTED,
    },
  );

  y -= 36;
  page.drawText("Client", {
    x: 48,
    y,
    size: 11,
    font: bold,
    color: FEBIS_RED,
  });
  y -= 16;
  page.drawText(doc.clientName, { x: 48, y, size: 12, font: bold, color: INK });
  y -= 14;
  if (doc.clientCompany) {
    page.drawText(doc.clientCompany, { x: 48, y, size: 10, font, color: MUTED });
    y -= 13;
  }
  if (doc.clientEmail) {
    page.drawText(doc.clientEmail, { x: 48, y, size: 10, font, color: MUTED });
    y -= 13;
  }
  if (doc.clientPhone) {
    page.drawText(doc.clientPhone, { x: 48, y, size: 10, font, color: MUTED });
    y -= 13;
  }

  if (doc.type === "contrat") {
    y -= 18;
    const clauses = [
      "Le présent contrat est conclu entre FEBiS et le client désigné ci-dessus.",
      "Les prestations décrites ci-après seront exécutées selon le planning convenu.",
      "Le client s'acquitte des montants dus selon les modalités de paiement FEBiS (Mobile Money, virement ou espèces).",
      "Toute annulation est soumise aux conditions générales FEBiS en vigueur.",
    ];
    page.drawText("Clauses contractuelles", {
      x: 48,
      y,
      size: 11,
      font: bold,
      color: FEBIS_RED,
    });
    y -= 16;
    for (const clause of clauses) {
      for (const line of wrapText(`• ${clause}`, font, 9, width - 96)) {
        page.drawText(line, { x: 48, y, size: 9, font, color: INK });
        y -= 12;
      }
      y -= 4;
    }
  }

  y -= 20;
  page.drawRectangle({
    x: 48,
    y: y - 4,
    width: width - 96,
    height: 22,
    color: rgb(0.95, 0.93, 0.9),
  });
  page.drawText("Désignation", { x: 56, y: y + 2, size: 9, font: bold, color: INK });
  page.drawText("Qté", { x: 320, y: y + 2, size: 9, font: bold, color: INK });
  page.drawText("P.U.", { x: 370, y: y + 2, size: 9, font: bold, color: INK });
  page.drawText("Total", { x: 460, y: y + 2, size: 9, font: bold, color: INK });
  y -= 28;

  for (const line of doc.lines) {
    if (y < 120) break;
    const labelLines = wrapText(line.label, font, 9, 250);
    for (let i = 0; i < labelLines.length; i += 1) {
      page.drawText(labelLines[i]!, {
        x: 56,
        y: y - i * 11,
        size: 9,
        font,
        color: INK,
      });
    }
    page.drawText(String(line.quantity), {
      x: 320,
      y,
      size: 9,
      font,
      color: INK,
    });
    page.drawText(formatXof(line.unitPrice), {
      x: 370,
      y,
      size: 9,
      font,
      color: INK,
    });
    page.drawText(formatXof(line.total), {
      x: 460,
      y,
      size: 9,
      font: bold,
      color: INK,
    });
    y -= Math.max(18, labelLines.length * 11 + 6);
  }

  y -= 10;
  page.drawLine({
    start: { x: 320, y },
    end: { x: width - 48, y },
    thickness: 1,
    color: rgb(0.85, 0.8, 0.76),
  });
  y -= 18;
  page.drawText("Sous-total", { x: 370, y, size: 10, font, color: MUTED });
  page.drawText(formatXof(doc.subtotal), {
    x: 460,
    y,
    size: 10,
    font,
    color: INK,
  });
  y -= 16;
  page.drawText(`TVA (${doc.taxRate}%)`, {
    x: 370,
    y,
    size: 10,
    font,
    color: MUTED,
  });
  page.drawText(formatXof(doc.taxAmount), {
    x: 460,
    y,
    size: 10,
    font,
    color: INK,
  });
  y -= 20;
  page.drawText("TOTAL", { x: 370, y, size: 12, font: bold, color: FEBIS_RED });
  page.drawText(formatXof(doc.total), {
    x: 460,
    y,
    size: 12,
    font: bold,
    color: FEBIS_RED,
  });

  if (doc.notes) {
    y -= 36;
    page.drawText("Notes", { x: 48, y, size: 10, font: bold, color: FEBIS_RED });
    y -= 14;
    for (const line of wrapText(doc.notes, font, 9, width - 96)) {
      page.drawText(line, { x: 48, y, size: 9, font, color: MUTED });
      y -= 12;
    }
  }

  if (doc.type === "recu") {
    y -= 24;
    page.drawText("Reçu de paiement — montant acquitté", {
      x: 48,
      y,
      size: 10,
      font: bold,
      color: INK,
    });
  }

  page.drawText("FEBiS · Abidjan, Côte d’Ivoire · contact@febis.ci", {
    x: 48,
    y: 40,
    size: 8,
    font,
    color: MUTED,
  });
  page.drawText("Document généré automatiquement", {
    x: width - 200,
    y: 40,
    size: 8,
    font,
    color: MUTED,
  });

  return pdf.save();
}

export async function listSourceOptions() {
  const db = await tryDb();
  if (!db) {
    return {
      quotes: [],
      invoices: [],
      reservations: [],
      orders: [],
      btp: [],
    };
  }

  const [quotes, invoices, reservations, orders, btp] = await Promise.all([
    db
      .collection("eventQuotes")
      .find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray(),
    db
      .collection("invoices")
      .find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray(),
    db
      .collection("reservations")
      .find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray(),
    db
      .collection("shopOrders")
      .find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray(),
    db
      .collection("btpProjects")
      .find({ cancelled: { $ne: true } })
      .sort({ updatedAt: -1 })
      .limit(30)
      .toArray(),
  ]);

  return {
    quotes: quotes.map((q) => ({
      id: String(q._id),
      label: `${String(q.clientName)} · ${String(q.eventDate)} · ${formatXof(Number(q.rentalTotal) || 0)}`,
    })),
    invoices: invoices.map((i) => ({
      id: String(i._id),
      label: `${String(i.number)} · ${String(i.clientName)} · ${formatXof(Number(i.amount) || 0)}`,
    })),
    reservations: reservations.map((r) => ({
      id: String(r._id),
      label: `${String(r.guestName)} · ${String(r.lodgingTitle)} · ${formatXof(Number(r.totalAmount) || 0)}`,
    })),
    orders: orders.map((o) => ({
      id: String(o._id),
      label: `${String(o.orderNumber)} · ${String(o.clientName)} · ${formatXof(Number(o.totalAmount) || 0)}`,
    })),
    btp: btp.map((p) => ({
      id: String(p._id),
      label: `${String(p.reference ?? "")} · ${String(p.title)} · ${formatXof(Number(p.contractAmount || p.quoteAmount) || 0)}`,
    })),
  };
}

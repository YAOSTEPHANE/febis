import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  PDFDocument,
  StandardFonts,
  degrees,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import {
  activityLabel,
  billingTypeLabel,
  formatXof,
} from "@/lib/facturation-shared";
import type { BillingDocumentDoc } from "@/lib/types";
/* ——— PDF rendering ——— */

const FEBIS_RED = rgb(0.843, 0.098, 0.125);
const FEBIS_RED_DEEP = rgb(0.627, 0.063, 0.094);
const INK = rgb(0.102, 0.071, 0.063);
const MUTED = rgb(0.35, 0.3, 0.28);
const GOLD = rgb(0.831, 0.659, 0.294);
const GOLD_LIGHT = rgb(0.941, 0.843, 0.549);
const SMOKE = rgb(0.969, 0.957, 0.937);
const MIST = rgb(0.922, 0.902, 0.875);
const PAPER = rgb(1, 0.996, 0.988);
const WHITE = rgb(1, 1, 1);
const SUCCESS = rgb(0.133, 0.455, 0.278);

/**
 * Helvetica (WinAnsi) rejects narrow/no-break spaces from Intl (fr-FR)
 * and some typographic punctuation — sanitize before drawText.
 */
function toPdfText(value: string): string {
  return String(value ?? "")
    .replace(/[\u202F\u00A0\u2007\u2009\u200A\u2008\u2002\u2003]/g, " ")
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x00-\xFF]/g, "?");
}

function pdfMoney(amount: number): string {
  return toPdfText(formatXof(amount));
}

function drawPdfText(
  page: PDFPage,
  text: string,
  options: Parameters<PDFPage["drawText"]>[1],
) {
  page.drawText(toPdfText(text), options);
}

function drawPdfTextRight(
  page: PDFPage,
  text: string,
  xRight: number,
  y: number,
  size: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
) {
  const safe = toPdfText(text);
  const w = font.widthOfTextAtSize(safe, size);
  page.drawText(safe, { x: xRight - w, y, size, font, color });
}

async function embedFebisLogo(pdf: PDFDocument): Promise<PDFImage | null> {
  try {
    const buf = await readFile(
      path.join(process.cwd(), "public", "logo-febis-transparent.png"),
    );
    return await pdf.embedPng(buf);
  } catch {
    try {
      const buf = await readFile(
        path.join(process.cwd(), "public", "logo-febis.jpg"),
      );
      return await pdf.embedJpg(buf);
    } catch {
      return null;
    }
  }
}

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
  drawPdfText(page, "FEBiS", {
    x: 48,
    y: height - 42,
    size: 22,
    font: bold,
    color: GOLD,
  });
  drawPdfText(page, "Plateforme digitale", {
    x: 48,
    y: height - 58,
    size: 9,
    font,
    color: rgb(0.85, 0.8, 0.75),
  });
  drawPdfText(page, title.toUpperCase(), {
    x: width - 220,
    y: height - 38,
    size: 14,
    font: bold,
    color: WHITE,
  });
  drawPdfText(page, number, {
    x: width - 220,
    y: height - 54,
    size: 10,
    font,
    color: GOLD,
  });
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = toPdfText(text).split(/\s+/).filter(Boolean);
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

function formatLongDate(date: Date): string {
  return toPdfText(
    date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  );
}

/** Reçu premium : en-tête marque, hero montant, grille client / lignes. */
async function buildReceiptPdf(doc: BillingDocumentDoc): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([595, 842]);
  const { width, height } = page.getSize();
  const mx = 40;
  const contentW = width - mx * 2;
  const logo = await embedFebisLogo(pdf);
  const issuedAt = new Date(doc.createdAt);
  const activity = activityLabel(String(doc.activity));

  // Fond papier crème
  page.drawRectangle({ x: 0, y: 0, width, height, color: PAPER });

  // ——— En-tête marque ———
  const headerH = 118;
  page.drawRectangle({
    x: 0,
    y: height - headerH,
    width,
    height: headerH,
    color: INK,
  });
  // Bandeau rouge profond en haut
  page.drawRectangle({
    x: 0,
    y: height - 6,
    width,
    height: 6,
    color: FEBIS_RED_DEEP,
  });
  // Liseré or
  page.drawRectangle({
    x: 0,
    y: height - headerH,
    width,
    height: 3,
    color: GOLD,
  });
  // Accent diagonal rouge (bloc marque)
  page.drawRectangle({
    x: 0,
    y: height - headerH + 3,
    width: 8,
    height: headerH - 9,
    color: FEBIS_RED,
  });

  let brandX = mx + 8;
  if (logo) {
    const logoH = 46;
    const logoW = (logo.width / logo.height) * logoH;
    page.drawImage(logo, {
      x: brandX,
      y: height - 78,
      width: Math.min(logoW, 120),
      height: logoH,
    });
    brandX += Math.min(logoW, 120) + 14;
  }

  drawPdfText(page, "FEBiS", {
    x: brandX,
    y: height - 48,
    size: 26,
    font: bold,
    color: GOLD_LIGHT,
  });
  drawPdfText(page, "Plateforme digitale · Abidjan", {
    x: brandX,
    y: height - 66,
    size: 9,
    font,
    color: rgb(0.82, 0.76, 0.7),
  });
  drawPdfText(page, "contact@febis.ci", {
    x: brandX,
    y: height - 80,
    size: 8,
    font,
    color: rgb(0.65, 0.58, 0.52),
  });

  // Badge document à droite
  const badgeW = 168;
  const badgeX = width - mx - badgeW;
  page.drawRectangle({
    x: badgeX,
    y: height - 88,
    width: badgeW,
    height: 52,
    color: rgb(0.16, 0.11, 0.09),
  });
  page.drawRectangle({
    x: badgeX,
    y: height - 88,
    width: 3,
    height: 52,
    color: GOLD,
  });
  drawPdfText(page, "RECU DE PAIEMENT", {
    x: badgeX + 12,
    y: height - 52,
    size: 10,
    font: bold,
    color: GOLD_LIGHT,
  });
  drawPdfText(page, doc.number, {
    x: badgeX + 12,
    y: height - 70,
    size: 11,
    font: bold,
    color: WHITE,
  });

  // ——— Hero montant acquitté ———
  let y = height - headerH - 28;
  const heroH = 92;
  page.drawRectangle({
    x: mx,
    y: y - heroH,
    width: contentW,
    height: heroH,
    color: SMOKE,
  });
  page.drawRectangle({
    x: mx,
    y: y - heroH,
    width: 5,
    height: heroH,
    color: SUCCESS,
  });
  page.drawRectangle({
    x: mx,
    y: y - 3,
    width: contentW,
    height: 3,
    color: GOLD,
  });

  drawPdfText(page, "MONTANT ACQUITTÉ", {
    x: mx + 22,
    y: y - 28,
    size: 9,
    font: bold,
    color: SUCCESS,
  });
  drawPdfText(page, pdfMoney(doc.total), {
    x: mx + 22,
    y: y - 58,
    size: 28,
    font: bold,
    color: INK,
  });
  drawPdfText(page, toPdfText(doc.title || "Paiement reçu"), {
    x: mx + 22,
    y: y - 78,
    size: 9,
    font,
    color: MUTED,
  });

  // Pastille statut
  const statusLabel = "PAIEMENT CONFIRMÉ";
  const statusW = bold.widthOfTextAtSize(statusLabel, 8) + 24;
  const statusX = width - mx - statusW - 18;
  page.drawRectangle({
    x: statusX,
    y: y - 48,
    width: statusW,
    height: 22,
    color: SUCCESS,
  });
  drawPdfText(page, statusLabel, {
    x: statusX + 12,
    y: y - 41,
    size: 8,
    font: bold,
    color: WHITE,
  });

  y -= heroH + 22;

  // ——— Cartes meta (document | client) ———
  const cardGap = 14;
  const cardW = (contentW - cardGap) / 2;
  const cardH = 108;
  const leftX = mx;
  const rightX = mx + cardW + cardGap;

  page.drawRectangle({
    x: leftX,
    y: y - cardH,
    width: cardW,
    height: cardH,
    color: WHITE,
  });
  page.drawRectangle({
    x: leftX,
    y: y - cardH,
    width: cardW,
    height: 1,
    color: MIST,
  });
  page.drawRectangle({
    x: leftX,
    y: y - 1,
    width: cardW,
    height: 1,
    color: MIST,
  });
  page.drawRectangle({
    x: leftX,
    y: y - cardH,
    width: 1,
    height: cardH,
    color: MIST,
  });
  page.drawRectangle({
    x: leftX + cardW - 1,
    y: y - cardH,
    width: 1,
    height: cardH,
    color: MIST,
  });
  page.drawRectangle({
    x: leftX,
    y: y - 18,
    width: cardW,
    height: 18,
    color: INK,
  });
  drawPdfText(page, "DOCUMENT", {
    x: leftX + 12,
    y: y - 13,
    size: 8,
    font: bold,
    color: GOLD_LIGHT,
  });

  const metaRows: [string, string][] = [
    ["N°", doc.number],
    ["Émis le", formatLongDate(issuedAt)],
    ["Activité", activity],
    ["Devise", "XOF (Franc CFA)"],
  ];
  let metaY = y - 36;
  for (const [k, v] of metaRows) {
    drawPdfText(page, k, {
      x: leftX + 12,
      y: metaY,
      size: 8,
      font,
      color: MUTED,
    });
    drawPdfText(page, v, {
      x: leftX + 78,
      y: metaY,
      size: 8,
      font: bold,
      color: INK,
    });
    metaY -= 16;
  }

  page.drawRectangle({
    x: rightX,
    y: y - cardH,
    width: cardW,
    height: cardH,
    color: WHITE,
  });
  page.drawRectangle({
    x: rightX,
    y: y - cardH,
    width: cardW,
    height: 1,
    color: MIST,
  });
  page.drawRectangle({
    x: rightX,
    y: y - 1,
    width: cardW,
    height: 1,
    color: MIST,
  });
  page.drawRectangle({
    x: rightX,
    y: y - cardH,
    width: 1,
    height: cardH,
    color: MIST,
  });
  page.drawRectangle({
    x: rightX + cardW - 1,
    y: y - cardH,
    width: 1,
    height: cardH,
    color: MIST,
  });
  page.drawRectangle({
    x: rightX,
    y: y - 18,
    width: cardW,
    height: 18,
    color: FEBIS_RED_DEEP,
  });
  drawPdfText(page, "CLIENT", {
    x: rightX + 12,
    y: y - 13,
    size: 8,
    font: bold,
    color: WHITE,
  });

  metaY = y - 36;
  drawPdfText(page, doc.clientName || "Client", {
    x: rightX + 12,
    y: metaY,
    size: 11,
    font: bold,
    color: INK,
  });
  metaY -= 16;
  const clientBits = [
    doc.clientCompany,
    doc.clientEmail,
    doc.clientPhone,
  ].filter(Boolean) as string[];
  for (const bit of clientBits.slice(0, 3)) {
    for (const line of wrapText(bit, font, 8, cardW - 28)) {
      drawPdfText(page, line, {
        x: rightX + 12,
        y: metaY,
        size: 8,
        font,
        color: MUTED,
      });
      metaY -= 13;
    }
  }
  if (clientBits.length === 0) {
    drawPdfText(page, "Coordonnées non renseignées", {
      x: rightX + 12,
      y: metaY,
      size: 8,
      font,
      color: MUTED,
    });
  }

  y -= cardH + 24;

  // ——— Tableau des lignes ———
  drawPdfText(page, "DÉTAIL DES PRESTATIONS", {
    x: mx,
    y,
    size: 9,
    font: bold,
    color: INK,
  });
  y -= 14;

  const colLabel = mx + 12;
  const colQty = mx + 300;
  const colPu = mx + 360;
  const colTotal = width - mx - 12;

  page.drawRectangle({
    x: mx,
    y: y - 22,
    width: contentW,
    height: 22,
    color: INK,
  });
  drawPdfText(page, "Désignation", {
    x: colLabel,
    y: y - 15,
    size: 8,
    font: bold,
    color: GOLD_LIGHT,
  });
  drawPdfText(page, "Qté", {
    x: colQty,
    y: y - 15,
    size: 8,
    font: bold,
    color: GOLD_LIGHT,
  });
  drawPdfTextRight(page, "P.U.", colPu + 50, y - 15, 8, bold, GOLD_LIGHT);
  drawPdfTextRight(page, "Total", colTotal, y - 15, 8, bold, GOLD_LIGHT);
  y -= 22;

  const lines = doc.lines.length > 0
    ? doc.lines
    : [
        {
          label: doc.title || "Paiement",
          quantity: 1,
          unitPrice: doc.total,
          total: doc.total,
        },
      ];

  for (let i = 0; i < lines.length; i += 1) {
    if (y < 200) break;
    const line = lines[i]!;
    const labelLines = wrapText(line.label, font, 9, 250);
    const rowH = Math.max(26, labelLines.length * 11 + 12);
    if (i % 2 === 0) {
      page.drawRectangle({
        x: mx,
        y: y - rowH,
        width: contentW,
        height: rowH,
        color: SMOKE,
      });
    }
    let ly = y - 16;
    for (const ll of labelLines) {
      drawPdfText(page, ll, {
        x: colLabel,
        y: ly,
        size: 9,
        font,
        color: INK,
      });
      ly -= 11;
    }
    drawPdfText(page, String(line.quantity), {
      x: colQty,
      y: y - 16,
      size: 9,
      font,
      color: INK,
    });
    drawPdfTextRight(
      page,
      pdfMoney(line.unitPrice),
      colPu + 50,
      y - 16,
      8,
      font,
      MUTED,
    );
    drawPdfTextRight(
      page,
      pdfMoney(line.total),
      colTotal,
      y - 16,
      9,
      bold,
      INK,
    );
    y -= rowH;
  }

  // Bordure basse table
  page.drawRectangle({
    x: mx,
    y: y,
    width: contentW,
    height: 1,
    color: MIST,
  });

  y -= 18;

  // ——— Totaux + tampon ———
  const totalsW = 220;
  const totalsX = width - mx - totalsW;
  const totalsH = 86;

  page.drawRectangle({
    x: totalsX,
    y: y - totalsH,
    width: totalsW,
    height: totalsH,
    color: SMOKE,
  });
  page.drawRectangle({
    x: totalsX,
    y: y - totalsH,
    width: 4,
    height: totalsH,
    color: GOLD,
  });

  let ty = y - 20;
  drawPdfText(page, "Sous-total", {
    x: totalsX + 14,
    y: ty,
    size: 9,
    font,
    color: MUTED,
  });
  drawPdfTextRight(
    page,
    pdfMoney(doc.subtotal),
    width - mx - 12,
    ty,
    9,
    font,
    INK,
  );
  ty -= 16;
  drawPdfText(page, `TVA (${doc.taxRate}%)`, {
    x: totalsX + 14,
    y: ty,
    size: 9,
    font,
    color: MUTED,
  });
  drawPdfTextRight(
    page,
    pdfMoney(doc.taxAmount),
    width - mx - 12,
    ty,
    9,
    font,
    INK,
  );
  ty -= 10;
  page.drawRectangle({
    x: totalsX + 10,
    y: ty - 2,
    width: totalsW - 20,
    height: 1,
    color: MIST,
  });
  ty -= 18;
  drawPdfText(page, "TOTAL ACQUITTÉ", {
    x: totalsX + 14,
    y: ty,
    size: 9,
    font: bold,
    color: FEBIS_RED,
  });
  drawPdfTextRight(
    page,
    pdfMoney(doc.total),
    width - mx - 12,
    ty,
    12,
    bold,
    FEBIS_RED_DEEP,
  );

  // Tampon « ACQUITTE »
  const stampX = mx + 70;
  const stampY = y - 55;
  page.drawCircle({
    x: stampX,
    y: stampY,
    size: 38,
    borderWidth: 2.5,
    borderColor: SUCCESS,
    color: rgb(0.93, 0.97, 0.94),
    opacity: 0.92,
    borderOpacity: 0.85,
  });
  page.drawCircle({
    x: stampX,
    y: stampY,
    size: 32,
    borderWidth: 1,
    borderColor: SUCCESS,
    borderOpacity: 0.55,
  });
  drawPdfText(page, "ACQUITTÉ", {
    x: stampX - 28,
    y: stampY - 3,
    size: 9,
    font: bold,
    color: SUCCESS,
    rotate: degrees(-8),
  });

  y -= totalsH + 28;

  if (doc.notes) {
    drawPdfText(page, "NOTES", {
      x: mx,
      y,
      size: 8,
      font: bold,
      color: FEBIS_RED,
    });
    y -= 14;
    for (const line of wrapText(doc.notes, font, 9, contentW)) {
      if (y < 90) break;
      drawPdfText(page, line, { x: mx, y, size: 9, font, color: MUTED });
      y -= 12;
    }
    y -= 8;
  }

  // Message de clôture
  page.drawRectangle({
    x: mx,
    y: 72,
    width: contentW,
    height: 36,
    color: SMOKE,
  });
  drawPdfText(page, "Merci pour votre confiance.", {
    x: mx + 14,
    y: 94,
    size: 10,
    font: bold,
    color: INK,
  });
  drawPdfText(
    page,
    "Ce document atteste que le montant indiqué a été intégralement réglé auprès de FEBiS.",
    {
      x: mx + 14,
      y: 80,
      size: 8,
      font,
      color: MUTED,
    },
  );

  // Pied de page
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height: 56,
    color: INK,
  });
  page.drawRectangle({
    x: 0,
    y: 56,
    width,
    height: 2,
    color: GOLD,
  });
  drawPdfText(page, "FEBiS · Abidjan, Côte d'Ivoire", {
    x: mx,
    y: 34,
    size: 8,
    font: bold,
    color: GOLD_LIGHT,
  });
  drawPdfText(page, "contact@febis.ci · Document généré automatiquement", {
    x: mx,
    y: 18,
    size: 7,
    font,
    color: rgb(0.65, 0.58, 0.52),
  });
  drawPdfTextRight(
    page,
    doc.number,
    width - mx,
    26,
    8,
    bold,
    GOLD,
  );

  return pdf.save();
}

export async function buildBillingPdf(
  doc: BillingDocumentDoc,
): Promise<Uint8Array> {
  if (doc.type === "recu") {
    return buildReceiptPdf(doc);
  }

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
  drawPdfText(page, doc.title, {
    x: 48,
    y,
    size: 16,
    font: bold,
    color: INK,
  });
  y -= 22;
  drawPdfText(page, `Activité : ${activityLabel(String(doc.activity))}`, {
    x: 48,
    y,
    size: 10,
    font,
    color: MUTED,
  });
  drawPdfText(
    page,
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
  drawPdfText(page, "Client", {
    x: 48,
    y,
    size: 11,
    font: bold,
    color: FEBIS_RED,
  });
  y -= 16;
  drawPdfText(page, doc.clientName, {
    x: 48,
    y,
    size: 12,
    font: bold,
    color: INK,
  });
  y -= 14;
  if (doc.clientCompany) {
    drawPdfText(page, doc.clientCompany, {
      x: 48,
      y,
      size: 10,
      font,
      color: MUTED,
    });
    y -= 13;
  }
  if (doc.clientEmail) {
    drawPdfText(page, doc.clientEmail, {
      x: 48,
      y,
      size: 10,
      font,
      color: MUTED,
    });
    y -= 13;
  }
  if (doc.clientPhone) {
    drawPdfText(page, doc.clientPhone, {
      x: 48,
      y,
      size: 10,
      font,
      color: MUTED,
    });
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
    drawPdfText(page, "Clauses contractuelles", {
      x: 48,
      y,
      size: 11,
      font: bold,
      color: FEBIS_RED,
    });
    y -= 16;
    for (const clause of clauses) {
      for (const line of wrapText(`• ${clause}`, font, 9, width - 96)) {
        drawPdfText(page, line, { x: 48, y, size: 9, font, color: INK });
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
  drawPdfText(page, "Désignation", {
    x: 56,
    y: y + 2,
    size: 9,
    font: bold,
    color: INK,
  });
  drawPdfText(page, "Qté", {
    x: 320,
    y: y + 2,
    size: 9,
    font: bold,
    color: INK,
  });
  drawPdfText(page, "P.U.", {
    x: 370,
    y: y + 2,
    size: 9,
    font: bold,
    color: INK,
  });
  drawPdfText(page, "Total", {
    x: 460,
    y: y + 2,
    size: 9,
    font: bold,
    color: INK,
  });
  y -= 28;

  for (const line of doc.lines) {
    if (y < 120) break;
    const labelLines = wrapText(line.label, font, 9, 250);
    for (let i = 0; i < labelLines.length; i += 1) {
      drawPdfText(page, labelLines[i]!, {
        x: 56,
        y: y - i * 11,
        size: 9,
        font,
        color: INK,
      });
    }
    drawPdfText(page, String(line.quantity), {
      x: 320,
      y,
      size: 9,
      font,
      color: INK,
    });
    drawPdfText(page, pdfMoney(line.unitPrice), {
      x: 370,
      y,
      size: 9,
      font,
      color: INK,
    });
    drawPdfText(page, pdfMoney(line.total), {
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
  drawPdfText(page, "Sous-total", {
    x: 370,
    y,
    size: 10,
    font,
    color: MUTED,
  });
  drawPdfText(page, pdfMoney(doc.subtotal), {
    x: 460,
    y,
    size: 10,
    font,
    color: INK,
  });
  y -= 16;
  drawPdfText(page, `TVA (${doc.taxRate}%)`, {
    x: 370,
    y,
    size: 10,
    font,
    color: MUTED,
  });
  drawPdfText(page, pdfMoney(doc.taxAmount), {
    x: 460,
    y,
    size: 10,
    font,
    color: INK,
  });
  y -= 20;
  drawPdfText(page, "TOTAL", {
    x: 370,
    y,
    size: 12,
    font: bold,
    color: FEBIS_RED,
  });
  drawPdfText(page, pdfMoney(doc.total), {
    x: 460,
    y,
    size: 12,
    font: bold,
    color: FEBIS_RED,
  });

  if (doc.notes) {
    y -= 36;
    drawPdfText(page, "Notes", {
      x: 48,
      y,
      size: 10,
      font: bold,
      color: FEBIS_RED,
    });
    y -= 14;
    for (const line of wrapText(doc.notes, font, 9, width - 96)) {
      drawPdfText(page, line, { x: 48, y, size: 9, font, color: MUTED });
      y -= 12;
    }
  }

  drawPdfText(page, "FEBiS · Abidjan, Côte d'Ivoire · contact@febis.ci", {
    x: 48,
    y: 40,
    size: 8,
    font,
    color: MUTED,
  });
  drawPdfText(page, "Document généré automatiquement", {
    x: width - 200,
    y: 40,
    size: 8,
    font,
    color: MUTED,
  });

  return pdf.save();
}

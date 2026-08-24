import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import {
  convertBillingDocument,
  createBillingDocument,
  generateFinanceReport,
  generateFromSource,
  listBillingDocuments,
  listSourceOptions,
} from "@/lib/facturation";
import { isBillingDocType } from "@/lib/facturation-shared";
import type { Activity, BillingLine } from "@/lib/types";
import { ACTIVITIES } from "@/lib/types";

const SOURCE_TYPES = [
  "reservation",
  "event_quote",
  "shop_order",
  "invoice",
  "btp",
] as const;

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !can(session, "facturation")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type") ?? "all";
  const sources = request.nextUrl.searchParams.get("sources") === "1";
  if (sources) {
    return NextResponse.json({ sources: await listSourceOptions() });
  }

  const documents = await listBillingDocuments({
    type: isBillingDocType(type) ? type : "all",
  });
  return NextResponse.json({ documents });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !can(session, "facturation")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  try {
    if (body.action === "report") {
      const doc = await generateFinanceReport();
      if (!doc) {
        return NextResponse.json({ error: "Impossible de générer" }, { status: 503 });
      }
      return NextResponse.json({ document: doc }, { status: 201 });
    }

    if (body.action === "convert") {
      const id = String(body.id ?? "");
      const toType = String(body.toType ?? "");
      if (!id || !isBillingDocType(toType)) {
        return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
      }
      const doc = await convertBillingDocument(id, toType);
      if (!doc) {
        return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
      }
      return NextResponse.json({ document: doc }, { status: 201 });
    }

    if (body.action === "from_source") {
      const type = String(body.type ?? "");
      const sourceType = String(body.sourceType ?? "");
      const sourceId = String(body.sourceId ?? "");
      if (!isBillingDocType(type)) {
        return NextResponse.json({ error: "Type invalide" }, { status: 400 });
      }
      if (!(SOURCE_TYPES as readonly string[]).includes(sourceType)) {
        return NextResponse.json({ error: "Source invalide" }, { status: 400 });
      }
      const doc = await generateFromSource({
        type,
        sourceType: sourceType as (typeof SOURCE_TYPES)[number],
        sourceId,
      });
      if (!doc) {
        return NextResponse.json({ error: "Source introuvable" }, { status: 404 });
      }
      return NextResponse.json({ document: doc }, { status: 201 });
    }

    const type = String(body.type ?? "");
    if (!isBillingDocType(type)) {
      return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    }

    const activity = String(body.activity ?? "general");
    if (
      activity !== "general" &&
      !(ACTIVITIES as readonly string[]).includes(activity)
    ) {
      return NextResponse.json({ error: "Activité invalide" }, { status: 400 });
    }

    const rawLines = Array.isArray(body.lines) ? body.lines : [];
    const lines: BillingLine[] = [];
    for (const row of rawLines) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const label = String(r.label ?? "").trim();
      const quantity = Number(r.quantity ?? 1);
      const unitPrice = Number(r.unitPrice ?? 0);
      if (!label) continue;
      lines.push({
        label,
        quantity,
        unitPrice,
        total: Math.round(quantity * unitPrice),
      });
    }
    if (lines.length === 0) {
      return NextResponse.json({ error: "Au moins une ligne" }, { status: 400 });
    }

    const document = await createBillingDocument({
      type,
      title: String(body.title ?? "Document"),
      activity: activity as Activity | "general",
      clientName: String(body.clientName ?? ""),
      clientEmail:
        typeof body.clientEmail === "string" ? body.clientEmail : undefined,
      clientPhone:
        typeof body.clientPhone === "string" ? body.clientPhone : undefined,
      lines,
      taxRate: Number(body.taxRate ?? 0),
      notes: typeof body.notes === "string" ? body.notes : undefined,
    });

    if (!document) {
      return NextResponse.json({ error: "MongoDB indisponible" }, { status: 503 });
    }
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 400 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getEventQuote,
  listMovements,
  updateEventQuoteStatus,
} from "@/lib/evenementiel-data";
import { isQuoteStatus } from "@/lib/evenementiel-shared";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await context.params;
  const quote = await getEventQuote(id);
  if (!quote) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const movements = await listMovements({ quoteId: id });
  return NextResponse.json({ quote, movements });
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: { status?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const status = body.status ?? "";
  if (!isQuoteStatus(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const quote = await updateEventQuoteStatus(id, status);
  if (!quote) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  return NextResponse.json({ quote });
}

import { NextRequest, NextResponse } from "next/server";
import { createEventQuote } from "@/lib/evenementiel-data";

type Body = {
  clientName?: unknown;
  clientEmail?: unknown;
  clientPhone?: unknown;
  eventDate?: unknown;
  returnDate?: unknown;
  message?: unknown;
  items?: unknown;
};

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const clientName = str(body.clientName);
  const clientEmail = str(body.clientEmail);
  const clientPhone = str(body.clientPhone);
  const eventDate = str(body.eventDate);
  const returnDate = str(body.returnDate);
  const message = str(body.message);

  if (clientName.length < 2) {
    return NextResponse.json({ error: "Nom invalide." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }
  if (clientPhone.length < 8) {
    return NextResponse.json({ error: "Téléphone invalide." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || !/^\d{4}-\d{2}-\d{2}$/.test(returnDate)) {
    return NextResponse.json({ error: "Dates invalides." }, { status: 400 });
  }
  if (returnDate <= eventDate) {
    return NextResponse.json(
      { error: "La date de retour doit être après la date d’événement." },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json(
      { error: "Sélectionnez au moins un article." },
      { status: 400 },
    );
  }

  const items: Array<{ slug: string; quantity: number }> = [];
  for (const raw of body.items) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as { slug?: unknown; quantity?: unknown };
    const slug = str(row.slug);
    const quantity =
      typeof row.quantity === "number"
        ? row.quantity
        : Number.parseInt(str(row.quantity) || "0", 10);
    if (!slug || !Number.isFinite(quantity) || quantity < 1) continue;
    items.push({ slug, quantity });
  }

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Articles de devis invalides." },
      { status: 400 },
    );
  }

  try {
    const quote = await createEventQuote({
      clientName,
      clientEmail,
      clientPhone,
      eventDate,
      returnDate,
      message: message || undefined,
      items,
    });
    return NextResponse.json({ ok: true, quote }, { status: 201 });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Impossible de créer le devis.";
    const status = msg.includes("Stock") || msg.includes("maintenance") ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createShopOrder } from "@/lib/boutique-data";
import { PAYMENT_CHANNELS, type PaymentChannel } from "@/lib/types";

type Body = {
  clientName?: unknown;
  clientEmail?: unknown;
  clientPhone?: unknown;
  deliveryAddress?: unknown;
  message?: unknown;
  paymentChannel?: unknown;
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
  const deliveryAddress = str(body.deliveryAddress);
  const message = str(body.message);
  const paymentRaw = str(body.paymentChannel);
  const paymentChannel = PAYMENT_CHANNELS.includes(
    paymentRaw as PaymentChannel,
  )
    ? (paymentRaw as PaymentChannel)
    : null;

  if (clientName.length < 2) {
    return NextResponse.json({ error: "Nom invalide." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }
  if (clientPhone.length < 8) {
    return NextResponse.json({ error: "Téléphone invalide." }, { status: 400 });
  }
  if (deliveryAddress.length < 5) {
    return NextResponse.json(
      { error: "Adresse de livraison invalide." },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Panier vide." }, { status: 400 });
  }

  const items: Array<{ slug: string; sku: string; quantity: number }> = [];
  for (const raw of body.items) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as { slug?: unknown; sku?: unknown; quantity?: unknown };
    const slug = str(row.slug);
    const sku = str(row.sku);
    const quantity =
      typeof row.quantity === "number"
        ? row.quantity
        : Number.parseInt(str(row.quantity) || "0", 10);
    if (!slug || !sku || !Number.isFinite(quantity) || quantity < 1) continue;
    items.push({ slug, sku, quantity });
  }

  if (items.length === 0) {
    return NextResponse.json({ error: "Articles invalides." }, { status: 400 });
  }

  try {
    const order = await createShopOrder({
      clientName,
      clientEmail,
      clientPhone,
      deliveryAddress,
      message: message || undefined,
      paymentChannel,
      items,
    });
    return NextResponse.json({ ok: true, order }, { status: 201 });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Impossible de créer la commande.";
    const status = msg.includes("Stock") ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createReservationDemande } from "@/lib/residences-data";
import { PAYMENT_CHANNELS } from "@/lib/types";

type Body = {
  lodgingSlug?: unknown;
  guestName?: unknown;
  guestEmail?: unknown;
  guestPhone?: unknown;
  checkIn?: unknown;
  checkOut?: unknown;
  guests?: unknown;
  message?: unknown;
  paymentChannel?: unknown;
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

  const lodgingSlug = str(body.lodgingSlug);
  const guestName = str(body.guestName);
  const guestEmail = str(body.guestEmail);
  const guestPhone = str(body.guestPhone);
  const checkIn = str(body.checkIn);
  const checkOut = str(body.checkOut);
  const message = str(body.message);
  const guests =
    typeof body.guests === "number"
      ? body.guests
      : Number.parseInt(str(body.guests) || "1", 10);

  if (guestName.length < 2) {
    return NextResponse.json({ error: "Nom invalide." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }
  if (guestPhone.length < 8) {
    return NextResponse.json({ error: "Téléphone invalide." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
    return NextResponse.json({ error: "Dates invalides." }, { status: 400 });
  }
  if (!Number.isFinite(guests) || guests < 1 || guests > 20) {
    return NextResponse.json({ error: "Nombre d’invités invalide." }, { status: 400 });
  }

  const paymentRaw = str(body.paymentChannel);
  const paymentChannel = PAYMENT_CHANNELS.includes(
    paymentRaw as (typeof PAYMENT_CHANNELS)[number],
  )
    ? (paymentRaw as (typeof PAYMENT_CHANNELS)[number])
    : null;

  try {
    const reservation = await createReservationDemande({
      lodgingSlug,
      guestName,
      guestEmail,
      guestPhone,
      checkIn,
      checkOut,
      guests,
      message: message || undefined,
      paymentChannel,
    });

    return NextResponse.json({ ok: true, reservation }, { status: 201 });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Impossible de créer la demande.";
    const status = msg.includes("introuvable")
      ? 404
      : msg.includes("réservées") || msg.includes("maintenance")
        ? 409
        : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

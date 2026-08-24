import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createAdminReservation,
  getReservationStats,
  listAdminReservations,
  listPublicLodgings,
} from "@/lib/residences-data";
import { isReservationStep } from "@/lib/residences-shared";
import { PAYMENT_CHANNELS, type PaymentChannel } from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  if (searchParams.get("tab") === "stats") {
    return NextResponse.json({ stats: await getReservationStats() });
  }
  if (searchParams.get("tab") === "lodgings") {
    return NextResponse.json({ lodgings: await listPublicLodgings() });
  }

  const reservations = await listAdminReservations({
    q: searchParams.get("q") ?? undefined,
    step: searchParams.get("step") ?? undefined,
    lodgingSlug: searchParams.get("lodgingSlug") ?? undefined,
    includeCancelled: searchParams.get("cancelled") === "1",
  });
  return NextResponse.json({ reservations });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const paymentRaw = String(body.paymentChannel ?? "");
  const paymentChannel = PAYMENT_CHANNELS.includes(
    paymentRaw as PaymentChannel,
  )
    ? (paymentRaw as PaymentChannel)
    : null;

  const stepRaw = String(body.step ?? "demande");
  const step = isReservationStep(stepRaw) ? stepRaw : "demande";

  try {
    const reservation = await createAdminReservation({
      lodgingSlug: String(body.lodgingSlug ?? ""),
      guestName: String(body.guestName ?? ""),
      guestEmail: String(body.guestEmail ?? ""),
      guestPhone: String(body.guestPhone ?? ""),
      checkIn: String(body.checkIn ?? ""),
      checkOut: String(body.checkOut ?? ""),
      guests: Number(body.guests ?? 1),
      message: typeof body.message === "string" ? body.message : undefined,
      paymentChannel,
      step,
    });
    if (!reservation) {
      return NextResponse.json(
        { error: "Impossible de créer (MongoDB ?)" },
        { status: 503 },
      );
    }
    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Création impossible";
    const status = msg.includes("introuvable")
      ? 404
      : msg.includes("réservées") || msg.includes("maintenance")
        ? 409
        : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

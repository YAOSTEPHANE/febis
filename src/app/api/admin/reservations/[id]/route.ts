import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getAdminReservation,
  updateReservation,
} from "@/lib/residences-data";
import { isReservationStep } from "@/lib/residences-shared";
import { PAYMENT_CHANNELS, type PaymentChannel } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id } = await context.params;
  const reservation = await getAdminReservation(id);
  if (!reservation) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  return NextResponse.json({ reservation });
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const patch: Parameters<typeof updateReservation>[1] = {};

  if (typeof body.step === "string") {
    if (!isReservationStep(body.step)) {
      return NextResponse.json({ error: "Étape invalide" }, { status: 400 });
    }
    patch.step = body.step;
  }
  if (typeof body.inventoryNotes === "string") {
    patch.inventoryNotes = body.inventoryNotes;
  }
  if (typeof body.message === "string") {
    patch.message = body.message;
  }
  if (typeof body.cancelled === "boolean") {
    patch.cancelled = body.cancelled;
  }
  if (typeof body.guests === "number" || typeof body.guests === "string") {
    patch.guests = Number(body.guests);
  }
  if (typeof body.guestName === "string") {
    patch.guestName = body.guestName;
  }
  if (typeof body.guestEmail === "string") {
    patch.guestEmail = body.guestEmail;
  }
  if (typeof body.guestPhone === "string") {
    patch.guestPhone = body.guestPhone;
  }
  if (typeof body.checkIn === "string") {
    patch.checkIn = body.checkIn;
  }
  if (typeof body.checkOut === "string") {
    patch.checkOut = body.checkOut;
  }
  if (body.paymentChannel === null || body.paymentChannel === "") {
    patch.paymentChannel = null;
  } else if (typeof body.paymentChannel === "string") {
    if (!PAYMENT_CHANNELS.includes(body.paymentChannel as PaymentChannel)) {
      return NextResponse.json({ error: "Canal invalide" }, { status: 400 });
    }
    patch.paymentChannel = body.paymentChannel as PaymentChannel;
  }

  try {
    const reservation = await updateReservation(id, patch);
    if (!reservation) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
    return NextResponse.json({ reservation });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Mise à jour impossible",
      },
      { status: 409 },
    );
  }
}

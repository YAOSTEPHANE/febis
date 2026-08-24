import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { listPayments, listUnpaidInvoices, recordPayment } from "@/lib/finance";
import type { Activity, PaymentChannel, PaymentDirection } from "@/lib/types";
import {
  ACTIVITIES,
  PAYMENT_CHANNELS,
  PAYMENT_DIRECTIONS,
} from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !can(session, "paiements")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { searchParams } = request.nextUrl;
  const [payments, unpaid] = await Promise.all([
    listPayments({
      channel: searchParams.get("channel") ?? undefined,
      activity: searchParams.get("activity") ?? undefined,
      direction: searchParams.get("direction") ?? undefined,
    }),
    listUnpaidInvoices(),
  ]);
  return NextResponse.json({ payments, unpaid });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !can(session, "paiements")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const channel = String(body.channel ?? "");
  const activity = String(body.activity ?? "general");
  if (!(PAYMENT_CHANNELS as readonly string[]).includes(channel)) {
    return NextResponse.json({ error: "Canal invalide" }, { status: 400 });
  }
  if (
    activity !== "general" &&
    !(ACTIVITIES as readonly string[]).includes(activity)
  ) {
    return NextResponse.json({ error: "Activité invalide" }, { status: 400 });
  }

  const direction =
    typeof body.direction === "string" &&
    (PAYMENT_DIRECTIONS as readonly string[]).includes(body.direction)
      ? (body.direction as PaymentDirection)
      : "entrant";

  try {
    const payment = await recordPayment({
      activity: activity as Activity | "general",
      channel: channel as PaymentChannel,
      direction,
      amount: Number(body.amount ?? 0),
      title: String(body.title ?? "Paiement"),
      reference: typeof body.reference === "string" ? body.reference : undefined,
      clientName: typeof body.clientName === "string" ? body.clientName : undefined,
      invoiceId: typeof body.invoiceId === "string" ? body.invoiceId : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      markInvoicePaid: body.markInvoicePaid !== false,
    });
    if (!payment) {
      return NextResponse.json({ error: "MongoDB indisponible" }, { status: 503 });
    }
    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 400 },
    );
  }
}

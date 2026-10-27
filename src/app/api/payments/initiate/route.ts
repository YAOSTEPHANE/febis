import { NextRequest, NextResponse } from "next/server";
import {
  createPaymentIntent,
  isPaymentSourceType,
} from "@/lib/paiements";
import { guardPublicWrite } from "@/lib/public-write-guard";
import { rateLimitHeaders } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const guarded = guardPublicWrite(request, "paymentsInitiate");
  if (!guarded.ok) return guarded.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const sourceType = String(body.sourceType ?? "");
  if (!isPaymentSourceType(sourceType)) {
    return NextResponse.json({ error: "sourceType invalide" }, { status: 400 });
  }

  try {
    const intent = await createPaymentIntent({
      sourceType,
      sourceId: String(body.sourceId ?? ""),
      amount: Number(body.amount ?? 0),
      channel: String(body.channel ?? "wave"),
      title: String(body.title ?? "Paiement FEBiS"),
      clientName:
        typeof body.clientName === "string" ? body.clientName : undefined,
      clientEmail:
        typeof body.clientEmail === "string" ? body.clientEmail : undefined,
      clientPhone:
        typeof body.clientPhone === "string" ? body.clientPhone : undefined,
    });
    return NextResponse.json(
      { intent },
      { status: 201, headers: rateLimitHeaders(guarded.result) },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 400 },
    );
  }
}

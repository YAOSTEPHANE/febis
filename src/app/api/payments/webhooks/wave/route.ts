import { NextRequest, NextResponse } from "next/server";
import {
  confirmPaymentIntent,
  failPaymentIntent,
  findPendingIntentByReference,
  getPaymentIntent,
} from "@/lib/paiements";

/**
 * Webhook Wave — prêt pour signature WAVE_WEBHOOK_SECRET.
 * Accepte { reference | intentId, status: success|failed }.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.WAVE_WEBHOOK_SECRET?.trim();
  if (secret) {
    const header =
      request.headers.get("x-wave-signature") ||
      request.headers.get("x-webhook-secret") ||
      "";
    if (header !== secret) {
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const status = String(body.status ?? body.event ?? "success").toLowerCase();
  const intentId = typeof body.intentId === "string" ? body.intentId : "";
  const reference =
    typeof body.reference === "string"
      ? body.reference
      : typeof body.client_reference === "string"
        ? body.client_reference
        : "";

  try {
    let id = intentId;
    if (!id && reference) {
      const found = await findPendingIntentByReference(reference);
      id = found?.id ?? "";
    }
    if (!id) {
      return NextResponse.json({ error: "Intent introuvable" }, { status: 404 });
    }

    if (status.includes("fail") || status.includes("cancel")) {
      const intent = await failPaymentIntent(id, "Webhook Wave — échec");
      return NextResponse.json({ intent });
    }

    const existing = await getPaymentIntent(id);
    if (existing?.status === "confirmed") {
      return NextResponse.json({ intent: existing, already: true });
    }

    const intent = await confirmPaymentIntent(id, {
      note: "Webhook Wave — succès",
    });
    return NextResponse.json({ intent });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 400 },
    );
  }
}

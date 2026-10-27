import { NextRequest, NextResponse } from "next/server";
import {
  confirmPaymentIntent,
  failPaymentIntent,
  findPendingIntentByReference,
} from "@/lib/paiements";

export async function POST(request: NextRequest) {
  const secret = process.env.MTN_WEBHOOK_SECRET?.trim();
  if (secret) {
    const header =
      request.headers.get("x-mtn-signature") ||
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

  const status = String(body.status ?? "success").toLowerCase();
  let id = typeof body.intentId === "string" ? body.intentId : "";
  const reference =
    typeof body.reference === "string" ? body.reference : "";

  try {
    if (!id && reference) {
      id = (await findPendingIntentByReference(reference))?.id ?? "";
    }
    if (!id) {
      return NextResponse.json({ error: "Intent introuvable" }, { status: 404 });
    }
    if (status.includes("fail")) {
      return NextResponse.json({
        intent: await failPaymentIntent(id, "Webhook MTN Money — échec"),
      });
    }
    return NextResponse.json({
      intent: await confirmPaymentIntent(id, {
        note: "Webhook MTN Money — succès",
      }),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 400 },
    );
  }
}

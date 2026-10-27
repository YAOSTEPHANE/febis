import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { confirmPaymentIntent, failPaymentIntent } from "@/lib/paiements";

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

  const intentId = String(body.intentId ?? "");
  const action = String(body.action ?? "confirm");

  try {
    if (action === "fail") {
      const intent = await failPaymentIntent(
        intentId,
        typeof body.reason === "string" ? body.reason : undefined,
      );
      return NextResponse.json({ intent });
    }
    const intent = await confirmPaymentIntent(intentId, {
      note: typeof body.note === "string" ? body.note : undefined,
    });
    return NextResponse.json({ intent });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 400 },
    );
  }
}

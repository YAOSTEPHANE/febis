import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { confirmPaymentIntent } from "@/lib/paiements";

/** Simulation admin d’un webhook opérateur réussi (sans clés API). */
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

  try {
    const intent = await confirmPaymentIntent(String(body.intentId ?? ""), {
      note: "Simulation succès paiement (sandbox FEBiS)",
    });
    return NextResponse.json({ intent, simulated: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 400 },
    );
  }
}

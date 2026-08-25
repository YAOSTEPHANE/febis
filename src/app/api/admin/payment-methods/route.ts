import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import {
  getPaymentMethodsSettings,
  savePaymentMethodsSettings,
} from "@/lib/payment-settings";
import {
  normalizePaymentMethodsSettings,
  type PaymentMethodsSettings,
} from "@/lib/payment-settings-shared";

export async function GET() {
  const session = await getSession();
  if (!session || (!can(session, "paiements") && !can(session, "finance"))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const settings = await getPaymentMethodsSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || (!can(session, "paiements") && !can(session, "finance"))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: { settings?: PaymentMethodsSettings };
  try {
    body = (await request.json()) as { settings?: PaymentMethodsSettings };
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const settings = await savePaymentMethodsSettings(
    normalizePaymentMethodsSettings(body.settings),
  );
  return NextResponse.json({ settings });
}

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import {
  createExpense,
  getFinanceDashboard,
  issueInvoice,
  listExpenses,
  listUnpaidInvoices,
  recordPayment,
} from "@/lib/finance";
import type { Activity, ExpenseCategory, PaymentChannel } from "@/lib/types";
import {
  ACTIVITIES,
  EXPENSE_CATEGORIES,
  PAYMENT_CHANNELS,
} from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !can(session, "finance")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const tab = request.nextUrl.searchParams.get("tab") ?? "dashboard";
  const activity = request.nextUrl.searchParams.get("activity") ?? undefined;
  if (tab === "expenses") {
    return NextResponse.json({ expenses: await listExpenses({ activity }) });
  }
  if (tab === "unpaid") {
    return NextResponse.json({ unpaid: await listUnpaidInvoices() });
  }
  return NextResponse.json({ dashboard: await getFinanceDashboard() });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !can(session, "finance")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (body.action === "issue" && typeof body.invoiceId === "string") {
    const ok = await issueInvoice(body.invoiceId);
    if (!ok) {
      return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "pay" && typeof body.invoiceId === "string") {
    const channel = String(body.channel ?? "mobile_money");
    if (!(PAYMENT_CHANNELS as readonly string[]).includes(channel)) {
      return NextResponse.json({ error: "Canal invalide" }, { status: 400 });
    }
    const payment = await recordPayment({
      activity: "general",
      channel: channel as PaymentChannel,
      direction: "entrant",
      amount: Number(body.amount ?? 0),
      title: String(body.title ?? "Encaissement impayé"),
      invoiceId: body.invoiceId,
      reference:
        typeof body.reference === "string" ? body.reference : undefined,
      markInvoicePaid: true,
    });
    if (!payment) {
      return NextResponse.json({ error: "Échec encaissement" }, { status: 400 });
    }
    return NextResponse.json({ payment });
  }

  const activity = String(body.activity ?? "");
  const category = String(body.category ?? "");
  if (!(ACTIVITIES as readonly string[]).includes(activity)) {
    return NextResponse.json({ error: "Activité invalide" }, { status: 400 });
  }
  if (!(EXPENSE_CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 });
  }

  const channel =
    typeof body.paymentChannel === "string" &&
    (PAYMENT_CHANNELS as readonly string[]).includes(body.paymentChannel)
      ? (body.paymentChannel as PaymentChannel)
      : undefined;

  try {
    const expense = await createExpense({
      activity: activity as Activity,
      category: category as ExpenseCategory,
      title: String(body.title ?? ""),
      amount: Number(body.amount ?? 0),
      paymentChannel: channel,
      reference: typeof body.reference === "string" ? body.reference : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      spentAt: typeof body.spentAt === "string" ? body.spentAt : undefined,
    });
    if (!expense) {
      return NextResponse.json({ error: "MongoDB indisponible" }, { status: 503 });
    }
    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 400 },
    );
  }
}

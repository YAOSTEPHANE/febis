import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminOrder, updateOrderStatus } from "@/lib/boutique-data";
import { isOrderStatus } from "@/lib/boutique-shared";
import type { OrderStatus } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await context.params;
  const order = await getAdminOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }
  return NextResponse.json({ order });
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: { status?: string };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const status = body.status ?? "";
  if (!isOrderStatus(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  try {
    const order = await updateOrderStatus(id, status as OrderStatus);
    if (!order) {
      return NextResponse.json(
        { error: "Commande introuvable" },
        { status: 404 },
      );
    }
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Mise à jour impossible",
      },
      { status: 400 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createEquipment,
  createEventQuote,
  getEvenementielStats,
  listAdminEquipment,
  listEventQuotes,
  listMovements,
  recordMovement,
  updateEquipment,
} from "@/lib/evenementiel-data";
import {
  isEquipmentCategory,
  isEquipmentStatus,
  isMovementType,
  isQuoteStatus,
} from "@/lib/evenementiel-shared";
import type { QuoteStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const tab = searchParams.get("tab") ?? "equipment";
  const q = searchParams.get("q") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const quoteId = searchParams.get("quoteId") ?? undefined;

  if (tab === "stats") {
    return NextResponse.json({ stats: await getEvenementielStats() });
  }
  if (tab === "quotes") {
    return NextResponse.json({
      quotes: await listEventQuotes({ q, status }),
    });
  }
  if (tab === "movements") {
    return NextResponse.json({
      movements: await listMovements({ q, type, quoteId }),
    });
  }

  return NextResponse.json({
    equipment: await listAdminEquipment({ q, category, status }),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const kind = String(body.kind ?? "equipment");

  try {
    if (kind === "movement") {
      const type = String(body.type ?? "");
      if (!isMovementType(type)) {
        return NextResponse.json({ error: "Type invalide" }, { status: 400 });
      }
      const movement = await recordMovement({
        equipmentSlug: String(body.equipmentSlug ?? ""),
        type,
        quantity: Number(body.quantity ?? 1),
        quoteId:
          typeof body.quoteId === "string" ? body.quoteId : undefined,
        note: typeof body.note === "string" ? body.note : undefined,
        damageReported: Boolean(body.damageReported),
        penaltyAmount:
          body.penaltyAmount !== undefined
            ? Number(body.penaltyAmount)
            : undefined,
      });
      if (!movement) {
        return NextResponse.json(
          { error: "Impossible d’enregistrer (MongoDB ?)" },
          { status: 503 },
        );
      }
      return NextResponse.json({ movement }, { status: 201 });
    }

    if (kind === "quote") {
      const itemsRaw = Array.isArray(body.items) ? body.items : [];
      const items: Array<{ slug: string; quantity: number }> = [];
      for (const raw of itemsRaw) {
        if (!raw || typeof raw !== "object") continue;
        const row = raw as { slug?: unknown; quantity?: unknown };
        const slug = String(row.slug ?? "").trim();
        const quantity = Number(row.quantity ?? 0);
        if (!slug || !Number.isFinite(quantity) || quantity < 1) continue;
        items.push({ slug, quantity });
      }
      const statusRaw = String(body.status ?? "envoye");
      const status: QuoteStatus | undefined = isQuoteStatus(statusRaw)
        ? statusRaw
        : "envoye";

      const quote = await createEventQuote({
        clientName: String(body.clientName ?? ""),
        clientEmail: String(body.clientEmail ?? ""),
        clientPhone: String(body.clientPhone ?? ""),
        eventDate: String(body.eventDate ?? ""),
        returnDate: String(body.returnDate ?? ""),
        message:
          typeof body.message === "string" ? body.message : undefined,
        items,
        status,
      });
      return NextResponse.json({ quote }, { status: 201 });
    }

    const category = String(body.category ?? "");
    if (!isEquipmentCategory(category)) {
      return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 });
    }
    const status = String(body.status ?? "disponible");
    if (body.status !== undefined && !isEquipmentStatus(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const equipment = await createEquipment({
      name: String(body.name ?? ""),
      slug: typeof body.slug === "string" ? body.slug : undefined,
      category,
      description:
        typeof body.description === "string" ? body.description : undefined,
      photo: typeof body.photo === "string" ? body.photo : undefined,
      pricePerDay: Number(body.pricePerDay ?? 0),
      depositAmount: Number(body.depositAmount ?? 0),
      quantityTotal: Number(body.quantityTotal ?? 0),
      quantityAvailable:
        body.quantityAvailable !== undefined
          ? Number(body.quantityAvailable)
          : undefined,
      status: isEquipmentStatus(status) ? status : undefined,
      penaltyPerDamage: Number(body.penaltyPerDamage ?? 0),
    });
    if (!equipment) {
      return NextResponse.json(
        { error: "Impossible de créer (MongoDB ?)" },
        { status: 503 },
      );
    }
    return NextResponse.json({ equipment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Création impossible",
      },
      { status: 400 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const slug = String(body.slug ?? "").trim();
  if (!slug) {
    return NextResponse.json({ error: "Slug requis" }, { status: 400 });
  }

  try {
    const equipment = await updateEquipment(slug, {
      name: typeof body.name === "string" ? body.name : undefined,
      category: typeof body.category === "string" ? body.category : undefined,
      description:
        typeof body.description === "string" ? body.description : undefined,
      photo: typeof body.photo === "string" ? body.photo : undefined,
      pricePerDay:
        body.pricePerDay !== undefined ? Number(body.pricePerDay) : undefined,
      depositAmount:
        body.depositAmount !== undefined
          ? Number(body.depositAmount)
          : undefined,
      quantityTotal:
        body.quantityTotal !== undefined
          ? Number(body.quantityTotal)
          : undefined,
      quantityAvailable:
        body.quantityAvailable !== undefined
          ? Number(body.quantityAvailable)
          : undefined,
      status: typeof body.status === "string" ? body.status : undefined,
      penaltyPerDamage:
        body.penaltyPerDamage !== undefined
          ? Number(body.penaltyPerDamage)
          : undefined,
    });
    if (!equipment) {
      return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    }
    return NextResponse.json({ equipment });
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

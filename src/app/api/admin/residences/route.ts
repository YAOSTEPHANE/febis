import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createLodging,
  deleteLodging,
  listAdminLodgings,
  updateLodging,
  updateLodgingStatus,
} from "@/lib/residences-data";
import {
  isLodgingCategory,
  isLodgingStatus,
} from "@/lib/residences-shared";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  return NextResponse.json({ lodgings: await listAdminLodgings() });
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

  const category = String(body.category ?? "");
  if (!isLodgingCategory(category)) {
    return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 });
  }

  try {
    const lodging = await createLodging({
      title: String(body.title ?? ""),
      slug: typeof body.slug === "string" ? body.slug : undefined,
      description: String(body.description ?? ""),
      longDescription:
        typeof body.longDescription === "string"
          ? body.longDescription
          : undefined,
      photos: Array.isArray(body.photos)
        ? body.photos.filter((p): p is string => typeof p === "string")
        : undefined,
      pricePerNight: Number(body.pricePerNight ?? 0),
      depositPercent:
        body.depositPercent !== undefined
          ? Number(body.depositPercent)
          : undefined,
      status: typeof body.status === "string" ? body.status : undefined,
      capacity: Number(body.capacity ?? 2),
      bedrooms: Number(body.bedrooms ?? 1),
      bathrooms: Number(body.bathrooms ?? 1),
      location: String(body.location ?? "Abidjan"),
      neighborhood: String(body.neighborhood ?? ""),
      category,
      amenities: Array.isArray(body.amenities)
        ? body.amenities.filter((a): a is string => typeof a === "string")
        : undefined,
      highlights: Array.isArray(body.highlights)
        ? body.highlights.filter((h): h is string => typeof h === "string")
        : undefined,
    });
    if (!lodging) {
      return NextResponse.json(
        { error: "Impossible de créer (MongoDB ?)" },
        { status: 503 },
      );
    }
    return NextResponse.json({ lodging }, { status: 201 });
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

  // Compat : ancien endpoint statut seul
  if (
    body.status !== undefined &&
    Object.keys(body).every((k) => k === "slug" || k === "status")
  ) {
    const status = String(body.status ?? "");
    if (!isLodgingStatus(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    const lodging = await updateLodgingStatus(slug, status);
    if (!lodging) {
      return NextResponse.json({ error: "Logement introuvable" }, { status: 404 });
    }
    return NextResponse.json({ lodging });
  }

  try {
    if (body.category !== undefined && !isLodgingCategory(String(body.category))) {
      return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 });
    }

    const lodging = await updateLodging(slug, {
      title: typeof body.title === "string" ? body.title : undefined,
      slug: typeof body.nextSlug === "string" ? body.nextSlug : undefined,
      description:
        typeof body.description === "string" ? body.description : undefined,
      longDescription:
        typeof body.longDescription === "string"
          ? body.longDescription
          : undefined,
      photos: Array.isArray(body.photos)
        ? body.photos.filter((p): p is string => typeof p === "string")
        : undefined,
      pricePerNight:
        body.pricePerNight !== undefined
          ? Number(body.pricePerNight)
          : undefined,
      depositPercent:
        body.depositPercent !== undefined
          ? Number(body.depositPercent)
          : undefined,
      status: typeof body.status === "string" ? body.status : undefined,
      capacity:
        body.capacity !== undefined ? Number(body.capacity) : undefined,
      bedrooms:
        body.bedrooms !== undefined ? Number(body.bedrooms) : undefined,
      bathrooms:
        body.bathrooms !== undefined ? Number(body.bathrooms) : undefined,
      location: typeof body.location === "string" ? body.location : undefined,
      neighborhood:
        typeof body.neighborhood === "string" ? body.neighborhood : undefined,
      category:
        typeof body.category === "string" ? body.category : undefined,
      amenities: Array.isArray(body.amenities)
        ? body.amenities.filter((a): a is string => typeof a === "string")
        : undefined,
      highlights: Array.isArray(body.highlights)
        ? body.highlights.filter((h): h is string => typeof h === "string")
        : undefined,
    });
    if (!lodging) {
      return NextResponse.json({ error: "Logement introuvable" }, { status: 404 });
    }
    return NextResponse.json({ lodging });
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

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const slug = request.nextUrl.searchParams.get("slug")?.trim() ?? "";
  if (!slug) {
    return NextResponse.json({ error: "Slug requis" }, { status: 400 });
  }

  const ok = await deleteLodging(slug);
  if (!ok) {
    return NextResponse.json({ error: "Logement introuvable" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  deleteProduct,
  getAdminProduct,
  updateProduct,
} from "@/lib/boutique-data";
import { isProductCategory } from "@/lib/boutique-shared";
import type { ProductCategory } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await context.params;
  const product = await getAdminProduct(id);
  if (!product) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }
  return NextResponse.json({ product });
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: {
    name?: string;
    slug?: string;
    category?: string;
    description?: string;
    photo?: string;
    featured?: boolean;
    variants?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  try {
    const product = await updateProduct(id, {
      name: body.name,
      slug: body.slug,
      category:
        body.category && isProductCategory(body.category)
          ? (body.category as ProductCategory)
          : undefined,
      description: body.description,
      photo: body.photo,
      featured: body.featured,
      variants: body.variants,
    });

    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }
    return NextResponse.json({ product });
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

export async function DELETE(_request: NextRequest, context: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await context.params;
  const ok = await deleteProduct(id);
  if (!ok) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

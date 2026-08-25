import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createProduct,
  getBoutiqueSalesStats,
  importDemoProducts,
  listAdminOrders,
  listAdminProducts,
} from "@/lib/boutique-data";
import { isProductCategory } from "@/lib/boutique-shared";
import type { ProductCategory } from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const tab = searchParams.get("tab") ?? "produits";
  const q = searchParams.get("q") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  if (tab === "stats") {
    const stats = await getBoutiqueSalesStats();
    return NextResponse.json({ stats });
  }

  if (tab === "commandes") {
    const orders = await listAdminOrders({ q, status });
    return NextResponse.json({ orders });
  }

  const products = await listAdminProducts({ q, category });
  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: {
    action?: string;
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

  if (body.action === "import_demo") {
    try {
      const result = await importDemoProducts();
      return NextResponse.json({ result });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Import impossible",
        },
        { status: 400 },
      );
    }
  }

  const category = body.category ?? "";
  if (!isProductCategory(category)) {
    return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 });
  }

  try {
    const product = await createProduct({
      name: body.name ?? "",
      slug: body.slug,
      category: category as ProductCategory,
      description: body.description ?? "",
      photo: body.photo,
      featured: body.featured,
      variants: body.variants,
    });

    if (!product) {
      return NextResponse.json(
        { error: "Impossible de créer le produit (MongoDB ?)" },
        { status: 503 },
      );
    }

    return NextResponse.json({ product }, { status: 201 });
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

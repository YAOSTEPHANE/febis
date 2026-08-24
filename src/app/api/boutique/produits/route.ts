import { NextRequest, NextResponse } from "next/server";
import { listPublicProducts } from "@/lib/boutique-data";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const products = await listPublicProducts({ category, q });
  return NextResponse.json({ products });
}

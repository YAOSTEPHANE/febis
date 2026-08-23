import { NextResponse } from "next/server";
import { listPublicProducts } from "@/lib/boutique-data";

export async function GET() {
  const products = await listPublicProducts();
  return NextResponse.json({ products });
}

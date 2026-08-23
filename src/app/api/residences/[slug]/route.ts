import { NextResponse } from "next/server";
import { getPublicLodgingBySlug } from "@/lib/residences-data";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const lodging = await getPublicLodgingBySlug(slug);

  if (!lodging) {
    return NextResponse.json({ error: "Logement introuvable." }, { status: 404 });
  }

  return NextResponse.json({ lodging });
}

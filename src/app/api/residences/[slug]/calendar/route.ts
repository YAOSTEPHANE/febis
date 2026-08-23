import { NextRequest, NextResponse } from "next/server";
import { getCalendarForSlug } from "@/lib/residences-data";

type Params = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const { searchParams } = request.nextUrl;
  const now = new Date();
  const year = Number(searchParams.get("year") ?? now.getFullYear());
  const month = Number(searchParams.get("month") ?? now.getMonth() + 1);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Mois invalide." }, { status: 400 });
  }

  const calendar = await getCalendarForSlug(slug, year, month);
  if (!calendar) {
    return NextResponse.json({ error: "Logement introuvable." }, { status: 404 });
  }

  return NextResponse.json(calendar);
}

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  listPublicLodgings,
  updateLodgingStatus,
} from "@/lib/residences-data";
import { isLodgingStatus } from "@/lib/residences-shared";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  return NextResponse.json({ lodgings: await listPublicLodgings() });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: { slug?: string; status?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const slug = body.slug?.trim() ?? "";
  const status = body.status ?? "";
  if (!slug || !isLodgingStatus(status)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const lodging = await updateLodgingStatus(slug, status);
  if (!lodging) {
    return NextResponse.json({ error: "Logement introuvable" }, { status: 404 });
  }
  return NextResponse.json({ lodging });
}

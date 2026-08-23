import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  deleteTestimonial,
  listTestimonialsAdmin,
  upsertTestimonial,
} from "@/lib/homepage-data";
import type { Testimonial } from "@/lib/temoignages";
import { ACTIVITIES } from "@/lib/types";

function isTestimonial(value: unknown): value is Testimonial {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.quote === "string" &&
    typeof v.name === "string" &&
    typeof v.role === "string" &&
    typeof v.activity === "string" &&
    (ACTIVITIES as readonly string[]).includes(v.activity) &&
    (v.rating === 4 || v.rating === 5)
  );
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const items = await listTestimonialsAdmin();
  return NextResponse.json({ items });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!isTestimonial(body)) {
    return NextResponse.json({ error: "Témoignage invalide" }, { status: 400 });
  }

  try {
    const item = await upsertTestimonial(body);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Impossible d’enregistrer",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  try {
    await deleteTestimonial(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Suppression impossible",
      },
      { status: 500 },
    );
  }
}

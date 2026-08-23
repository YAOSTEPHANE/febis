import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getHomepageSection,
  saveHomepageSection,
} from "@/lib/homepage-data";
import {
  HOMEPAGE_DEFAULTS,
  type HomepageKey,
} from "@/lib/homepage-content";

const KEYS = Object.keys(HOMEPAGE_DEFAULTS) as HomepageKey[];

function isHomepageKey(value: string): value is HomepageKey {
  return (KEYS as string[]).includes(value);
}

type Ctx = { params: Promise<{ key: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { key } = await context.params;
  if (!isHomepageKey(key)) {
    return NextResponse.json({ error: "Clé invalide" }, { status: 400 });
  }

  const data = await getHomepageSection(key);
  return NextResponse.json({ key, data });
}

export async function PUT(request: NextRequest, context: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { key } = await context.params;
  if (!isHomepageKey(key)) {
    return NextResponse.json({ error: "Clé invalide" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  try {
    const data = await saveHomepageSection(
      key,
      body as never,
    );
    return NextResponse.json({ ok: true, key, data });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Impossible d’enregistrer";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

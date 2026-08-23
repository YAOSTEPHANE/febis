import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { seedHomepageDefaults } from "@/lib/homepage-data";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    await seedHomepageDefaults();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible d’initialiser le contenu",
      },
      { status: 500 },
    );
  }
}

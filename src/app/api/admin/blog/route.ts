import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  deleteBlogPost,
  listBlogPostsAdmin,
  upsertBlogPost,
} from "@/lib/homepage-data";
import type { BlogPost } from "@/lib/blog";

function isBlogPost(value: unknown): value is BlogPost {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.slug === "string" &&
    typeof v.title === "string" &&
    typeof v.excerpt === "string" &&
    Array.isArray(v.content) &&
    typeof v.category === "string" &&
    typeof v.author === "string" &&
    typeof v.date === "string" &&
    typeof v.readMinutes === "number" &&
    typeof v.image === "string"
  );
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const posts = await listBlogPostsAdmin();
  return NextResponse.json({ posts });
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

  if (!isBlogPost(body)) {
    return NextResponse.json({ error: "Article invalide" }, { status: 400 });
  }

  try {
    const post = await upsertBlogPost(body);
    return NextResponse.json({ ok: true, post });
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

  const slug = request.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "Slug manquant" }, { status: 400 });
  }

  try {
    await deleteBlogPost(slug);
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

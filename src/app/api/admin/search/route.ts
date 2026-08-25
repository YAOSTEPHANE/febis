import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { adminMultiSearch } from "@/lib/admin-search";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !can(session, "search")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q") ?? "";
  const activity = request.nextUrl.searchParams.get("activity") ?? undefined;
  const limitRaw = request.nextUrl.searchParams.get("limit");
  const limit = limitRaw ? Number(limitRaw) : undefined;
  const hits = await adminMultiSearch({
    q,
    activity,
    limit: Number.isFinite(limit) ? limit : undefined,
  });
  return NextResponse.json({ hits });
}

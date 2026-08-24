import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import {
  createManualClient,
  getCrmStats,
  listClientTags,
  listClients,
} from "@/lib/crm";
import type { ClientStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !can(session, "crm")) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  if (searchParams.get("tab") === "stats") {
    return NextResponse.json({ stats: await getCrmStats() });
  }
  if (searchParams.get("tab") === "tags") {
    return NextResponse.json({ tags: await listClientTags() });
  }

  const q = searchParams.get("q") ?? undefined;
  const activity = searchParams.get("activity") ?? undefined;
  const status = (searchParams.get("status") ?? "all") as ClientStatus | "all";
  const tag = searchParams.get("tag") ?? undefined;

  const clients = await listClients({ q, activity, status, tag });
  return NextResponse.json({ clients });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !can(session, "crm")) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    notes?: string;
    status?: ClientStatus;
    tags?: string[] | string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  if (name.length < 2) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  const tags =
    typeof body.tags === "string"
      ? body.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : body.tags;

  const client = await createManualClient({
    name,
    email: body.email,
    phone: body.phone,
    company: body.company,
    notes: body.notes,
    status: body.status,
    tags,
  });

  if (!client) {
    return NextResponse.json(
      { error: "Impossible de créer le client (MongoDB ?)" },
      { status: 503 },
    );
  }

  return NextResponse.json({ client }, { status: 201 });
}

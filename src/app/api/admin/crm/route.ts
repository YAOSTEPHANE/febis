import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createManualClient,
  listClients,
} from "@/lib/crm";
import type { ClientStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const activity = searchParams.get("activity") ?? undefined;
  const status = (searchParams.get("status") ?? "all") as ClientStatus | "all";
  const tag = searchParams.get("tag") ?? undefined;

  const clients = await listClients({ q, activity, status, tag });
  return NextResponse.json({ clients });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    notes?: string;
    status?: ClientStatus;
    tags?: string[];
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

  const client = await createManualClient({
    name,
    email: body.email,
    phone: body.phone,
    company: body.company,
    notes: body.notes,
    status: body.status,
    tags: body.tags,
  });

  if (!client) {
    return NextResponse.json(
      { error: "Impossible de créer le client (MongoDB ?)" },
      { status: 503 },
    );
  }

  return NextResponse.json({ client }, { status: 201 });
}

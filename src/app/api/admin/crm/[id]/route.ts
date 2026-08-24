import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  addClientNote,
  getClientDetail,
  updateClientProfile,
} from "@/lib/crm";
import type { ClientStatus } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const detail = await getClientDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  return NextResponse.json(detail);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    notes?: string;
    status?: ClientStatus;
    tags?: string[];
    note?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (body.note?.trim()) {
    const ok = await addClientNote(id, body.note);
    if (!ok) {
      return NextResponse.json(
        { error: "Impossible d’ajouter la note" },
        { status: 400 },
      );
    }
  }

  const client = await updateClientProfile(id, {
    name: body.name,
    email: body.email,
    phone: body.phone,
    company: body.company,
    notes: body.notes,
    status: body.status,
    tags: body.tags,
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const detail = await getClientDetail(id);
  return NextResponse.json(detail ?? { client });
}

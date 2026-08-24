import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import {
  addClientInteraction,
  getClientDetail,
  updateClientProfile,
} from "@/lib/crm";
import type { Activity, ClientStatus, InteractionType } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || !can(session, "crm")) {
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
  if (!session || !can(session, "crm")) {
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
    tags?: string[] | string;
    note?: string;
    interactionType?: string;
    interactionTitle?: string;
    interactionActivity?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (body.note?.trim()) {
    const type = (body.interactionType ?? "note") as InteractionType | string;
    const ok = await addClientInteraction(id, {
      type,
      title: body.interactionTitle,
      message: body.note,
      activity: (body.interactionActivity as Activity | "general") || "general",
    });
    if (!ok) {
      return NextResponse.json(
        { error: "Impossible d’ajouter l’interaction" },
        { status: 400 },
      );
    }
  }

  const tags =
    typeof body.tags === "string"
      ? body.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : body.tags;

  const client = await updateClientProfile(id, {
    name: body.name,
    email: body.email,
    phone: body.phone,
    company: body.company,
    notes: body.notes,
    status: body.status,
    tags,
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const detail = await getClientDetail(id);
  return NextResponse.json(detail ?? { client });
}

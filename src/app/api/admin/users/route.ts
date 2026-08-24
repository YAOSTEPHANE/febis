import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { can, createUser, listUsers, roleMatrix, updateUser } from "@/lib/rbac";
import type { Role } from "@/lib/types";
import { ROLES } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session || !can(session, "users")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json({
    users: await listUsers(),
    matrix: roleMatrix(),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !can(session, "users")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const role = String(body.role ?? "");
  if (!(ROLES as readonly string[]).includes(role)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }

  try {
    const user = await createUser({
      email: String(body.email ?? ""),
      name: String(body.name ?? ""),
      role: role as Role,
      password: String(body.password ?? ""),
      active: body.active !== false,
    });
    if (!user) {
      return NextResponse.json({ error: "MongoDB indisponible" }, { status: 503 });
    }
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || !can(session, "users")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const id = String(body.id ?? "");
  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  const patch: {
    name?: string;
    role?: Role;
    active?: boolean;
    password?: string;
  } = {};
  if (typeof body.name === "string") patch.name = body.name;
  if (typeof body.role === "string" && (ROLES as readonly string[]).includes(body.role)) {
    patch.role = body.role as Role;
  }
  if (typeof body.active === "boolean") patch.active = body.active;
  if (typeof body.password === "string" && body.password.length >= 8) {
    patch.password = body.password;
  }

  const user = await updateUser(id, patch);
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }
  return NextResponse.json({ user });
}

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  can,
  countActiveAdmins,
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  roleMatrix,
  updateUser,
} from "@/lib/rbac";
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
    selfId: session.sub,
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

  const password = String(body.password ?? "");
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Mot de passe trop court (8 caractères min.)" },
      { status: 400 },
    );
  }

  try {
    const user = await createUser({
      email: String(body.email ?? ""),
      name: String(body.name ?? ""),
      role: role as Role,
      password,
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

  const existing = await getUserById(id);
  if (!existing) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const isSelf = session.sub === id;
  const patch: {
    name?: string;
    email?: string;
    role?: Role;
    active?: boolean;
    password?: string;
  } = {};

  if (typeof body.name === "string" && body.name.trim()) {
    patch.name = body.name;
  }
  if (typeof body.email === "string" && body.email.trim()) {
    patch.email = body.email;
  }
  if (
    typeof body.role === "string" &&
    (ROLES as readonly string[]).includes(body.role)
  ) {
    patch.role = body.role as Role;
  }
  if (typeof body.active === "boolean") {
    patch.active = body.active;
  }
  if (typeof body.password === "string" && body.password.length > 0) {
    patch.password = body.password;
  }

  if (isSelf && patch.active === false) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas désactiver votre propre compte" },
      { status: 400 },
    );
  }

  const wouldLoseAdmin =
    existing.role === "admin" &&
    existing.active &&
    ((patch.role !== undefined && patch.role !== "admin") ||
      patch.active === false);

  if (wouldLoseAdmin) {
    const admins = await countActiveAdmins();
    if (admins <= 1) {
      return NextResponse.json(
        { error: "Impossible : il doit rester au moins un admin actif" },
        { status: 400 },
      );
    }
  }

  try {
    const user = await updateUser(id, patch);
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 },
      );
    }
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || !can(session, "users")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  if (session.sub === id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas supprimer votre propre compte" },
      { status: 400 },
    );
  }

  const existing = await getUserById(id);
  if (!existing) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  if (existing.role === "admin" && existing.active) {
    const admins = await countActiveAdmins();
    if (admins <= 1) {
      return NextResponse.json(
        { error: "Impossible : il doit rester au moins un admin actif" },
        { status: 400 },
      );
    }
  }

  const ok = await deleteUser(id);
  if (!ok) {
    return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

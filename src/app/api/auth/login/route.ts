import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { ROLES } from "@/lib/types";

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const email = asTrimmedString(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email et mot de passe requis." },
      { status: 400 },
    );
  }

  try {
    const db = await getDb();
    const user = await db.collection("users").findOne<{
      _id: { toString(): string };
      email: string;
      passwordHash: string;
      name: string;
      role: Role;
      active: boolean;
    }>({ email });

    if (!user || !user.active) {
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 },
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 },
      );
    }

    if (!ROLES.includes(user.role)) {
      return NextResponse.json(
        { error: "Profil utilisateur invalide." },
        { status: 403 },
      );
    }

    const token = await createSessionToken({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Connexion impossible. Vérifiez MongoDB." },
      { status: 503 },
    );
  }
}

import { NextResponse } from "next/server";
import { getSession, roleLabel } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      email: session.email,
      name: session.name,
      role: session.role,
      roleLabel: roleLabel(session.role),
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { createBackupSnapshot, listBackups } from "@/lib/backup";

export async function GET() {
  const session = await getSession();
  if (!session || !can(session, "backup")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json({ backups: await listBackups() });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !can(session, "backup")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: { label?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const backup = await createBackupSnapshot({
    label: body.label?.trim() || `Snapshot ${new Date().toLocaleString("fr-FR")}`,
    createdBy: session.email,
  });
  if (!backup) {
    return NextResponse.json({ error: "MongoDB indisponible" }, { status: 503 });
  }
  return NextResponse.json({ backup }, { status: 201 });
}

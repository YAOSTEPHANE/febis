import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getDirectionMetrics } from "@/lib/direction-metrics";
import { ensureDailyBackup } from "@/lib/backup";

export async function GET() {
  const session = await getSession();
  if (!session || !can(session, "dashboard")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Sauvegarde automatique quotidienne (CDC §4.10) — non bloquante
  void ensureDailyBackup(session.email).catch(() => undefined);

  return NextResponse.json({ metrics: await getDirectionMetrics() });
}

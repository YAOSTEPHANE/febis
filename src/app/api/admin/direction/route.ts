import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getDirectionMetrics } from "@/lib/direction-metrics";
import { getDashboardChartData } from "@/lib/dashboard-charts";
import { ensureDailyBackup } from "@/lib/backup";
import { runAutomaticNotificationScans } from "@/lib/notifications";

export async function GET() {
  const session = await getSession();
  if (!session || !can(session, "dashboard")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Sauvegarde automatique quotidienne (CDC §4.10) — non bloquante
  void ensureDailyBackup(session.email).catch(() => undefined);
  // Alertes stock / échéances — non bloquant, dédupliqué
  void runAutomaticNotificationScans().catch(() => undefined);

  const [metrics, charts] = await Promise.all([
    getDirectionMetrics(),
    getDashboardChartData(),
  ]);

  return NextResponse.json({ metrics, charts });
}

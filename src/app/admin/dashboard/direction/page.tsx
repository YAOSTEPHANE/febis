import { requireAdminSession } from "@/lib/admin-auth";
import { can } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { getDirectionMetrics } from "@/lib/direction-metrics";
import { getDashboardChartData } from "@/lib/dashboard-charts";
import { getRhOverview } from "@/lib/rh";
import { DirectionAdminClient } from "@/components/admin/DirectionAdminClient";

export default async function AdminDirectionPage() {
  const session = await requireAdminSession();
  if (!can(session, "dashboard")) {
    redirect("/admin/dashboard");
  }

  const [metrics, charts, rh] = await Promise.all([
    getDirectionMetrics(),
    getDashboardChartData(),
    getRhOverview(),
  ]);

  return (
    <DirectionAdminClient
      initialMetrics={metrics}
      initialCharts={charts}
      leavesPending={rh.leavesPending}
      employeesActive={rh.employeesActive}
    />
  );
}

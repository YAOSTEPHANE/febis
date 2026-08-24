import "server-only";
import type { Db } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getDirectionMetrics } from "@/lib/direction-metrics";
import { getFinanceDashboard } from "@/lib/finance";
import { paymentChannelLabel } from "@/lib/finance-shared";
import type { DashboardChartData } from "@/lib/dashboard-charts-shared";

export type { DashboardChartData } from "@/lib/dashboard-charts-shared";

async function tryDb(): Promise<Db | null> {
  try {
    return await getDb();
  } catch {
    return null;
  }
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

export async function getDashboardChartData(): Promise<DashboardChartData> {
  const empty: DashboardChartData = {
    caByActivity: [],
    revenueVsExpenses: [],
    paymentsByChannel: [],
    monthlyTrend: [],
    gauges: { occupancy: 0, stock: 100 },
  };

  const db = await tryDb();
  if (!db) return empty;

  const [metrics, finance] = await Promise.all([
    getDirectionMetrics(),
    getFinanceDashboard(),
  ]);

  const caByActivity = metrics.caByActivity.map((row) => ({
    name: row.label,
    ca: row.amount,
  }));

  const revenueVsExpenses = finance.byActivity.map((row) => ({
    name: row.label,
    revenus: row.revenue,
    depenses: row.expenses,
  }));

  const paymentsByChannel = finance.byChannel
    .map((row) => ({
      name: paymentChannelLabel(row.channel),
      value: row.inbound,
    }))
    .filter((row) => row.value > 0);

  // 6 derniers mois
  const now = new Date();
  const keys: string[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }

  const since = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [payments, reservations] = await Promise.all([
    db
      .collection("payments")
      .find({
        status: "confirme",
        direction: "entrant",
        paidAt: { $gte: since },
      })
      .project({ amount: 1, paidAt: 1 })
      .limit(3000)
      .toArray(),
    db
      .collection("reservations")
      .find({
        cancelled: { $ne: true },
        createdAt: { $gte: since },
      })
      .project({ createdAt: 1 })
      .limit(3000)
      .toArray(),
  ]);

  const payMap = Object.fromEntries(keys.map((k) => [k, 0])) as Record<
    string,
    number
  >;
  const resMap = Object.fromEntries(keys.map((k) => [k, 0])) as Record<
    string,
    number
  >;

  for (const p of payments) {
    const d = p.paidAt instanceof Date ? p.paidAt : new Date(p.paidAt as string);
    if (Number.isNaN(d.getTime())) continue;
    const k = monthKey(d);
    if (k in payMap) payMap[k]! += Number(p.amount ?? 0);
  }

  for (const r of reservations) {
    const d =
      r.createdAt instanceof Date
        ? r.createdAt
        : new Date(r.createdAt as string);
    if (Number.isNaN(d.getTime())) continue;
    const k = monthKey(d);
    if (k in resMap) resMap[k]! += 1;
  }

  const monthlyTrend = keys.map((k) => ({
    month: monthLabel(k),
    encaissements: payMap[k] ?? 0,
    reservations: resMap[k] ?? 0,
  }));

  return {
    caByActivity,
    revenueVsExpenses,
    paymentsByChannel:
      paymentsByChannel.length > 0
        ? paymentsByChannel
        : [{ name: "Aucun", value: 1 }],
    monthlyTrend,
    gauges: {
      occupancy: metrics.occupancyRate,
      stock: metrics.stockRate,
    },
  };
}

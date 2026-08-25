"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { formatXof } from "@/lib/crm-shared";
import type { DirectionMetrics } from "@/lib/direction-metrics-shared";
import type { DashboardChartData } from "@/lib/dashboard-charts-shared";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import { AdminNavIcon } from "@/components/admin/AdminNavIcon";

const KPI_LINKS = [
  {
    key: "ca" as const,
    label: "Chiffre d’affaires",
    href: "/admin/dashboard/finance",
  },
  {
    key: "occupancy" as const,
    label: "Occupation",
    href: "/admin/dashboard/residences",
  },
  {
    key: "stock" as const,
    label: "Stock dispo",
    href: "/admin/dashboard/evenementiel",
  },
  {
    key: "projects" as const,
    label: "Projets ouverts",
    href: "/admin/dashboard/btp",
  },
];

const QUICK_LINKS = [
  {
    href: "/admin/dashboard/finance",
    label: "Finance",
    description: "Revenus, dépenses, impayés",
  },
  {
    href: "/admin/dashboard/facturation",
    label: "Facturation",
    description: "Devis & factures PDF",
  },
  {
    href: "/admin/dashboard/paiements",
    label: "Paiements",
    description: "Mobile Money & encaissements",
  },
  {
    href: "/admin/dashboard/crm",
    label: "CRM",
    description: "Clients & pipeline",
  },
  {
    href: "/admin/dashboard/residences",
    label: "Résidences",
    description: "Occupation & logements",
  },
  {
    href: "/admin/dashboard/notifications",
    label: "Notifications",
    description: "Alertes & canaux",
  },
];

function kpiValue(metrics: DirectionMetrics, key: (typeof KPI_LINKS)[number]["key"]) {
  switch (key) {
    case "ca":
      return metrics.caLabel;
    case "occupancy":
      return metrics.occupancyLabel;
    case "stock":
      return metrics.stockLabel;
    case "projects":
      return metrics.projectsLabel;
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

function kpiHint(metrics: DirectionMetrics, key: (typeof KPI_LINKS)[number]["key"]) {
  switch (key) {
    case "ca":
      return "Factures payées + encaissements";
    case "occupancy":
      return `${metrics.activeReservations} séjour(s) en cours`;
    case "stock":
      return metrics.lowStockCount > 0
        ? `${metrics.lowStockCount} alerte(s)`
        : "Niveaux OK";
    case "projects":
      return `${metrics.btpOpen} chantier(s) BTP`;
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

export function DirectionAdminClient({
  initialMetrics,
  initialCharts,
  leavesPending,
  employeesActive,
}: {
  initialMetrics: DirectionMetrics;
  initialCharts: DashboardChartData;
  leavesPending: number;
  employeesActive: number;
}) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [charts, setCharts] = useState(initialCharts);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(initialMetrics.generatedAt);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/direction");
      const json = (await res.json()) as {
        metrics?: DirectionMetrics;
        charts?: DashboardChartData;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      if (json.metrics) {
        setMetrics(json.metrics);
        setLastRefresh(json.metrics.generatedAt);
      }
      if (json.charts) setCharts(json.charts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => void load(), 60000);
    return () => clearInterval(timer);
  }, [load]);

  const maxCa = Math.max(
    1,
    ...metrics.caByActivity.map((row) => row.amount),
  );

  const alerts = [
    {
      label: "Impayés",
      value: formatXof(metrics.unpaid),
      detail: `${metrics.unpaidCount} facture(s)`,
      href: "/admin/dashboard/finance",
      hot: metrics.unpaidCount > 0,
    },
    {
      label: "Stocks faibles",
      value: String(metrics.lowStockCount),
      detail: "Événementiel / boutique",
      href: "/admin/dashboard/evenementiel",
      hot: metrics.lowStockCount > 0,
    },
    {
      label: "Séjours actifs",
      value: String(metrics.activeReservations),
      detail: "Résidences",
      href: "/admin/dashboard/reservations",
      hot: false,
    },
    {
      label: "Congés RH",
      value: String(leavesPending),
      detail: `${employeesActive} employé(s) actif(s)`,
      href: "/admin/dashboard/rh",
      hot: leavesPending > 0,
    },
  ];

  return (
    <div className="admin-rise space-y-7">
      <section className="admin-command relative px-6 py-7 md:px-8 md:py-8">
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="font-display text-[clamp(1.75rem,3.2vw,2.45rem)] font-extrabold leading-tight tracking-tight text-white">
              Direction{" "}
              <span className="admin-command-gold">FEBiS</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">
              Pilotage temps réel — CA, occupation, stocks, projets et alertes
              métier.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-xs font-semibold text-white/70">
              Sync{" "}
              {new Date(lastRefresh).toLocaleString("fr-FR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="rounded-full border border-[#c9a227]/40 bg-[#c9a227]/15 px-4 py-1.5 text-xs font-bold text-[#f0d78c] transition hover:bg-[#c9a227]/25 disabled:opacity-60"
            >
              {loading ? "Actualisation…" : "Actualiser"}
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-xl border border-febis-red/20 bg-febis-red/5 px-4 py-3 text-sm font-semibold text-febis-red">
          {error}
        </p>
      ) : null}

      <section className="admin-rise admin-rise-delay-1">
        <div className="admin-section-label">
          <h2>Indicateurs direction</h2>
          <p>Temps réel</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {KPI_LINKS.map((kpi, index) => (
            <Link
              key={kpi.key}
              href={kpi.href}
              className={cn(
                "admin-panel admin-panel-premium admin-kpi p-5",
                `admin-rise admin-rise-delay-${Math.min(index + 1, 4)}`,
              )}
            >
              <span className="admin-kpi-meter" aria-hidden />
              <div className="relative z-10 flex items-start justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
                  {kpi.label}
                </p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-febis-red/10 text-base text-febis-red">
                  <AdminNavIcon iconKey={kpi.key} href={kpi.href} />
                </span>
              </div>
              <p className="relative z-10 mt-3 font-display text-[1.65rem] font-extrabold leading-none tracking-tight text-febis-ink md:text-3xl">
                {kpiValue(metrics, kpi.key)}
              </p>
              <p className="relative z-10 mt-2 text-xs text-febis-ink/45">
                {kpiHint(metrics, kpi.key)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-5 admin-rise admin-rise-delay-2">
        <div className="admin-panel admin-panel-premium p-5 lg:col-span-3">
          <div className="admin-section-label mb-0">
            <h2>CA par activité</h2>
            <p>Répartition</p>
          </div>
          <ul className="mt-5 space-y-4">
            {metrics.caByActivity.map((row) => {
              const pct = Math.round((row.amount / maxCa) * 100);
              return (
                <li key={row.activity}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-febis-ink">
                      {row.label}
                    </span>
                    <span className="font-bold tabular-nums text-febis-red">
                      {formatXof(row.amount)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-febis-mist">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-febis-red-deep to-febis-red transition-all duration-500"
                      style={{ width: `${Math.max(pct, row.amount > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="admin-panel p-5 lg:col-span-2">
          <div className="admin-section-label mb-0">
            <h2>À surveiller</h2>
            <p>Alertes</p>
          </div>
          <ul className="mt-4 space-y-2">
            {alerts.map((row) => (
              <li key={row.label}>
                <Link
                  href={row.href}
                  className={cn("admin-alert-row", row.hot && "is-hot")}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-febis-ink">
                      {row.label}
                    </span>
                    <span className="text-xs text-febis-ink/45">
                      {row.detail}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-display text-base font-extrabold tabular-nums",
                      row.hot ? "text-febis-red" : "text-febis-ink",
                    )}
                  >
                    {row.value}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="admin-rise admin-rise-delay-3">
        <DashboardCharts data={charts} />
      </div>

      <section className="admin-rise admin-rise-delay-4">
        <div className="admin-section-label">
          <h2>Accès direction</h2>
          <p>Modules</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {QUICK_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="admin-panel admin-module-card group flex gap-3.5 p-4"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-febis-red/15 bg-febis-red/8 text-lg text-febis-red transition group-hover:border-transparent group-hover:bg-febis-red group-hover:text-white">
                <AdminNavIcon href={item.href} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-display text-base font-bold text-febis-ink group-hover:text-febis-red">
                    {item.label}
                  </span>
                  <span className="text-febis-ink/20 transition group-hover:translate-x-0.5 group-hover:text-febis-red">
                    →
                  </span>
                </span>
                <span className="mt-0.5 block text-sm text-febis-ink/50">
                  {item.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

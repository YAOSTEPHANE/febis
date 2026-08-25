"use client";

import Link from "next/link";
import { useState } from "react";
import { ADMIN_NAV } from "@/lib/homepage-content";
import { cn } from "@/lib/cn";
import type { Permission } from "@/lib/rbac-shared";
import type { DashboardChartData } from "@/lib/dashboard-charts-shared";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import { AdminNavIcon } from "@/components/admin/AdminNavIcon";

export type DashboardPilotKpi = {
  label: string;
  value: string;
  hint: string;
  href: string;
};

export type DashboardDomainStat = {
  label: string;
  value: number;
  href: string;
  hint: string;
  mark: string;
};

export type DashboardContact = {
  id: string;
  name: string;
  email: string;
  activity: string;
  createdAt: string;
};

type TabId = "vue" | "metier";

const TABS: Array<{ id: TabId; label: string; hint: string }> = [
  { id: "vue", label: "Vue d’ensemble", hint: "KPI · alertes · graphiques" },
  { id: "metier", label: "Exploitation", hint: "Activités · modules" },
];

const KPI_MARKS = ["CA", "OC", "ST", "PR"] as const;

export function AdminDashboardShell({
  operatorName,
  roleLabel,
  dbOk,
  generatedAt,
  pilot,
  activityStats,
  transverseStats,
  contacts,
  unpaidCount,
  unpaidLabel,
  leavesPending,
  lowStockCount,
  contactsCount,
  permissions,
  charts,
}: {
  operatorName: string;
  roleLabel: string;
  dbOk: boolean;
  generatedAt: string;
  pilot: DashboardPilotKpi[];
  activityStats: DashboardDomainStat[];
  transverseStats: DashboardDomainStat[];
  contacts: DashboardContact[];
  unpaidCount: number;
  unpaidLabel: string;
  leavesPending: number;
  lowStockCount: number;
  contactsCount: number;
  permissions: Permission[];
  charts: DashboardChartData;
}) {
  const [tab, setTab] = useState<TabId>("vue");
  const allowed = new Set(permissions);
  const firstName = operatorName.split(" ")[0] ?? operatorName;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const metierModules = ADMIN_NAV.filter(
    (item) =>
      allowed.has(item.permission) &&
      item.menu !== false &&
      (item.group === "activites" ||
        item.group === "transverse" ||
        item.group === "inbox"),
  );

  const hotCount = [
    unpaidCount > 0,
    leavesPending > 0,
    lowStockCount > 0,
    contactsCount > 0,
  ].filter(Boolean).length;

  return (
    <div className="admin-rise space-y-7">
      <section className="admin-command relative px-6 py-7 md:px-8 md:py-8">
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="font-display text-[clamp(1.75rem,3.5vw,2.6rem)] font-extrabold leading-tight tracking-tight text-white">
              {greeting},{" "}
              <span className="admin-command-gold">{firstName}</span>
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/60">
              {roleLabel}
              {generatedAt
                ? ` · synchronisé ${new Date(generatedAt).toLocaleString("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}`
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur",
                dbOk
                  ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
                  : "border-amber-400/30 bg-amber-500/15 text-amber-100",
              )}
            >
              <span
                className={cn("admin-status-dot", dbOk ? "is-ok" : "is-warn")}
              />
              {dbOk ? "Base connectée" : "Base hors ligne"}
            </span>
            {hotCount > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-febis-red/40 bg-febis-red/25 px-3.5 py-1.5 text-xs font-bold text-white">
                {hotCount} alerte{hotCount > 1 ? "s" : ""} active
                {hotCount > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-xs font-semibold text-white/70">
                Opérations stables
              </span>
            )}
          </div>
        </div>

        {!dbOk ? (
          <div className="relative z-10 mt-5 rounded-xl border border-amber-400/30 bg-amber-500/15 px-4 py-3 text-sm font-semibold text-amber-50">
            MongoDB indisponible — vérifiez{" "}
            <code className="rounded bg-black/20 px-1.5 py-0.5">MONGODB_URI</code>
            .
          </div>
        ) : null}
      </section>

      <div
        className="admin-dash-tabs admin-rise admin-rise-delay-1"
        role="tablist"
        aria-label="Sections du tableau de bord"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={cn("admin-dash-tab", active && "is-active")}
            >
              <span className="block text-sm font-bold leading-tight">
                {t.label}
              </span>
              <span
                className={cn(
                  "mt-0.5 block text-[11px] font-medium",
                  active ? "text-white/75" : "opacity-70",
                )}
              >
                {t.hint}
              </span>
            </button>
          );
        })}
      </div>

      {tab === "vue" ? (
        <OverviewTab
          pilot={pilot}
          unpaidCount={unpaidCount}
          unpaidLabel={unpaidLabel}
          leavesPending={leavesPending}
          lowStockCount={lowStockCount}
          contactsCount={contactsCount}
          contacts={contacts}
          permissions={permissions}
          charts={charts}
          onGoMetier={() => setTab("metier")}
        />
      ) : null}

      {tab === "metier" ? (
        <MetierTab
          activityStats={activityStats}
          transverseStats={transverseStats}
          modules={metierModules}
        />
      ) : null}
    </div>
  );
}

function OverviewTab({
  pilot,
  unpaidCount,
  unpaidLabel,
  leavesPending,
  lowStockCount,
  contactsCount,
  contacts,
  permissions,
  charts,
  onGoMetier,
}: {
  pilot: DashboardPilotKpi[];
  unpaidCount: number;
  unpaidLabel: string;
  leavesPending: number;
  lowStockCount: number;
  contactsCount: number;
  contacts: DashboardContact[];
  permissions: Permission[];
  charts: DashboardChartData;
  onGoMetier: () => void;
}) {
  const allowed = new Set(permissions);
  const alerts = [
    {
      label: "Impayés",
      value: unpaidLabel,
      detail: `${unpaidCount} facture(s)`,
      href: "/admin/dashboard/finance",
      hot: unpaidCount > 0,
      show: allowed.has("finance"),
    },
    {
      label: "Congés en attente",
      value: String(leavesPending),
      detail: "Demandes RH",
      href: "/admin/dashboard/rh",
      hot: leavesPending > 0,
      show: allowed.has("operations"),
    },
    {
      label: "Stocks faibles",
      value: String(lowStockCount),
      detail: "Événementiel / boutique",
      href: "/admin/dashboard/evenementiel",
      hot: lowStockCount > 0,
      show: allowed.has("operations"),
    },
    {
      label: "Messages",
      value: String(contactsCount),
      detail: "Inbox vitrine",
      href: "/admin/dashboard/contacts",
      hot: contactsCount > 0,
      show: allowed.has("operations"),
    },
  ].filter((a) => a.show);

  return (
    <div className="space-y-8" role="tabpanel">
      <section className="admin-rise admin-rise-delay-1">
        <div className="admin-section-label">
          <h2>Indicateurs clés</h2>
          <p>Pilotage</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {pilot.map((kpi, index) => (
            <Link
              key={kpi.label}
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
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-febis-red/10 text-[10px] font-extrabold text-febis-red">
                  {KPI_MARKS[index] ?? "•"}
                </span>
              </div>
              <p className="relative z-10 mt-3 font-display text-[1.65rem] font-extrabold leading-none tracking-tight text-febis-ink md:text-3xl">
                {kpi.value}
              </p>
              <p className="relative z-10 mt-2 text-xs leading-snug text-febis-ink/45">
                {kpi.hint}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-5 admin-rise admin-rise-delay-2">
        <div className="admin-panel admin-panel-premium p-5 lg:col-span-2">
          <div className="admin-section-label mb-0">
            <h2>À traiter</h2>
            <p>Priorités</p>
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
                      "shrink-0 font-display text-lg font-extrabold tabular-nums",
                      row.hot ? "text-febis-red" : "text-febis-ink",
                    )}
                  >
                    {row.value}
                  </span>
                </Link>
              </li>
            ))}
            {alerts.length === 0 ? (
              <li className="rounded-xl border border-dashed border-febis-ink/12 px-4 py-8 text-center text-sm text-febis-ink/45">
                Aucune alerte — tout est à jour.
              </li>
            ) : null}
          </ul>
        </div>

        <div className="admin-panel p-5 lg:col-span-3">
          <div className="flex items-center justify-between gap-3">
            <div className="admin-section-label mb-0">
              <h2>Derniers messages</h2>
              <p>Inbox</p>
            </div>
            <Link
              href="/admin/dashboard/contacts"
              className="shrink-0 text-xs font-bold text-febis-red transition hover:underline"
            >
              Tout voir →
            </Link>
          </div>
          {contacts.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-febis-ink/12 bg-febis-smoke/50 px-4 py-10 text-center text-sm text-febis-ink/50">
              Aucun message pour le moment.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-febis-ink/6">
              {contacts.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start justify-between gap-3 py-3.5 first:pt-1"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-febis-ink">
                      {c.name}
                    </p>
                    <p className="truncate text-xs text-febis-ink/45">
                      {c.email}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md border border-febis-ink/8 bg-febis-mist/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-febis-ink/55">
                    {c.activity || "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="admin-rise admin-rise-delay-3">
        <DashboardCharts data={charts} />
      </div>

      <section className="admin-panel flex flex-wrap items-center justify-between gap-4 p-5 admin-rise admin-rise-delay-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-febis-gold-deep">
            Accès rapide
          </p>
          <p className="mt-1 text-sm text-febis-ink/55">
            Modules métier et exploitation.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoMetier}
          className="cta-premium"
        >
          Modules d’exploitation →
        </button>
      </section>
    </div>
  );
}

function MetierTab({
  activityStats,
  transverseStats,
  modules,
}: {
  activityStats: DashboardDomainStat[];
  transverseStats: DashboardDomainStat[];
  modules: Array<{
    href: string;
    label: string;
    description: string;
    mark: string;
    group: string;
  }>;
}) {
  return (
    <div className="space-y-8" role="tabpanel">
      <section className="admin-rise">
        <div className="admin-section-label">
          <h2>Activités</h2>
          <p>Volumes</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {activityStats.map((stat, index) => (
            <Link
              key={stat.href}
              href={stat.href}
              className={cn(
                "admin-panel admin-kpi p-5",
                `admin-rise admin-rise-delay-${Math.min(index + 1, 4)}`,
              )}
            >
              <span className="admin-kpi-meter" aria-hidden />
              <div className="relative z-10 flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-febis-red to-febis-red-deep text-base text-white shadow-lg shadow-febis-red/25">
                  <AdminNavIcon href={stat.href} />
                </span>
                <p className="text-sm font-semibold text-febis-ink/60">
                  {stat.label}
                </p>
              </div>
              <p className="relative z-10 mt-4 font-display text-4xl font-extrabold tracking-tight text-febis-ink">
                {stat.value}
              </p>
              <p className="relative z-10 mt-1 text-xs text-febis-ink/45">
                {stat.hint}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-rise admin-rise-delay-1">
        <div className="admin-section-label">
          <h2>Transverse & demandes</h2>
          <p>Support</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {transverseStats.map((stat) => (
            <Link
              key={stat.href}
              href={stat.href}
              className="admin-panel admin-kpi p-5"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-febis-gold/30 bg-[#c9a227]/12 text-base text-[#8a7010]">
                  <AdminNavIcon href={stat.href} />
                </span>
                <p className="text-sm font-semibold text-febis-ink/60">
                  {stat.label}
                </p>
              </div>
              <p className="mt-4 font-display text-4xl font-extrabold tracking-tight text-febis-ink">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-febis-ink/45">{stat.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-rise admin-rise-delay-2">
        <div className="admin-section-label">
          <h2>Modules d’exploitation</h2>
          <p>Navigation</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((item) => (
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

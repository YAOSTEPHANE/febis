"use client";

import Link from "next/link";
import { useState } from "react";
import { ADMIN_NAV } from "@/lib/homepage-content";
import { cn } from "@/lib/cn";
import type { Permission } from "@/lib/rbac-shared";
import type { DashboardChartData } from "@/lib/dashboard-charts-shared";
import { DashboardCharts } from "@/components/admin/DashboardCharts";

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

type TabId = "vue" | "contenu" | "metier";

const TABS: Array<{ id: TabId; label: string; hint: string }> = [
  { id: "vue", label: "Vue d’ensemble", hint: "KPI, alertes & graphiques" },
  { id: "contenu", label: "Contenu à renseigner", hint: "Vitrine du site" },
  { id: "metier", label: "Exploitation", hint: "Activités & transverse" },
];

export function AdminDashboardShell({
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
  const canVitrine = allowed.has("vitrine");

  const contenuModules = ADMIN_NAV.filter(
    (item) =>
      allowed.has(item.permission) &&
      (item.group === "vitrine" ||
        item.href === "/admin/dashboard/travaux"),
  );
  const metierModules = ADMIN_NAV.filter(
    (item) =>
      allowed.has(item.permission) &&
      (item.group === "activites" ||
        item.group === "transverse" ||
        item.group === "inbox") &&
      item.href !== "/admin/dashboard/travaux",
  );

  const visibleTabs = TABS.filter((t) => {
    if (t.id === "contenu") return canVitrine;
    return true;
  });

  return (
    <div>
      <header className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-febis-ink/50">
            {generatedAt
              ? `Mis à jour ${new Date(generatedAt).toLocaleString("fr-FR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}`
              : "Vue consolidée FEBiS"}
          </p>
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
              dbOk
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-900",
            )}
          >
            <span
              className={cn("admin-status-dot", dbOk ? "is-ok" : "is-warn")}
            />
            {dbOk ? "Base connectée" : "Base hors ligne"}
          </span>
        </div>

        {!dbOk ? (
          <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            MongoDB indisponible — vérifiez{" "}
            <code className="rounded bg-white/80 px-1">MONGODB_URI</code>.
          </div>
        ) : null}

        <div
          className="mt-4 flex flex-wrap gap-1 border-b border-febis-ink/10"
          role="tablist"
          aria-label="Sections du tableau de bord"
        >
          {visibleTabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={cn(
                  "-mb-px border-b-2 px-4 py-2.5 text-left transition",
                  active
                    ? "border-febis-red text-febis-ink"
                    : "border-transparent text-febis-ink/45 hover:text-febis-ink/75",
                )}
              >
                <span className="block text-sm font-bold">{t.label}</span>
                <span className="block text-[11px] font-medium opacity-70">
                  {t.hint}
                </span>
              </button>
            );
          })}
        </div>
      </header>

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
          onGoContenu={canVitrine ? () => setTab("contenu") : undefined}
          onGoMetier={() => setTab("metier")}
        />
      ) : null}

      {tab === "contenu" && canVitrine ? (
        <ContenuTab modules={contenuModules} />
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
  onGoContenu,
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
  onGoContenu?: () => void;
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
      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-febis-ink">
          Indicateurs clés
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {pilot.map((kpi) => (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="admin-panel admin-panel-premium p-5 transition hover:border-febis-red/25"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-febis-gold-deep">
                {kpi.label}
              </p>
              <p className="mt-2 font-display text-2xl font-extrabold text-febis-ink">
                {kpi.value}
              </p>
              <p className="mt-1 text-xs text-febis-ink/45">{kpi.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="admin-panel p-5">
          <h2 className="font-display text-lg font-bold text-febis-ink">
            À traiter
          </h2>
          <ul className="mt-4 space-y-2">
            {alerts.map((row) => (
              <li key={row.label}>
                <Link
                  href={row.href}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 transition hover:border-febis-red/25",
                    row.hot
                      ? "border-febis-red/15 bg-febis-red/5"
                      : "border-febis-ink/6 bg-white/60",
                  )}
                >
                  <span>
                    <span className="block text-sm font-bold text-febis-ink">
                      {row.label}
                    </span>
                    <span className="text-xs text-febis-ink/45">
                      {row.detail}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "font-display text-lg font-extrabold",
                      row.hot ? "text-febis-red" : "text-febis-ink",
                    )}
                  >
                    {row.value}
                  </span>
                </Link>
              </li>
            ))}
            {alerts.length === 0 ? (
              <li className="text-sm text-febis-ink/45">Aucune alerte.</li>
            ) : null}
          </ul>
        </div>

        <div className="admin-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-febis-ink">
              Derniers messages
            </h2>
            <Link
              href="/admin/dashboard/contacts"
              className="text-xs font-bold text-febis-red hover:underline"
            >
              Tout voir →
            </Link>
          </div>
          {contacts.length === 0 ? (
            <p className="mt-6 rounded-xl bg-febis-smoke/80 px-4 py-6 text-center text-sm text-febis-ink/50">
              Aucun message.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {contacts.map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl border border-febis-ink/6 bg-white/60 px-3.5 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-febis-ink">
                        {c.name}
                      </p>
                      <p className="truncate text-xs text-febis-ink/45">
                        {c.email}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-febis-mist px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-febis-ink/55">
                      {c.activity || "—"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <DashboardCharts data={charts} />

      <section className="flex flex-wrap gap-3">
        {onGoContenu ? (
          <button type="button" onClick={onGoContenu} className="cta-premium">
            Remplir le contenu du site →
          </button>
        ) : null}
        <button
          type="button"
          onClick={onGoMetier}
          className="rounded-full border border-febis-ink/15 px-5 py-2.5 text-sm font-bold"
        >
          Modules d’exploitation →
        </button>
      </section>
    </div>
  );
}

function ContenuTab({
  modules,
}: {
  modules: Array<{
    href: string;
    label: string;
    description: string;
    mark: string;
  }>;
}) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function seedHomepage() {
    setLoading(true);
    setStatus("");
    setError("");
    try {
      const res = await fetch("/api/admin/seed-homepage", { method: "POST" });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Échec");
      setStatus("Contenu d’accueil initialisé.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6" role="tabpanel">
      <div className="admin-panel admin-panel-premium p-5">
        <h2 className="font-display text-xl font-bold text-febis-ink">
          Contenu à renseigner
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-febis-ink/55">
          Tout ce que l’administrateur doit compléter pour la vitrine — hero,
          catégories, stats, pôles, blog, témoignages, plateforme et travaux —
          est regroupé dans cet onglet.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void seedHomepage()}
            disabled={loading}
            className="rounded-full border border-febis-ink/15 px-4 py-2 text-sm font-bold disabled:opacity-60"
          >
            {loading ? "Initialisation…" : "Initialiser le contenu par défaut"}
          </button>
          {status || error ? (
            <p
              className={cn(
                "text-sm font-semibold",
                error ? "text-febis-red" : "text-emerald-700",
              )}
            >
              {error || status}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="admin-panel admin-module-card group flex gap-3.5 p-4"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-febis-red/15 bg-febis-red/8 text-xs font-extrabold text-febis-red transition group-hover:border-transparent group-hover:bg-febis-red group-hover:text-white">
              {item.mark}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="font-display text-lg font-bold text-febis-ink">
                  {item.label}
                </span>
                <span className="text-febis-ink/25 transition group-hover:translate-x-0.5 group-hover:text-febis-red">
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

      {modules.length === 0 ? (
        <p className="rounded-xl border border-dashed border-febis-ink/15 px-6 py-10 text-center text-sm text-febis-ink/45">
          Aucun module vitrine accessible pour ce profil.
        </p>
      ) : null}
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
      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-febis-ink">
          Activités
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {activityStats.map((stat) => (
            <Link
              key={stat.href}
              href={stat.href}
              className="admin-panel p-4 transition hover:border-febis-red/25"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-febis-red/10 text-[10px] font-extrabold text-febis-red">
                  {stat.mark}
                </span>
                <p className="text-sm font-semibold text-febis-ink/60">
                  {stat.label}
                </p>
              </div>
              <p className="mt-3 font-display text-3xl font-extrabold text-febis-ink">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-febis-ink/45">{stat.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-febis-ink">
          Transverse & demandes
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {transverseStats.map((stat) => (
            <Link
              key={stat.href}
              href={stat.href}
              className="admin-panel p-4 transition hover:border-febis-red/25"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-febis-red/10 text-[10px] font-extrabold text-febis-red">
                  {stat.mark}
                </span>
                <p className="text-sm font-semibold text-febis-ink/60">
                  {stat.label}
                </p>
              </div>
              <p className="mt-3 font-display text-3xl font-extrabold text-febis-ink">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-febis-ink/45">{stat.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-febis-ink">
          Tous les modules d’exploitation
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="admin-panel group flex gap-3 p-4 transition hover:border-febis-red/25"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-febis-red/10 text-xs font-extrabold text-febis-red">
                {item.mark}
              </span>
              <span>
                <span className="block font-display text-base font-bold text-febis-ink group-hover:text-febis-red">
                  {item.label}
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

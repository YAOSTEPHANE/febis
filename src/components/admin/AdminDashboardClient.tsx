"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ADMIN_NAV,
  ADMIN_NAV_GROUPS,
  type AdminNavGroup,
} from "@/lib/homepage-content";
import { cn } from "@/lib/cn";

export type DashboardStat = {
  label: string;
  value: number;
  href: string;
  hint: string;
  group: AdminNavGroup;
  mark: string;
};

export type DashboardContact = {
  id: string;
  name: string;
  email: string;
  activity: string;
  createdAt: string;
};

export function DashboardCommandHero({
  operatorName,
  dbOk,
  totalSignals,
}: {
  operatorName: string;
  dbOk: boolean;
  totalSignals: number;
}) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <section className="admin-command admin-rise relative mb-8 p-6 md:p-8">
      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md border border-white/15 bg-white/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f0d78c]">
              FEBiS · Plateforme
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-semibold text-white/75">
              <span
                className={cn(
                  "admin-status-dot",
                  dbOk ? "is-ok" : "is-warn",
                )}
              />
              {dbOk ? "Base connectée" : "Base hors ligne"}
            </span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            {greeting},{" "}
            <span className="admin-command-gold">{operatorName.split(" ")[0]}</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65 md:text-[15px]">
            Pilotez la vitrine, les catalogues et les demandes clients depuis
            un poste de commande unifié — style NOYA × FEBiS.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              Signaux
            </p>
            <p className="mt-2 font-display text-3xl font-extrabold text-white">
              {totalSignals}
            </p>
            <p className="mt-1 text-xs text-white/45">éléments en base</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              Accès
            </p>
            <p className="mt-2 font-display text-3xl font-extrabold text-[#f0d78c]">
              Live
            </p>
            <Link
              href="/"
              target="_blank"
              className="mt-1 inline-block text-xs font-semibold text-white/70 underline-offset-2 hover:text-white hover:underline"
            >
              Prévisualiser ↗
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AdminStatsGrid({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat, index) => (
        <Link
          key={stat.label}
          href={stat.href}
          className={cn(
            "admin-panel admin-panel-premium admin-kpi admin-rise group p-5",
            index === 0 && "admin-rise-delay-1",
            index === 1 && "admin-rise-delay-2",
            index === 2 && "admin-rise-delay-3",
            index >= 3 && "admin-rise-delay-4",
          )}
        >
          <span className="admin-kpi-meter" aria-hidden />
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-febis-red/10 text-[11px] font-extrabold text-febis-red transition group-hover:bg-febis-red group-hover:text-white">
                {stat.mark}
              </span>
              <p className="text-sm font-semibold text-febis-ink/60">
                {stat.label}
              </p>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-febis-ink/25 transition group-hover:text-febis-red">
              Ouvrir
            </span>
          </div>
          <p className="relative z-10 mt-4 font-display text-4xl font-extrabold tracking-tight text-febis-ink">
            {stat.value}
            <span className="ml-1 text-febis-red">.</span>
          </p>
          <p className="relative z-10 mt-1.5 text-xs text-febis-ink/45">
            {stat.hint}
          </p>
        </Link>
      ))}
    </div>
  );
}

export function DashboardQuickActions() {
  const actions = [
    {
      href: "/admin/dashboard/hero",
      label: "Éditer le hero",
      hint: "Accroche & CTA",
    },
    {
      href: "/admin/dashboard/blog",
      label: "Publier un article",
      hint: "Contenu éditorial",
    },
    {
      href: "/admin/dashboard/contacts",
      label: "Lire les messages",
      hint: "Inbox vitrine",
    },
    {
      href: "/admin/dashboard/travaux",
      label: "Ajouter un travail",
      hint: "Portfolio",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="admin-panel group flex flex-col justify-between p-4 transition hover:border-febis-red/25"
        >
          <p className="font-display text-base font-bold text-febis-ink group-hover:text-febis-red">
            {action.label}
          </p>
          <p className="mt-2 text-xs text-febis-ink/45">{action.hint}</p>
        </Link>
      ))}
    </div>
  );
}

export function DashboardInboxPreview({
  contacts,
}: {
  contacts: DashboardContact[];
}) {
  return (
    <div className="admin-panel admin-panel-premium h-full p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold text-febis-ink">
            Derniers contacts
          </p>
          <p className="text-xs text-febis-ink/45">Messages vitrine récents</p>
        </div>
        <Link
          href="/admin/dashboard/contacts"
          className="text-xs font-bold text-febis-red hover:underline"
        >
          Tout voir →
        </Link>
      </div>

      {contacts.length === 0 ? (
        <p className="mt-6 rounded-xl bg-febis-smoke/80 px-4 py-6 text-center text-sm text-febis-ink/50">
          Aucun message pour le moment.
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
                  <p className="truncate text-xs text-febis-ink/45">{c.email}</p>
                </div>
                <span className="shrink-0 rounded-md bg-febis-mist px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-febis-ink/55">
                  {c.activity || "—"}
                </span>
              </div>
              {c.createdAt ? (
                <p className="mt-1.5 text-[11px] text-febis-ink/35">
                  {new Date(c.createdAt).toLocaleString("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SeedHomepageButton() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    setStatus("");
    setError("");
    try {
      const res = await fetch("/api/admin/seed-homepage", { method: "POST" });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Échec");
      setStatus("Contenu d’accueil initialisé en base.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-panel admin-panel-premium flex h-full flex-col justify-between gap-5 p-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
          Maintenance
        </p>
        <p className="mt-2 font-display text-lg font-bold text-febis-ink">
          Initialiser le contenu
        </p>
        <p className="mt-1 text-sm leading-relaxed text-febis-ink/55">
          Insère les valeurs par défaut (hero, blog, témoignages, travaux…)
          uniquement si elles sont absentes.
        </p>
        {(status || error) && (
          <p
            className={
              error
                ? "mt-3 text-sm font-semibold text-febis-red"
                : "mt-3 text-sm font-semibold text-emerald-700"
            }
          >
            {error || status}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="cta-premium w-full justify-center disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Initialisation…" : "Seed contenu accueil"}
      </button>
    </div>
  );
}

export function AdminModulesGrid() {
  const groups = ADMIN_NAV_GROUPS.filter((g) => g.id !== "overview");

  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const modules = ADMIN_NAV.filter((item) => item.group === group.id);
        if (modules.length === 0) return null;
        return (
          <section key={group.id}>
            <div className="mb-3 flex items-center gap-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-febis-ink/40">
                {group.label}
              </h3>
              <span className="h-px flex-1 bg-gradient-to-r from-febis-ink/12 to-transparent" />
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
          </section>
        );
      })}
    </div>
  );
}

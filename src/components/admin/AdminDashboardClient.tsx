"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ADMIN_NAV,
  ADMIN_NAV_GROUPS,
  type AdminNavGroup,
} from "@/lib/homepage-content";

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
    <div className="admin-panel flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center">
      <div>
        <p className="font-display text-lg font-bold text-febis-ink">
          Initialiser le contenu
        </p>
        <p className="mt-1 max-w-xl text-sm text-febis-ink/55">
          Insère les valeurs par défaut (hero, blog, témoignages, travaux…)
          uniquement si elles sont absentes.
        </p>
        {(status || error) && (
          <p
            className={
              error
                ? "mt-2 text-sm font-semibold text-febis-red"
                : "mt-2 text-sm font-semibold text-emerald-700"
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
        className="cta-premium shrink-0 disabled:opacity-60"
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
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-febis-ink/40">
              {group.label}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {modules.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="admin-panel group flex gap-3 p-4 transition hover:border-febis-red/25 hover:shadow-[0_16px_40px_rgba(160,16,24,0.08)]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-febis-red/8 text-xs font-extrabold text-febis-red transition group-hover:bg-febis-red group-hover:text-white">
                    {item.mark}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-display text-lg font-bold text-febis-ink">
                        {item.label}
                      </span>
                      <span className="text-febis-ink/30 transition group-hover:text-febis-red">
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

export type DashboardStat = {
  label: string;
  value: number;
  href: string;
  hint: string;
  group: AdminNavGroup;
};

export function AdminStatsGrid({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => (
        <Link
          key={stat.label}
          href={stat.href}
          className="admin-panel group p-5 transition hover:border-febis-red/25"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-febis-ink/55">{stat.label}</p>
            <span className="text-xs font-bold text-febis-ink/25 transition group-hover:text-febis-red">
              Ouvrir →
            </span>
          </div>
          <p className="mt-2 font-display text-3xl font-extrabold tracking-tight text-febis-red">
            {stat.value}
          </p>
          <p className="mt-1 text-xs text-febis-ink/45">{stat.hint}</p>
        </Link>
      ))}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { ADMIN_NAV } from "@/lib/homepage-content";

export function SeedHomepageButton() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/admin/seed-homepage", { method: "POST" });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Échec");
      setStatus("Contenu d’accueil initialisé en base.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-febis-ink/8 bg-white/70 p-5">
      <p className="font-semibold text-febis-ink">Initialiser le contenu</p>
      <p className="mt-1 text-sm text-febis-ink/60">
        Insère les valeurs par défaut (hero, blog, témoignages, travaux…) si
        absentes.
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="cta-premium mt-4 disabled:opacity-60"
      >
        {loading ? "Initialisation…" : "Seed contenu accueil"}
      </button>
      {status && (
        <p className="mt-3 text-sm font-semibold text-febis-ink/70">{status}</p>
      )}
    </div>
  );
}

export function AdminModulesGrid() {
  const modules = ADMIN_NAV.filter((item) => item.href !== "/admin/dashboard");
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-2xl border border-febis-ink/8 bg-white/70 p-5 transition-colors hover:border-febis-red/30"
        >
          <p className="font-display text-lg font-bold text-febis-ink">
            {item.label}
          </p>
          <p className="mt-1 text-sm text-febis-ink/55">{item.description}</p>
        </Link>
      ))}
    </div>
  );
}

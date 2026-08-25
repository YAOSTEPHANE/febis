"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export function SeedHomepagePanel() {
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
    <div className="admin-panel admin-panel-premium p-5">
      <h2 className="font-display text-lg font-bold text-febis-ink">
        Initialisation
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-febis-ink/55">
        Injecte les valeurs par défaut (hero, blog, témoignages, travaux…) si
        elles sont absentes en base.
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
  );
}

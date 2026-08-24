"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import { formatXof } from "@/lib/crm-shared";

type Metrics = {
  ca: number;
  caLabel: string;
  occupancyRate: number;
  occupancyLabel: string;
  stockRate: number;
  stockLabel: string;
  lowStockCount: number;
  projectsOpen: number;
  projectsLabel: string;
  unpaid: number;
  unpaidCount: number;
  caByActivity: Array<{ activity: string; label: string; amount: number }>;
  generatedAt: string;
};

export function DirectionAdminClient() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/direction");
      const json = (await res.json()) as { metrics?: Metrics; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setMetrics(json.metrics ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 60000);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <>
      <AdminPageHeader
        title="Pilotage Direction"
        description="Tableau de bord temps réel : CA, occupation, stocks, projets ouverts et impayés."
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-4 py-3 text-sm font-semibold text-febis-red">
          {error}
        </p>
      ) : null}

      <p className="mb-4 text-xs text-febis-ink/45">
        Mis à jour :{" "}
        {metrics?.generatedAt
          ? new Date(metrics.generatedAt).toLocaleString("fr-FR")
          : "—"}{" "}
        · rafraîchissement auto 60 s
      </p>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Chiffre d’affaires", metrics?.caLabel ?? formatXof(0)],
          ["Occupation résidences", metrics?.occupancyLabel ?? "0 %"],
          ["Disponibilité stock", metrics?.stockLabel ?? "100 %"],
          ["Projets ouverts", metrics?.projectsLabel ?? "0"],
        ].map(([label, value]) => (
          <div key={label} className="admin-panel admin-panel-premium p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-febis-gold-deep">
              {label}
            </p>
            <p className="mt-2 font-display text-2xl font-extrabold text-febis-ink">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-panel overflow-hidden">
          <div className="border-b border-febis-ink/8 px-5 py-3 text-sm font-semibold">
            CA par activité
          </div>
          <div className="divide-y divide-febis-ink/8">
            {(metrics?.caByActivity ?? []).map((row) => (
              <div
                key={row.activity}
                className="flex justify-between px-5 py-3 text-sm"
              >
                <span className="font-semibold">{row.label}</span>
                <span className="font-bold text-febis-red">
                  {formatXof(row.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel admin-panel-premium space-y-4 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
            Alertes
          </p>
          <div className="flex justify-between text-sm">
            <span>Impayés</span>
            <strong className="text-febis-red">
              {formatXof(metrics?.unpaid ?? 0)} ({metrics?.unpaidCount ?? 0})
            </strong>
          </div>
          <div className="flex justify-between text-sm">
            <span>Articles stock bas</span>
            <strong>{metrics?.lowStockCount ?? 0}</strong>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="cta-premium w-full justify-center"
          >
            Actualiser maintenant
          </button>
        </div>
      </div>
    </>
  );
}

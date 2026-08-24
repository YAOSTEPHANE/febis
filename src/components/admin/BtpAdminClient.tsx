"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState, useTransition } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import {
  BTP_STEPS,
  btpStepLabel,
  formatXof,
  type SerializedBtpProject,
} from "@/lib/btp-shared";
import { cn } from "@/lib/cn";

type Stats = {
  total: number;
  cancelled: number;
  pipeline: number;
  delivered: number;
  pipelineValue: number;
  deliveredValue: number;
};

export function BtpAdminClient() {
  const [projects, setProjects] = useState<SerializedBtpProject[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [q, setQ] = useState("");
  const [step, setStep] = useState("all");
  const [showCancelled, setShowCancelled] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (step !== "all") params.set("step", step);
      if (showCancelled) params.set("cancelled", "1");

      const [listRes, statsRes] = await Promise.all([
        fetch(`/api/admin/btp?${params}`),
        fetch("/api/admin/btp?tab=stats"),
      ]);
      const listJson = (await listRes.json()) as {
        projects?: SerializedBtpProject[];
        error?: string;
      };
      const statsJson = (await statsRes.json()) as {
        stats?: Stats;
        error?: string;
      };
      if (!listRes.ok) throw new Error(listJson.error ?? "Erreur");
      if (!statsRes.ok) throw new Error(statsJson.error ?? "Erreur");
      setProjects(listJson.projects ?? []);
      setStats(statsJson.stats ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }, [q, step, showCancelled]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        void load();
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [load]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/admin/btp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.get("title"),
          clientName: data.get("clientName"),
          clientEmail: data.get("clientEmail"),
          clientPhone: data.get("clientPhone"),
          clientCompany: data.get("clientCompany"),
          location: data.get("location"),
          quoteAmount: data.get("quoteAmount"),
          step: data.get("step") || "prospect",
          description: data.get("description"),
          startDate: data.get("startDate"),
          expectedEndDate: data.get("expectedEndDate"),
        }),
      });
      const json = (await res.json()) as {
        project?: SerializedBtpProject;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Création impossible");
      event.currentTarget.reset();
      await load();
      if (json.project?.id) {
        window.location.href = `/admin/dashboard/btp/${json.project.id}`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="BTP — Chantiers"
        description="CDC §4.3 : prospect → devis → contrat → chantier → avancement → livraison."
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-4 py-3 text-sm font-semibold text-febis-red">
          {error}
        </p>
      ) : null}

      {stats ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Pipeline", String(stats.pipeline)],
            ["Livrés", String(stats.delivered)],
            ["Valeur pipeline", formatXof(stats.pipelineValue)],
            ["CA livré", formatXof(stats.deliveredValue)],
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
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-4">
          <div className="admin-panel admin-panel-premium p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
              Filtres
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Réf, client, chantier…"
                className="field-premium sm:col-span-2"
              />
              <select
                value={step}
                onChange={(e) => setStep(e.target.value)}
                className="field-premium"
              >
                <option value="all">Toutes les étapes</option>
                {BTP_STEPS.map((s) => (
                  <option key={s} value={s}>
                    {btpStepLabel(s)}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={showCancelled}
                  onChange={(e) => setShowCancelled(e.target.checked)}
                />
                Inclure annulés
              </label>
            </div>
            <p className="mt-2 text-xs text-febis-ink/45">
              {pending ? "Actualisation…" : `${projects.length} projet(s)`}
            </p>
          </div>

          <div className="admin-panel overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-febis-mist/80 text-xs uppercase tracking-wider text-febis-ink/55">
                <tr>
                  <th className="px-4 py-3">Projet</th>
                  <th className="px-4 py-3">Étape</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-febis-ink/8">
                {projects.map((p) => (
                  <tr
                    key={p.id}
                    className={cn(p.cancelled && "opacity-50")}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-febis-ink">{p.title}</p>
                      <p className="text-xs text-febis-ink/45">
                        {p.reference} · {p.clientName} · {p.location}
                      </p>
                      <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-febis-ink/10">
                        <div
                          className="h-full rounded-full bg-febis-gold-deep"
                          style={{ width: `${p.progressPercent}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-febis-mist px-2.5 py-1 text-xs font-bold">
                        {btpStepLabel(p.step)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-febis-red">
                      {formatXof(p.contractAmount || p.quoteAmount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/dashboard/btp/${p.id}`}
                        className="text-sm font-bold text-febis-gold-deep hover:underline"
                      >
                        Ouvrir →
                      </Link>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-febis-ink/45"
                    >
                      Aucun projet BTP — créez une opportunité à droite.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <form
          onSubmit={onCreate}
          className="admin-panel admin-panel-premium h-fit space-y-3 p-5"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
            Nouvelle opportunité
          </p>
          <input
            name="title"
            required
            placeholder="Titre du chantier *"
            className="field-premium"
          />
          <input
            name="clientName"
            required
            placeholder="Client *"
            className="field-premium"
          />
          <input
            name="clientCompany"
            placeholder="Société"
            className="field-premium"
          />
          <input
            name="clientEmail"
            type="email"
            placeholder="Email"
            className="field-premium"
          />
          <input
            name="clientPhone"
            placeholder="Téléphone"
            className="field-premium"
          />
          <input
            name="location"
            required
            placeholder="Localisation *"
            className="field-premium"
          />
          <input
            name="quoteAmount"
            type="number"
            min={0}
            step={1000}
            placeholder="Montant devis (XOF)"
            className="field-premium"
          />
          <select name="step" defaultValue="prospect" className="field-premium">
            {BTP_STEPS.map((s) => (
              <option key={s} value={s}>
                {btpStepLabel(s)}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              name="startDate"
              type="date"
              className="field-premium"
              title="Début prévu"
            />
            <input
              name="expectedEndDate"
              type="date"
              className="field-premium"
              title="Fin prévue"
            />
          </div>
          <textarea
            name="description"
            rows={3}
            placeholder="Description"
            className="field-premium"
          />
          <button
            type="submit"
            disabled={creating}
            className="cta-premium w-full disabled:opacity-60"
          >
            {creating ? "Création…" : "Créer le projet"}
          </button>
          <Link
            href="/admin/dashboard/travaux"
            className="block text-center text-xs font-semibold text-febis-ink/50 hover:text-febis-gold-deep"
          >
            Portfolio vitrine (Travaux) →
          </Link>
        </form>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState, useTransition } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import { AdminFormOverlay } from "@/components/admin/AdminFormOverlay";
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

type FormState = {
  title: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany: string;
  location: string;
  quoteAmount: string;
  step: string;
  description: string;
  startDate: string;
  expectedEndDate: string;
};

const emptyForm = (): FormState => ({
  title: "",
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  clientCompany: "",
  location: "",
  quoteAmount: "",
  step: "prospect",
  description: "",
  startDate: "",
  expectedEndDate: "",
});

function projectToForm(p: SerializedBtpProject): FormState {
  return {
    title: p.title,
    clientName: p.clientName,
    clientEmail: p.clientEmail ?? "",
    clientPhone: p.clientPhone ?? "",
    clientCompany: p.clientCompany ?? "",
    location: p.location,
    quoteAmount: String(p.quoteAmount || ""),
    step: p.step,
    description: p.description ?? "",
    startDate: p.startDate?.slice(0, 10) ?? "",
    expectedEndDate: p.expectedEndDate?.slice(0, 10) ?? "",
  };
}

export function BtpAdminClient() {
  const [projects, setProjects] = useState<SerializedBtpProject[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [q, setQ] = useState("");
  const [step, setStep] = useState("all");
  const [showCancelled, setShowCancelled] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
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

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    setFormOpen(true);
  }

  function openEdit(p: SerializedBtpProject) {
    setEditingId(p.id);
    setForm(projectToForm(p));
    setError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      title: form.title,
      clientName: form.clientName,
      clientEmail: form.clientEmail,
      clientPhone: form.clientPhone,
      clientCompany: form.clientCompany,
      location: form.location,
      quoteAmount: form.quoteAmount,
      step: form.step,
      description: form.description,
      startDate: form.startDate || undefined,
      expectedEndDate: form.expectedEndDate || undefined,
    };
    try {
      const res = await fetch(
        editingId ? `/api/admin/btp/${editingId}` : "/api/admin/btp",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = (await res.json()) as {
        project?: SerializedBtpProject;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Enregistrement impossible");
      closeForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function onCancelProject(p: SerializedBtpProject) {
    if (
      !window.confirm(
        `Annuler le projet « ${p.title} » ? Il restera visible si vous incluez les annulés.`,
      )
    ) {
      return;
    }
    setError("");
    try {
      const res = await fetch(`/api/admin/btp/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelled: true }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Annulation impossible");
      closeForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  const editing = editingId
    ? projects.find((p) => p.id === editingId)
    : null;

  return (
    <>
      <AdminPageHeader
        title="BTP — Chantiers"
        description="CDC §4.3 : prospect → devis → contrat → chantier → avancement → livraison."
        actions={
          <button type="button" onClick={openCreate} className="cta-premium">
            + Nouveau chantier
          </button>
        }
      />

      {error && !formOpen ? (
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

      <div className="admin-panel admin-panel-premium mb-4 p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
          Filtres
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-febis-ink/8">
            {projects.map((p) => (
              <tr key={p.id} className={cn(p.cancelled && "opacity-50")}>
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
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="rounded-full border border-febis-ink/15 px-3 py-1.5 text-xs font-bold"
                    >
                      Modifier
                    </button>
                    <Link
                      href={`/admin/dashboard/btp/${p.id}`}
                      className="rounded-full border border-febis-gold-deep/30 px-3 py-1.5 text-xs font-bold text-febis-gold-deep"
                    >
                      Pipeline
                    </Link>
                    {!p.cancelled ? (
                      <button
                        type="button"
                        onClick={() => void onCancelProject(p)}
                        className="rounded-full border border-febis-red/25 px-3 py-1.5 text-xs font-bold text-febis-red"
                      >
                        Annuler
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {projects.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-febis-ink/45"
                >
                  Aucun projet BTP —{" "}
                  <button
                    type="button"
                    onClick={openCreate}
                    className="font-bold text-febis-gold-deep underline"
                  >
                    créer une opportunité
                  </button>
                  .
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-center text-xs text-febis-ink/45">
        <Link
          href="/admin/dashboard/travaux"
          className="font-semibold hover:text-febis-gold-deep"
        >
          Portfolio vitrine (Travaux) →
        </Link>
      </p>

      <AdminFormOverlay
        open={formOpen}
        title={editingId ? "Modifier le chantier" : "Nouveau chantier"}
        subtitle={
          editing
            ? `${editing.reference} · ${editing.clientName}`
            : "Fiche opportunité / chantier"
        }
        onClose={closeForm}
        footer={
          <>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-full border border-febis-ink/15 px-4 py-2.5 text-sm font-bold"
            >
              Fermer
            </button>
            {editing && !editing.cancelled ? (
              <button
                type="button"
                onClick={() => void onCancelProject(editing)}
                className="rounded-full border border-febis-red/25 px-4 py-2.5 text-sm font-bold text-febis-red"
              >
                Annuler le projet
              </button>
            ) : null}
            {editingId ? (
              <Link
                href={`/admin/dashboard/btp/${editingId}`}
                className="rounded-full border border-febis-gold-deep/30 px-4 py-2.5 text-sm font-bold text-febis-gold-deep"
              >
                Ouvrir le pipeline
              </Link>
            ) : null}
            <button
              type="submit"
              form="btp-form"
              disabled={saving}
              className="cta-premium ml-auto disabled:opacity-60"
            >
              {saving
                ? "Enregistrement…"
                : editingId
                  ? "Enregistrer"
                  : "Créer le projet"}
            </button>
          </>
        }
      >
        {error && formOpen ? (
          <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-3 py-2 text-sm font-semibold text-febis-red">
            {error}
          </p>
        ) : null}
        <form id="btp-form" onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <input
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Titre du chantier *"
            className="field-premium sm:col-span-2"
          />
          <input
            required
            value={form.clientName}
            onChange={(e) =>
              setForm((f) => ({ ...f, clientName: e.target.value }))
            }
            placeholder="Client *"
            className="field-premium"
          />
          <input
            value={form.clientCompany}
            onChange={(e) =>
              setForm((f) => ({ ...f, clientCompany: e.target.value }))
            }
            placeholder="Société"
            className="field-premium"
          />
          <input
            type="email"
            value={form.clientEmail}
            onChange={(e) =>
              setForm((f) => ({ ...f, clientEmail: e.target.value }))
            }
            placeholder="Email"
            className="field-premium"
          />
          <input
            value={form.clientPhone}
            onChange={(e) =>
              setForm((f) => ({ ...f, clientPhone: e.target.value }))
            }
            placeholder="Téléphone"
            className="field-premium"
          />
          <input
            required
            value={form.location}
            onChange={(e) =>
              setForm((f) => ({ ...f, location: e.target.value }))
            }
            placeholder="Localisation *"
            className="field-premium sm:col-span-2"
          />
          <input
            type="number"
            min={0}
            step={1000}
            value={form.quoteAmount}
            onChange={(e) =>
              setForm((f) => ({ ...f, quoteAmount: e.target.value }))
            }
            placeholder="Montant devis (XOF)"
            className="field-premium"
          />
          <select
            value={form.step}
            onChange={(e) => setForm((f) => ({ ...f, step: e.target.value }))}
            className="field-premium"
          >
            {BTP_STEPS.map((s) => (
              <option key={s} value={s}>
                {btpStepLabel(s)}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) =>
              setForm((f) => ({ ...f, startDate: e.target.value }))
            }
            className="field-premium"
            title="Début prévu"
          />
          <input
            type="date"
            value={form.expectedEndDate}
            onChange={(e) =>
              setForm((f) => ({ ...f, expectedEndDate: e.target.value }))
            }
            className="field-premium"
            title="Fin prévue"
          />
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Description"
            className="field-premium sm:col-span-2"
          />
        </form>
      </AdminFormOverlay>
    </>
  );
}

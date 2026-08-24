"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminPageHeader, AdminSaveButton } from "@/components/admin/AdminForms";
import {
  BTP_STEPS,
  btpStepIndex,
  btpStepLabel,
  formatXof,
  type SerializedBtpProject,
} from "@/lib/btp-shared";
import { cn } from "@/lib/cn";

export function BtpDetailClient() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<SerializedBtpProject | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/btp/${params.id}`);
      const json = (await res.json()) as {
        project?: SerializedBtpProject;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Introuvable");
      setProject(json.project ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/btp/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        project?: SerializedBtpProject;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      setProject(json.project ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await patch({
      title: data.get("title"),
      clientName: data.get("clientName"),
      clientEmail: data.get("clientEmail"),
      clientPhone: data.get("clientPhone"),
      clientCompany: data.get("clientCompany"),
      location: data.get("location"),
      description: data.get("description"),
      quoteAmount: Number(data.get("quoteAmount") || 0),
      contractAmount: Number(data.get("contractAmount") || 0),
      progressPercent: Number(data.get("progressPercent") || 0),
      startDate: data.get("startDate"),
      expectedEndDate: data.get("expectedEndDate"),
      deliveredAt: data.get("deliveredAt") || null,
      notes: data.get("notes"),
    });
  }

  if (loading) {
    return <p className="text-sm text-febis-ink/50">Chargement…</p>;
  }

  if (!project) {
    return (
      <>
        <AdminPageHeader title="Projet BTP" description="Introuvable." />
        {error ? (
          <p className="text-sm font-semibold text-febis-red">{error}</p>
        ) : null}
        <Link href="/admin/dashboard/btp" className="cta-premium mt-4 inline-flex">
          ← Retour
        </Link>
      </>
    );
  }

  const currentIdx = btpStepIndex(project.step);

  return (
    <>
      <AdminPageHeader
        title={project.title}
        description={`${project.reference} · ${project.clientName} · ${project.location}`}
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <Link href="/admin/dashboard/btp" className="rounded-full border border-febis-ink/15 px-4 py-2 text-sm font-bold">
          ← Liste BTP
        </Link>
        {project.crmClientId ? (
          <Link
            href={`/admin/dashboard/crm/${project.crmClientId}`}
            className="rounded-full border border-febis-ink/15 px-4 py-2 text-sm font-bold"
          >
            Fiche CRM →
          </Link>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-4 py-3 text-sm font-semibold text-febis-red">
          {error}
        </p>
      ) : null}

      {project.cancelled ? (
        <p className="mb-4 rounded-xl border border-febis-orange/30 bg-febis-orange/10 px-4 py-3 text-sm font-semibold">
          Projet annulé
        </p>
      ) : null}

      <div className="mb-6 admin-panel admin-panel-premium p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
          Pipeline
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {BTP_STEPS.map((s, idx) => (
            <button
              key={s}
              type="button"
              disabled={saving || project.cancelled}
              onClick={() => void patch({ step: s })}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-bold transition",
                idx <= currentIdx
                  ? "bg-febis-gold-deep text-white"
                  : "bg-febis-mist text-febis-ink/55",
                s === project.step && "ring-2 ring-febis-ink/20",
              )}
            >
              {btpStepLabel(s)}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs font-semibold text-febis-ink/55">
            <span>Avancement</span>
            <span>{project.progressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-febis-ink/10">
            <div
              className="h-full rounded-full bg-febis-gold-deep transition-all"
              style={{ width: `${project.progressPercent}%` }}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {!project.cancelled && project.step !== "contrat" && project.step !== "livraison" ? (
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void patch({
                  action: "convert_contract",
                  contractAmount: project.quoteAmount,
                })
              }
              className="cta-premium text-sm disabled:opacity-60"
            >
              Devis → Contrat
            </button>
          ) : null}
          {!project.cancelled ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => void patch({ cancelled: true })}
              className="rounded-full border border-febis-red/30 px-4 py-2 text-sm font-bold text-febis-red disabled:opacity-60"
            >
              Annuler le projet
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => void patch({ cancelled: false })}
              className="rounded-full border border-febis-ink/15 px-4 py-2 text-sm font-bold disabled:opacity-60"
            >
              Réactiver
            </button>
          )}
        </div>
      </div>

      <form onSubmit={onSave} className="admin-panel admin-panel-premium grid gap-4 p-5 md:grid-cols-2">
        <label className="block text-sm font-semibold md:col-span-2">
          Titre
          <input
            name="title"
            defaultValue={project.title}
            required
            className="field-premium mt-1"
          />
        </label>
        <label className="block text-sm font-semibold">
          Client
          <input
            name="clientName"
            defaultValue={project.clientName}
            required
            className="field-premium mt-1"
          />
        </label>
        <label className="block text-sm font-semibold">
          Société
          <input
            name="clientCompany"
            defaultValue={project.clientCompany}
            className="field-premium mt-1"
          />
        </label>
        <label className="block text-sm font-semibold">
          Email
          <input
            name="clientEmail"
            type="email"
            defaultValue={project.clientEmail}
            className="field-premium mt-1"
          />
        </label>
        <label className="block text-sm font-semibold">
          Téléphone
          <input
            name="clientPhone"
            defaultValue={project.clientPhone}
            className="field-premium mt-1"
          />
        </label>
        <label className="block text-sm font-semibold md:col-span-2">
          Localisation
          <input
            name="location"
            defaultValue={project.location}
            required
            className="field-premium mt-1"
          />
        </label>
        <label className="block text-sm font-semibold">
          Montant devis (XOF)
          <input
            name="quoteAmount"
            type="number"
            min={0}
            defaultValue={project.quoteAmount}
            className="field-premium mt-1"
          />
        </label>
        <label className="block text-sm font-semibold">
          Montant contrat (XOF)
          <input
            name="contractAmount"
            type="number"
            min={0}
            defaultValue={project.contractAmount}
            className="field-premium mt-1"
          />
        </label>
        <label className="block text-sm font-semibold">
          Progression (%)
          <input
            name="progressPercent"
            type="number"
            min={0}
            max={100}
            defaultValue={project.progressPercent}
            className="field-premium mt-1"
          />
        </label>
        <label className="block text-sm font-semibold">
          Livré le
          <input
            name="deliveredAt"
            type="date"
            defaultValue={project.deliveredAt ?? ""}
            className="field-premium mt-1"
          />
        </label>
        <label className="block text-sm font-semibold">
          Début prévu
          <input
            name="startDate"
            type="date"
            defaultValue={project.startDate}
            className="field-premium mt-1"
          />
        </label>
        <label className="block text-sm font-semibold">
          Fin prévue
          <input
            name="expectedEndDate"
            type="date"
            defaultValue={project.expectedEndDate}
            className="field-premium mt-1"
          />
        </label>
        <label className="block text-sm font-semibold md:col-span-2">
          Description
          <textarea
            name="description"
            rows={3}
            defaultValue={project.description}
            className="field-premium mt-1"
          />
        </label>
        <label className="block text-sm font-semibold md:col-span-2">
          Notes internes
          <textarea
            name="notes"
            rows={3}
            defaultValue={project.notes}
            className="field-premium mt-1"
          />
        </label>
        <div className="md:col-span-2 flex flex-wrap items-center gap-4">
          <AdminSaveButton saving={saving} />
          <p className="text-xs text-febis-ink/45">
            Devis {formatXof(project.quoteAmount)}
            {project.contractAmount
              ? ` · Contrat ${formatXof(project.contractAmount)}`
              : ""}
          </p>
        </div>
      </form>
    </>
  );
}

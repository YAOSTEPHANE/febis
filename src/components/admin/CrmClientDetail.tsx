"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AdminPageHeader, AdminSaveButton } from "@/components/admin/AdminForms";
import type {
  SerializedClient,
  SerializedInteraction,
  SerializedInvoice,
  SerializedProject,
} from "@/lib/crm-shared";
import {
  activityLabel,
  clientStatusLabel,
  formatXof,
  interactionTypeLabel,
  invoiceStatusLabel,
  projectStatusLabel,
} from "@/lib/crm-shared";
import { ACTIVITIES, CLIENT_STATUSES } from "@/lib/types";
import { cn } from "@/lib/cn";

type DetailPayload = {
  client: SerializedClient;
  interactions: SerializedInteraction[];
  invoices: SerializedInvoice[];
  projects: SerializedProject[];
};

const INTERACTION_TYPES = ["note", "appel", "email"] as const;

export function CrmClientDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [interactionType, setInteractionType] = useState<string>("note");
  const [message, setMessage] = useState("");
  const [filterActivity, setFilterActivity] = useState("all");
  const [filterType, setFilterType] = useState("all");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/crm/${id}`);
      const json = (await res.json()) as DetailPayload & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Introuvable");
      setDetail(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const filteredInteractions = useMemo(() => {
    if (!detail) return [];
    return detail.interactions.filter((ix) => {
      if (filterActivity !== "all" && ix.activity !== filterActivity) return false;
      if (filterType !== "all" && ix.type !== filterType) return false;
      return true;
    });
  }, [detail, filterActivity, filterType]);

  async function onSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    setSaving(true);
    setMessage("");
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const res = await fetch(`/api/admin/crm/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          company: data.get("company"),
          notes: data.get("notes"),
          status: data.get("status"),
          tags: data.get("tags"),
          note: note.trim() || undefined,
          interactionType,
          interactionTitle:
            interactionType === "appel"
              ? "Appel"
              : interactionType === "email"
                ? "Email"
                : "Note interne",
        }),
      });
      const json = (await res.json()) as DetailPayload & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      setDetail(json);
      setNote("");
      setMessage("Fiche mise à jour.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-febis-ink/55">Chargement de la fiche…</p>;
  }

  if (!detail) {
    return (
      <div>
        <p className="text-sm font-semibold text-febis-red">
          {error || "Client introuvable"}
        </p>
        <Link
          href="/admin/dashboard/crm"
          className="mt-4 inline-block text-sm font-bold text-febis-red"
        >
          ← Retour CRM
        </Link>
      </div>
    );
  }

  const { client, invoices, projects } = detail;

  return (
    <>
      <AdminPageHeader
        title={client.name}
        description="Historique complet, factures et projets associés automatiquement."
        actions={
          <Link
            href="/admin/dashboard/crm"
            className="inline-flex rounded-xl border border-febis-ink/12 bg-white/80 px-4 py-2 text-sm font-semibold text-febis-ink"
          >
            ← CRM
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {client.modules.map((m) => (
          <span
            key={m}
            className="rounded-md bg-febis-red/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-febis-red"
          >
            {activityLabel(m)}
          </span>
        ))}
        <span className="rounded-md bg-febis-mist px-2.5 py-1 text-[11px] font-bold text-febis-ink/60">
          {clientStatusLabel(client.status)}
        </span>
        {client.tags.map((t) => (
          <span
            key={t}
            className="rounded-md bg-febis-gold-deep/10 px-2.5 py-1 text-[11px] font-bold text-febis-gold-deep"
          >
            {t}
          </span>
        ))}
      </div>

      {(error || message) && (
        <p
          className={cn(
            "mb-4 rounded-xl px-3 py-2 text-sm font-semibold",
            error
              ? "border border-febis-red/20 bg-febis-red/8 text-febis-red"
              : "border border-emerald-600/20 bg-emerald-50 text-emerald-800",
          )}
        >
          {error || message}
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
        <form
          onSubmit={onSaveProfile}
          className="admin-panel admin-panel-premium space-y-3 p-5"
        >
          <p className="font-display text-lg font-bold text-febis-ink">Profil</p>
          <label className="block text-sm font-semibold text-febis-ink/80">
            Nom
            <input
              name="name"
              required
              className="field-premium mt-2"
              defaultValue={client.name}
            />
          </label>
          <label className="block text-sm font-semibold text-febis-ink/80">
            Email
            <input
              name="email"
              type="email"
              className="field-premium mt-2"
              defaultValue={client.email}
            />
          </label>
          <label className="block text-sm font-semibold text-febis-ink/80">
            Téléphone
            <input
              name="phone"
              className="field-premium mt-2"
              defaultValue={client.phone}
            />
          </label>
          <label className="block text-sm font-semibold text-febis-ink/80">
            Société
            <input
              name="company"
              className="field-premium mt-2"
              defaultValue={client.company}
            />
          </label>
          <label className="block text-sm font-semibold text-febis-ink/80">
            Tags (virgules)
            <input
              name="tags"
              className="field-premium mt-2"
              defaultValue={client.tags.join(", ")}
              placeholder="vip, abidjan…"
            />
          </label>
          <label className="block text-sm font-semibold text-febis-ink/80">
            Statut
            <select
              name="status"
              className="field-premium mt-2"
              defaultValue={client.status}
            >
              {CLIENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {clientStatusLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-febis-ink/80">
            Notes
            <textarea
              name="notes"
              className="field-premium mt-2 min-h-24"
              defaultValue={client.notes}
            />
          </label>

          <div className="rounded-xl border border-febis-ink/8 bg-febis-mist/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-febis-gold-deep">
              Nouvelle interaction
            </p>
            <select
              className="field-premium mt-2"
              value={interactionType}
              onChange={(e) => setInteractionType(e.target.value)}
            >
              {INTERACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {interactionTypeLabel(t)}
                </option>
              ))}
            </select>
            <textarea
              className="field-premium mt-2 min-h-20"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Compte-rendu d’appel, relance email…"
            />
          </div>

          <AdminSaveButton saving={saving} label="Enregistrer la fiche" />
        </form>

        <div className="space-y-5">
          <section className="admin-panel admin-panel-premium p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <p className="font-display text-lg font-bold text-febis-ink">
                Historique ({filteredInteractions.length}/
                {detail.interactions.length})
              </p>
              <div className="flex flex-wrap gap-2">
                <select
                  className="field-premium py-1.5 text-xs"
                  value={filterActivity}
                  onChange={(e) => setFilterActivity(e.target.value)}
                >
                  <option value="all">Tous modules</option>
                  <option value="general">Général</option>
                  {ACTIVITIES.map((a) => (
                    <option key={a} value={a}>
                      {activityLabel(a)}
                    </option>
                  ))}
                </select>
                <select
                  className="field-premium py-1.5 text-xs"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">Tous types</option>
                  {[
                    "contact_form",
                    "reservation_demande",
                    "event_quote",
                    "shop_order",
                    "projet",
                    "facture",
                    "note",
                    "appel",
                    "email",
                  ].map((t) => (
                    <option key={t} value={t}>
                      {interactionTypeLabel(t)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <ul className="mt-4 max-h-[420px] space-y-2 overflow-y-auto">
              {filteredInteractions.length === 0 ? (
                <li className="text-sm text-febis-ink/50">Aucune interaction.</li>
              ) : (
                filteredInteractions.map((ix) => (
                  <li
                    key={ix.id}
                    className="rounded-xl border border-febis-ink/6 bg-white/70 px-3.5 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-febis-red">
                        {interactionTypeLabel(ix.type)} ·{" "}
                        {activityLabel(ix.activity)}
                      </span>
                      <span className="text-[11px] text-febis-ink/40">
                        {new Date(ix.at).toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-febis-ink">
                      {ix.title || activityLabel(ix.activity)}
                    </p>
                    <p className="mt-0.5 text-sm text-febis-ink/60">{ix.message}</p>
                    {ix.href ? (
                      <Link
                        href={ix.href}
                        className="mt-1 inline-block text-xs font-bold text-febis-gold-deep hover:underline"
                      >
                        Ouvrir la source →
                      </Link>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="admin-panel p-5">
            <p className="font-display text-lg font-bold text-febis-ink">
              Projets liés ({projects.length})
            </p>
            <ul className="mt-3 space-y-2">
              {projects.length === 0 ? (
                <li className="text-sm text-febis-ink/50">
                  Aucun projet — créés auto depuis réservations, devis, BTP,
                  commandes.
                </li>
              ) : (
                projects.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-start justify-between gap-3 rounded-xl bg-febis-smoke/70 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-febis-ink">
                        {p.title}
                      </p>
                      <p className="text-xs text-febis-ink/45">
                        {activityLabel(p.activity)} · {projectStatusLabel(p.status)}
                      </p>
                      {p.href ? (
                        <Link
                          href={p.href}
                          className="text-xs font-bold text-febis-gold-deep hover:underline"
                        >
                          Voir →
                        </Link>
                      ) : null}
                    </div>
                    <p className="text-sm font-bold text-febis-red">
                      {p.amount != null ? formatXof(p.amount) : "—"}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="admin-panel p-5">
            <p className="font-display text-lg font-bold text-febis-ink">
              Factures liées ({invoices.length})
            </p>
            <ul className="mt-3 space-y-2">
              {invoices.length === 0 ? (
                <li className="text-sm text-febis-ink/50">
                  Aucune facture liée pour ce client.
                </li>
              ) : (
                invoices.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-start justify-between gap-3 rounded-xl bg-febis-smoke/70 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-febis-ink">
                        {inv.number}
                      </p>
                      <p className="text-xs text-febis-ink/45">
                        {inv.title} · {invoiceStatusLabel(inv.status)} ·{" "}
                        {activityLabel(inv.activity)}
                      </p>
                      {inv.href ? (
                        <Link
                          href={inv.href}
                          className="text-xs font-bold text-febis-gold-deep hover:underline"
                        >
                          Source →
                        </Link>
                      ) : null}
                    </div>
                    <p className="text-sm font-bold text-febis-red">
                      {formatXof(inv.amount)}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

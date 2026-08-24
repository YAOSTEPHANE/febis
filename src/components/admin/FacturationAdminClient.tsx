"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import {
  BILLING_DOC_TYPES,
  activityLabel,
  billingTypeLabel,
  formatXof,
  type SerializedBillingDoc,
} from "@/lib/facturation-shared";
import type { BillingDocType } from "@/lib/types";
import { ACTIVITIES } from "@/lib/types";

type Sources = {
  quotes: Array<{ id: string; label: string }>;
  invoices: Array<{ id: string; label: string }>;
  reservations: Array<{ id: string; label: string }>;
  orders: Array<{ id: string; label: string }>;
  btp: Array<{ id: string; label: string }>;
};

const CONVERT_TARGETS: BillingDocType[] = [
  "devis",
  "facture",
  "contrat",
  "recu",
];

function openPdf(id: string) {
  window.open(`/api/admin/facturation/${id}/pdf`, "_blank", "noopener,noreferrer");
}

export function FacturationAdminClient() {
  const [documents, setDocuments] = useState<SerializedBillingDoc[]>([]);
  const [sources, setSources] = useState<Sources | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [lines, setLines] = useState([
    { label: "", quantity: "1", unitPrice: "0" },
  ]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of BILLING_DOC_TYPES) counts[t] = 0;
    for (const doc of documents) {
      counts[doc.type] = (counts[doc.type] ?? 0) + 1;
    }
    return counts;
  }, [documents]);

  const load = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      const [docsRes, srcRes] = await Promise.all([
        fetch(`/api/admin/facturation?${params}`),
        fetch("/api/admin/facturation?sources=1"),
      ]);
      const docsJson = (await docsRes.json()) as {
        documents?: SerializedBillingDoc[];
        error?: string;
      };
      const srcJson = (await srcRes.json()) as {
        sources?: Sources;
        error?: string;
      };
      if (!docsRes.ok) throw new Error(docsJson.error ?? "Erreur");
      if (!srcRes.ok) throw new Error(srcJson.error ?? "Erreur");
      setDocuments(docsJson.documents ?? []);
      setSources(srcJson.sources ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }, [typeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/admin/facturation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: data.get("type"),
          title: data.get("title"),
          activity: data.get("activity"),
          clientName: data.get("clientName"),
          clientEmail: data.get("clientEmail"),
          clientPhone: data.get("clientPhone"),
          taxRate: data.get("taxRate"),
          notes: data.get("notes"),
          lines: lines.map((l) => ({
            label: l.label,
            quantity: Number.parseInt(l.quantity || "1", 10),
            unitPrice: Number.parseInt(l.unitPrice || "0", 10),
          })),
        }),
      });
      const json = (await res.json()) as {
        document?: SerializedBillingDoc;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      event.currentTarget.reset();
      setLines([{ label: "", quantity: "1", unitPrice: "0" }]);
      await load();
      if (json.document?.id) openPdf(json.document.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function fromSource(
    sourceType: string,
    sourceId: string,
    type: string,
  ) {
    if (!sourceId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/facturation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "from_source",
          type,
          sourceType,
          sourceId,
        }),
      });
      const json = (await res.json()) as {
        document?: SerializedBillingDoc;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      await load();
      if (json.document?.id) openPdf(json.document.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function convertDoc(id: string, toType: BillingDocType) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/facturation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "convert", id, toType }),
      });
      const json = (await res.json()) as {
        document?: SerializedBillingDoc;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      await load();
      if (json.document?.id) openPdf(json.document.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function generateReport() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/facturation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "report" }),
      });
      const json = (await res.json()) as {
        document?: SerializedBillingDoc;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      await load();
      if (json.document?.id) openPdf(json.document.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Facturation automatique"
        description="Devis, factures, reçus, contrats et rapports PDF — génération manuelle ou depuis les modules métier."
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-4 py-3 text-sm font-semibold text-febis-red">
          {error}
        </p>
      ) : null}

      <div className="mb-4 grid gap-2 sm:grid-cols-5">
        {BILLING_DOC_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={`rounded-xl border px-3 py-2 text-left text-sm ${
              typeFilter === t
                ? "border-febis-red/30 bg-febis-red/5"
                : "border-febis-ink/10 bg-white"
            }`}
          >
            <span className="block text-[10px] font-bold uppercase tracking-wider text-febis-ink/45">
              {billingTypeLabel(t)}
            </span>
            <span className="font-display text-xl font-bold text-febis-ink">
              {stats[t] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="field-premium max-w-xs"
        >
          <option value="all">Tous les types</option>
          {BILLING_DOC_TYPES.map((t) => (
            <option key={t} value={t}>
              {billingTypeLabel(t)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void generateReport()}
          disabled={saving}
          className="rounded-full border border-febis-ink/15 px-4 py-2 text-sm font-bold"
        >
          Rapport finance PDF
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="admin-panel overflow-hidden">
          <div className="border-b border-febis-ink/8 px-5 py-3 text-sm font-semibold">
            Documents ({documents.length})
          </div>
          <div className="divide-y divide-febis-ink/8">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold text-febis-ink">
                    {doc.number}
                  </p>
                  <p className="text-sm text-febis-ink/60">
                    {billingTypeLabel(doc.type)} · {doc.title} ·{" "}
                    {activityLabel(doc.activity)}
                  </p>
                  <p className="text-xs text-febis-ink/45">
                    {doc.clientName}
                    {doc.clientEmail ? ` · ${doc.clientEmail}` : ""}
                  </p>
                  {doc.type !== "rapport" ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {CONVERT_TARGETS.filter((t) => t !== doc.type).map(
                        (toType) => (
                          <button
                            key={toType}
                            type="button"
                            disabled={saving}
                            onClick={() => void convertDoc(doc.id, toType)}
                            className="rounded-full border border-febis-ink/12 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-febis-ink/70 hover:border-febis-red/30 hover:text-febis-red"
                          >
                            → {billingTypeLabel(toType)}
                          </button>
                        ),
                      )}
                    </div>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="font-bold text-febis-red">
                    {formatXof(doc.total)}
                  </p>
                  <a
                    href={`/api/admin/facturation/${doc.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs font-bold text-febis-red hover:underline"
                  >
                    Télécharger PDF
                  </a>
                </div>
              </div>
            ))}
            {documents.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-febis-ink/45">
                Aucun document.
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <form
            onSubmit={onCreate}
            className="admin-panel admin-panel-premium space-y-3 p-5"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
              Nouveau document
            </p>
            <select name="type" className="field-premium" defaultValue="facture">
              {BILLING_DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {billingTypeLabel(t)}
                </option>
              ))}
            </select>
            <input
              name="title"
              required
              placeholder="Titre"
              className="field-premium"
            />
            <select
              name="activity"
              className="field-premium"
              defaultValue="general"
            >
              <option value="general">Général</option>
              {ACTIVITIES.map((a) => (
                <option key={a} value={a}>
                  {activityLabel(a)}
                </option>
              ))}
            </select>
            <input
              name="clientName"
              required
              placeholder="Client"
              className="field-premium"
            />
            <input
              name="clientEmail"
              placeholder="Email"
              className="field-premium"
            />
            <input
              name="clientPhone"
              placeholder="Téléphone"
              className="field-premium"
            />
            <input
              name="taxRate"
              type="number"
              min={0}
              defaultValue={0}
              placeholder="TVA %"
              className="field-premium"
            />
            <div className="space-y-2 border-t border-febis-ink/8 pt-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">Lignes</p>
                <button
                  type="button"
                  onClick={() =>
                    setLines((l) => [
                      ...l,
                      { label: "", quantity: "1", unitPrice: "0" },
                    ])
                  }
                  className="text-xs font-bold text-febis-red"
                >
                  + Ligne
                </button>
              </div>
              {lines.map((line, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-3">
                  <input
                    value={line.label}
                    onChange={(e) =>
                      setLines((list) =>
                        list.map((row, i) =>
                          i === index ? { ...row, label: e.target.value } : row,
                        ),
                      )
                    }
                    placeholder="Libellé"
                    required
                    className="field-premium sm:col-span-3"
                  />
                  <input
                    value={line.quantity}
                    onChange={(e) =>
                      setLines((list) =>
                        list.map((row, i) =>
                          i === index
                            ? { ...row, quantity: e.target.value }
                            : row,
                        ),
                      )
                    }
                    placeholder="Qté"
                    className="field-premium"
                  />
                  <input
                    value={line.unitPrice}
                    onChange={(e) =>
                      setLines((list) =>
                        list.map((row, i) =>
                          i === index
                            ? { ...row, unitPrice: e.target.value }
                            : row,
                        ),
                      )
                    }
                    placeholder="Prix"
                    className="field-premium sm:col-span-2"
                  />
                </div>
              ))}
            </div>
            <textarea
              name="notes"
              rows={2}
              placeholder="Notes"
              className="field-premium"
            />
            <button
              type="submit"
              disabled={saving}
              className="cta-premium w-full justify-center disabled:opacity-60"
            >
              {saving ? "Création…" : "Créer le document PDF"}
            </button>
          </form>

          {sources ? (
            <div className="admin-panel admin-panel-premium space-y-3 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
                Génération automatique depuis une source
              </p>
              {(
                [
                  ["invoice", "invoices", "Facture CRM", "facture"],
                  ["reservation", "reservations", "Réservation", "facture"],
                  ["event_quote", "quotes", "Devis événementiel", "devis"],
                  ["shop_order", "orders", "Commande boutique", "facture"],
                  ["btp", "btp", "Projet BTP", "contrat"],
                ] as const
              ).map(([sourceType, key, label, defaultDocType]) => (
                <div key={sourceType} className="space-y-1.5">
                  <p className="text-xs font-semibold text-febis-ink/55">
                    {label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <select
                      id={`src-${sourceType}`}
                      className="field-premium min-w-0 flex-1"
                      defaultValue=""
                    >
                      <option value="">Choisir…</option>
                      {sources[key].map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {(
                      [
                        ["devis", "Devis"],
                        ["facture", "Facture"],
                        ["contrat", "Contrat"],
                        ["recu", "Reçu"],
                      ] as const
                    ).map(([docType, btnLabel]) => (
                      <button
                        key={docType}
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          const el = document.getElementById(
                            `src-${sourceType}`,
                          ) as HTMLSelectElement | null;
                          void fromSource(
                            sourceType,
                            el?.value ?? "",
                            docType || defaultDocType,
                          );
                        }}
                        className="rounded-full border border-febis-ink/15 px-3 py-2 text-xs font-bold"
                      >
                        {btnLabel}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState, useTransition } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import type { CrmStats, SerializedClient } from "@/lib/crm-shared";
import { activityLabel, clientStatusLabel } from "@/lib/crm-shared";
import { ACTIVITIES, CLIENT_STATUSES } from "@/lib/types";
import { cn } from "@/lib/cn";

export function CrmAdminClient() {
  const [clients, setClients] = useState<SerializedClient[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [stats, setStats] = useState<CrmStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activity, setActivity] = useState("all");
  const [status, setStatus] = useState("all");
  const [tag, setTag] = useState("all");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (activity !== "all") params.set("activity", activity);
      if (status !== "all") params.set("status", status);
      if (tag !== "all") params.set("tag", tag);

      const [listRes, statsRes, tagsRes] = await Promise.all([
        fetch(`/api/admin/crm?${params.toString()}`),
        fetch("/api/admin/crm?tab=stats"),
        fetch("/api/admin/crm?tab=tags"),
      ]);

      const listJson = (await listRes.json()) as {
        clients?: SerializedClient[];
        error?: string;
      };
      const statsJson = (await statsRes.json()) as {
        stats?: CrmStats;
        error?: string;
      };
      const tagsJson = (await tagsRes.json()) as {
        tags?: string[];
        error?: string;
      };

      if (!listRes.ok) throw new Error(listJson.error ?? "Erreur chargement");
      if (!statsRes.ok) throw new Error(statsJson.error ?? "Erreur stats");
      setClients(listJson.clients ?? []);
      setStats(statsJson.stats ?? null);
      setTags(tagsJson.tags ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [q, activity, status, tag]);

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
      const res = await fetch("/api/admin/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          company: data.get("company"),
          status: data.get("status") || "prospect",
          tags: data.get("tags"),
        }),
      });
      const json = (await res.json()) as {
        client?: SerializedClient;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Création impossible");
      event.currentTarget.reset();
      if (json.client?.id) {
        window.location.href = `/admin/dashboard/crm/${json.client.id}`;
        return;
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="CRM transversal"
        description="Base clients unique partagée (CDC §4.6) — historique, factures et projets liés automatiquement."
      />

      {stats ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Clients", String(stats.total)],
            ["Actifs", String(stats.actifs)],
            ["Projets liés", String(stats.linkedProjects)],
            ["Factures liées", String(stats.linkedInvoices)],
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

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="admin-panel admin-panel-premium p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
            Recherche & filtres
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2 block text-sm font-semibold text-febis-ink/80">
              Rechercher
              <input
                className="field-premium mt-2"
                placeholder="Nom, email, téléphone, société, tag…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold text-febis-ink/80">
              Module
              <select
                className="field-premium mt-2"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
              >
                <option value="all">Tous</option>
                <option value="general">Général</option>
                {ACTIVITIES.map((a) => (
                  <option key={a} value={a}>
                    {activityLabel(a)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-febis-ink/80">
              Statut
              <select
                className="field-premium mt-2"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">Tous</option>
                {CLIENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {clientStatusLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-febis-ink/80 sm:col-span-2">
              Tag
              <select
                className="field-premium mt-2"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              >
                <option value="all">Tous les tags</option>
                {tags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <p className="sm:col-span-2 text-sm text-febis-ink/45">
              {pending || loading
                ? "Actualisation…"
                : `${clients.length} client${clients.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <form onSubmit={onCreate} className="admin-panel space-y-3 p-5">
          <p className="font-display text-lg font-bold text-febis-ink">
            Nouveau client
          </p>
          <input
            required
            name="name"
            className="field-premium"
            placeholder="Nom complet *"
          />
          <input
            name="email"
            type="email"
            className="field-premium"
            placeholder="Email"
          />
          <input name="phone" className="field-premium" placeholder="Téléphone" />
          <input
            name="company"
            className="field-premium"
            placeholder="Société"
          />
          <input
            name="tags"
            className="field-premium"
            placeholder="Tags (séparés par des virgules)"
          />
          <select name="status" className="field-premium" defaultValue="prospect">
            {CLIENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {clientStatusLabel(s)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={creating}
            className="cta-premium w-full justify-center disabled:opacity-60"
          >
            {creating ? "Création…" : "Ajouter au CRM"}
          </button>
          <p className="text-xs text-febis-ink/45">
            Email / téléphone déjà connus → fusion automatique (pas de doublon).
          </p>
        </form>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/8 px-3 py-2 text-sm font-semibold text-febis-red">
          {error}
        </p>
      )}

      <div className="admin-panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-febis-mist/80 text-[11px] uppercase tracking-wider text-febis-ink/55">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Coordonnées</th>
              <th className="px-4 py-3">Modules</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Interactions</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-febis-ink/8">
            {loading && clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-febis-ink/50">
                  Chargement du CRM…
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-febis-ink/50">
                  Aucun client. Contact, réservation, devis, boutique et BTP
                  alimentent automatiquement cette base.
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="hover:bg-white/60">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-febis-ink">{client.name}</p>
                    {client.company ? (
                      <p className="text-xs text-febis-ink/45">{client.company}</p>
                    ) : null}
                    {client.tags.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {client.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded bg-febis-gold-deep/10 px-1.5 py-0.5 text-[10px] font-bold text-febis-gold-deep"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-febis-ink/70">
                    <p>{client.email || "—"}</p>
                    <p className="text-xs">{client.phone || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {client.modules.length === 0 ? (
                        <span className="text-xs text-febis-ink/40">—</span>
                      ) : (
                        client.modules.map((m) => (
                          <span
                            key={m}
                            className="rounded-md bg-febis-mist px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-febis-ink/65"
                          >
                            {activityLabel(m)}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-md px-2 py-1 text-[11px] font-bold",
                        client.status === "actif" &&
                          "bg-emerald-50 text-emerald-800",
                        client.status === "prospect" &&
                          "bg-amber-50 text-amber-900",
                        client.status === "inactif" &&
                          "bg-febis-mist text-febis-ink/55",
                      )}
                    >
                      {clientStatusLabel(client.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-febis-ink">
                    {client.interactionsCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/dashboard/crm/${client.id}`}
                      className="text-sm font-bold text-febis-red hover:underline"
                    >
                      Fiche →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

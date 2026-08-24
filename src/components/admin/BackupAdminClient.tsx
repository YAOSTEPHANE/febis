"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";

type BackupRow = {
  id: string;
  label: string;
  collections: string[];
  documentCount: number;
  sizeEstimate: number;
  createdBy: string;
  createdAt: string;
};

export function BackupAdminClient() {
  const [backups, setBackups] = useState<BackupRow[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/backups");
      const json = (await res.json()) as {
        backups?: BackupRow[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setBackups(json.backups ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Sauvegardes"
        description="Snapshots Mongo des collections critiques (clients, commandes, finance, RH…)."
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-4 py-3 text-sm font-semibold text-febis-red">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void create()}
        disabled={saving}
        className="cta-premium mb-6 disabled:opacity-60"
      >
        {saving ? "Création…" : "Créer un snapshot maintenant"}
      </button>

      <div className="admin-panel overflow-hidden">
        <div className="border-b border-febis-ink/8 px-5 py-3 text-sm font-semibold">
          Historique ({backups.length})
        </div>
        <div className="divide-y divide-febis-ink/8">
          {backups.map((b) => (
            <div key={b.id} className="px-5 py-4">
              <p className="font-display text-lg font-bold text-febis-ink">
                {b.label}
              </p>
              <p className="text-sm text-febis-ink/55">
                {new Date(b.createdAt).toLocaleString("fr-FR")} · {b.documentCount}{" "}
                docs · ~{Math.round(b.sizeEstimate / 1024)} Ko
                {b.createdBy ? ` · ${b.createdBy}` : ""}
              </p>
              <p className="mt-1 text-xs text-febis-ink/40">
                {b.collections.slice(0, 8).join(", ")}
                {b.collections.length > 8 ? "…" : ""}
              </p>
            </div>
          ))}
          {backups.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-febis-ink/45">
              Aucune sauvegarde pour le moment.
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}

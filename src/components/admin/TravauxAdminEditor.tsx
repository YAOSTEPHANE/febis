"use client";

import { useState } from "react";
import type { RecentWork } from "@/lib/travaux";
import {
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/AdminForms";

const emptyItem = (): RecentWork => ({
  id: `work-${Date.now()}`,
  pole: "evenementiel",
  title: "",
  location: "Abidjan",
  year: String(new Date().getFullYear()),
  summary: "",
  image: "/images/travail-event-1.jpg",
  tags: [],
});

export function TravauxAdminEditor({ initial }: { initial: RecentWork[] }) {
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState<RecentWork>(initial[0] ?? emptyItem());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      if (!draft.title || !draft.summary) {
        throw new Error("Titre et résumé obligatoires");
      }
      const res = await fetch("/api/admin/travaux", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const json = (await res.json()) as { error?: string; item?: RecentWork };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      const saved = json.item ?? draft;
      setItems((prev) => {
        const without = prev.filter((i) => i.id !== saved.id);
        return [...without, saved];
      });
      setDraft(saved);
      setMessage("Travail enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce travail ?")) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/travaux?id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      const next = items.filter((i) => i.id !== id);
      setItems(next);
      setDraft(next[0] ?? emptyItem());
      setMessage("Supprimé.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Travaux"
        description="Portfolio Événementiel & BTP de la section « Nos récents travaux »."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setDraft(emptyItem())}
            className="w-full rounded-xl border border-dashed border-febis-red/40 px-3 py-2 text-sm font-bold text-febis-red"
          >
            + Nouveau travail
          </button>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDraft(item)}
              className="block w-full rounded-xl border border-febis-ink/8 bg-white/70 px-3 py-3 text-left"
            >
              <p className="font-semibold text-febis-ink">{item.title}</p>
              <p className="text-xs text-febis-ink/50">
                {item.pole} · {item.year} · {item.location}
              </p>
            </button>
          ))}
        </div>
        <div className="space-y-3 rounded-2xl border border-febis-ink/8 bg-white/70 p-5">
          <label className="block text-sm font-semibold">
            Titre
            <input
              className="field-premium mt-2"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold">
            Résumé
            <textarea
              className="field-premium mt-2"
              value={draft.summary}
              onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Pôle
              <select
                className="field-premium mt-2"
                value={draft.pole}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    pole: e.target.value as RecentWork["pole"],
                  })
                }
              >
                <option value="evenementiel">Événementiel</option>
                <option value="btp">BTP</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Année
              <input
                className="field-premium mt-2"
                value={draft.year}
                onChange={(e) => setDraft({ ...draft, year: e.target.value })}
              />
            </label>
            <label className="text-sm font-semibold">
              Lieu
              <input
                className="field-premium mt-2"
                value={draft.location}
                onChange={(e) =>
                  setDraft({ ...draft, location: e.target.value })
                }
              />
            </label>
            <label className="text-sm font-semibold">
              Image
              <input
                className="field-premium mt-2"
                value={draft.image}
                onChange={(e) => setDraft({ ...draft, image: e.target.value })}
              />
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Tags (virgules)
            <input
              className="field-premium mt-2"
              value={draft.tags.join(", ")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="cta-premium disabled:opacity-60"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => remove(draft.id)}
              className="rounded-full border border-febis-red/30 px-4 py-2 text-sm font-bold text-febis-red"
            >
              Supprimer
            </button>
            <AdminNotice message={message} error={error} />
          </div>
        </div>
      </div>
    </>
  );
}

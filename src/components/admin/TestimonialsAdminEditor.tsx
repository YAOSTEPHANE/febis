"use client";

import { useState } from "react";
import type { Testimonial } from "@/lib/temoignages";
import { ACTIVITIES } from "@/lib/types";
import {
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/AdminForms";

const emptyItem = (): Testimonial => ({
  id: `t-${Date.now()}`,
  quote: "",
  name: "",
  role: "",
  activity: "residences",
  rating: 5,
});

export function TestimonialsAdminEditor({
  initial,
}: {
  initial: Testimonial[];
}) {
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState<Testimonial>(initial[0] ?? emptyItem());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      if (!draft.name || !draft.quote) {
        throw new Error("Nom et citation obligatoires");
      }
      const res = await fetch("/api/admin/temoignages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const json = (await res.json()) as {
        error?: string;
        item?: Testimonial;
      };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      const saved = json.item ?? draft;
      setItems((prev) => {
        const without = prev.filter((i) => i.id !== saved.id);
        return [...without, saved];
      });
      setDraft(saved);
      setMessage("Témoignage enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce témoignage ?")) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/temoignages?id=${encodeURIComponent(id)}`,
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
        title="Témoignages"
        description="Avis clients affichés dans la section témoignages de l’accueil."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setDraft(emptyItem())}
            className="w-full rounded-xl border border-dashed border-febis-red/40 px-3 py-2 text-sm font-bold text-febis-red"
          >
            + Nouveau témoignage
          </button>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDraft(item)}
              className="block w-full rounded-xl border border-febis-ink/8 bg-white/70 px-3 py-3 text-left"
            >
              <p className="font-semibold text-febis-ink">{item.name}</p>
              <p className="line-clamp-2 text-sm text-febis-ink/55">{item.quote}</p>
            </button>
          ))}
        </div>
        <div className="space-y-3 admin-panel p-5">
          <label className="block text-sm font-semibold">
            Nom
            <input
              className="field-premium mt-2"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold">
            Rôle
            <input
              className="field-premium mt-2"
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold">
            Citation
            <textarea
              className="field-premium mt-2 min-h-28"
              value={draft.quote}
              onChange={(e) => setDraft({ ...draft, quote: e.target.value })}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Activité
              <select
                className="field-premium mt-2"
                value={draft.activity}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    activity: e.target.value as Testimonial["activity"],
                  })
                }
              >
                {ACTIVITIES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Note
              <select
                className="field-premium mt-2"
                value={draft.rating}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    rating: Number(e.target.value) as 4 | 5,
                  })
                }
              >
                <option value={5}>5</option>
                <option value={4}>4</option>
              </select>
            </label>
          </div>
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

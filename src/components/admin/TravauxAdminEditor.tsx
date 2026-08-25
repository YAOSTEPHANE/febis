"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import type { RecentWork } from "@/lib/travaux";
import { workPoleLabel } from "@/lib/travaux";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import { AdminFormOverlay } from "@/components/admin/AdminFormOverlay";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

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
  const [draft, setDraft] = useState<RecentWork>(emptyItem());
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function openCreate() {
    setEditingId(null);
    setDraft(emptyItem());
    setFormOpen(true);
    setMessage("");
    setError("");
  }

  function openEdit(item: RecentWork) {
    setEditingId(item.id);
    setDraft(item);
    setFormOpen(true);
    setMessage("");
    setError("");
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setDraft(emptyItem());
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      setMessage("Travail enregistré.");
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: RecentWork) {
    if (!confirm(`Supprimer « ${item.title || "ce travail"} » ?`)) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/travaux?id=${encodeURIComponent(item.id)}`,
        { method: "DELETE" },
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (editingId === item.id) closeForm();
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
        actions={
          <button type="button" onClick={openCreate} className="cta-premium">
            + Nouveau travail
          </button>
        }
      />

      {error && !formOpen ? (
        <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-4 py-3 text-sm font-semibold text-febis-red">
          {error}
        </p>
      ) : null}
      {message && !formOpen ? (
        <p className="mb-4 rounded-xl border border-febis-ink/10 bg-febis-cream/50 px-4 py-3 text-sm text-febis-ink/70">
          {message}
        </p>
      ) : null}

      <div className="admin-panel overflow-hidden">
        <div className="border-b border-febis-ink/8 px-5 py-3 text-sm font-semibold text-febis-ink/70">
          {items.length} travail(aux)
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-febis-ink/8 bg-febis-smoke/40 text-[10px] font-bold uppercase tracking-[0.14em] text-febis-ink/45">
              <tr>
                <th className="px-5 py-3">Travail</th>
                <th className="px-3 py-3">Pôle</th>
                <th className="px-3 py-3">Année</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-febis-ink/8">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="align-top hover:bg-febis-cream/35"
                >
                  <td className="px-5 py-4">
                    <div className="flex gap-3">
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-febis-ink/10">
                        <Image
                          src={item.image || "/images/travail-event-1.jpg"}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
                          unoptimized={item.image.startsWith("/uploads/")}
                        />
                      </span>
                      <div>
                        <p className="font-display text-base font-bold text-febis-ink">
                          {item.title}
                        </p>
                        <p className="text-xs text-febis-ink/45">
                          {item.location}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">{workPoleLabel(item.pole)}</td>
                  <td className="px-3 py-4">{item.year}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="rounded-full border border-febis-ink/15 px-3 py-1.5 text-xs font-bold"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(item)}
                        className="rounded-full border border-febis-red/25 px-3 py-1.5 text-xs font-bold text-febis-red"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-febis-ink/8 md:hidden">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 px-4 py-4">
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-febis-ink/10">
                <Image
                  src={item.image || "/images/travail-event-1.jpg"}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                  unoptimized={item.image.startsWith("/uploads/")}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold">{item.title}</p>
                <p className="text-sm text-febis-ink/55">
                  {workPoleLabel(item.pole)} · {item.year} · {item.location}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="rounded-full border border-febis-ink/15 px-3 py-1.5 text-xs font-bold"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(item)}
                    className="rounded-full border border-febis-red/25 px-3 py-1.5 text-xs font-bold text-febis-red"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-febis-ink/50">
              Aucun travail. Ajoutez une fiche.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="cta-premium mt-4"
            >
              + Nouveau travail
            </button>
          </div>
        ) : null}
      </div>

      <AdminFormOverlay
        open={formOpen}
        onClose={closeForm}
        title={editingId ? "Modifier le travail" : "Nouveau travail"}
        subtitle="Pôle, image et tags"
        wide
        footer={
          <>
            <button
              type="submit"
              form="travaux-form"
              disabled={saving}
              className="cta-premium disabled:opacity-60"
            >
              {saving
                ? "Enregistrement…"
                : editingId
                  ? "Enregistrer"
                  : "Créer le travail"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  const current = items.find((i) => i.id === editingId);
                  if (current) void remove(current);
                }}
                className="rounded-full border border-febis-red/30 px-4 py-2 text-sm font-bold text-febis-red"
              >
                Supprimer
              </button>
            ) : null}
            <button
              type="button"
              onClick={closeForm}
              className="rounded-full border border-febis-ink/15 px-4 py-2 text-sm font-bold text-febis-ink/60"
            >
              Annuler
            </button>
          </>
        }
      >
        {error && formOpen ? (
          <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-4 py-3 text-sm font-semibold text-febis-red">
            {error}
          </p>
        ) : null}
        <form id="travaux-form" onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm font-semibold">
            Titre
            <input
              required
              autoFocus
              className="field-premium mt-2"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold">
            Résumé
            <textarea
              required
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
            <ImageUploadField
              label="Image"
              folder="travaux"
              value={draft.image}
              onChange={(url) =>
                setDraft({
                  ...draft,
                  image: url || "/images/travail-event-1.jpg",
                })
              }
              fallbackPreview="/images/travail-event-1.jpg"
              className="sm:col-span-2"
            />
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
        </form>
      </AdminFormOverlay>
    </>
  );
}

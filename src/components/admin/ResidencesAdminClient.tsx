"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import { AdminFormOverlay } from "@/components/admin/AdminFormOverlay";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import {
  LODGING_CATEGORIES,
  LODGING_STATUSES,
  categoryLabel,
  formatXof,
  statusLabel,
} from "@/lib/residences-shared";

type Lodging = {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription?: string;
  photos: string[];
  category: string;
  status: string;
  pricePerNight: number;
  depositPercent: number;
  location: string;
  neighborhood: string;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  highlights?: string[];
};

type FormState = {
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  photos: string[];
  category: string;
  status: string;
  pricePerNight: string;
  depositPercent: string;
  location: string;
  neighborhood: string;
  capacity: string;
  bedrooms: string;
  bathrooms: string;
  amenitiesText: string;
  highlightsText: string;
};

const emptyForm = (): FormState => ({
  title: "",
  slug: "",
  description: "",
  longDescription: "",
  photos: ["/images/pole-residences.jpg"],
  category: "appartement",
  status: "disponible",
  pricePerNight: "50000",
  depositPercent: "30",
  location: "Abidjan",
  neighborhood: "",
  capacity: "2",
  bedrooms: "1",
  bathrooms: "1",
  amenitiesText: "Wi-Fi, Climatisation",
  highlightsText: "",
});

function lodgingToForm(item: Lodging): FormState {
  return {
    title: item.title,
    slug: item.slug,
    description: item.description,
    longDescription: item.longDescription ?? "",
    photos:
      item.photos?.length > 0
        ? item.photos
        : ["/images/pole-residences.jpg"],
    category: item.category,
    status: item.status,
    pricePerNight: String(item.pricePerNight),
    depositPercent: String(item.depositPercent ?? 30),
    location: item.location,
    neighborhood: item.neighborhood,
    capacity: String(item.capacity),
    bedrooms: String(item.bedrooms),
    bathrooms: String(item.bathrooms),
    amenitiesText: (item.amenities ?? []).join(", "),
    highlightsText: (item.highlights ?? []).join(", "),
  };
}

export function ResidencesAdminClient() {
  const [lodgings, setLodgings] = useState<Lodging[]>([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/residences");
      const json = (await res.json()) as {
        lodgings?: Lodging[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setLodgings(json.lodgings ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditingSlug(null);
    setForm(emptyForm());
    setFormOpen(true);
    setError("");
    setInfo("");
  }

  function openEdit(item: Lodging) {
    setEditingSlug(item.slug);
    setForm(lodgingToForm(item));
    setFormOpen(true);
    setError("");
    setInfo("");
  }

  function closeForm() {
    setFormOpen(false);
    setEditingSlug(null);
    setForm(emptyForm());
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setInfo("");
    const payload = {
      title: form.title,
      slug: form.slug || undefined,
      nextSlug: form.slug || undefined,
      description: form.description,
      longDescription: form.longDescription,
      photos: form.photos,
      category: form.category,
      status: form.status,
      pricePerNight: Number.parseInt(form.pricePerNight || "0", 10),
      depositPercent: Number.parseInt(form.depositPercent || "0", 10),
      location: form.location,
      neighborhood: form.neighborhood,
      capacity: Number.parseInt(form.capacity || "1", 10),
      bedrooms: Number.parseInt(form.bedrooms || "0", 10),
      bathrooms: Number.parseInt(form.bathrooms || "0", 10),
      amenities: form.amenitiesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      highlights: form.highlightsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      const res = await fetch("/api/admin/residences", {
        method: editingSlug ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingSlug ? { ...payload, slug: editingSlug } : payload,
        ),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Enregistrement impossible");
      setInfo(editingSlug ? "Logement mis à jour." : "Logement créé.");
      closeForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(item: Lodging) {
    if (!window.confirm(`Supprimer « ${item.title} » ?`)) return;
    setError("");
    setInfo("");
    try {
      const res = await fetch(
        `/api/admin/residences?slug=${encodeURIComponent(item.slug)}`,
        { method: "DELETE" },
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Suppression impossible");
      if (editingSlug === item.slug) closeForm();
      setInfo(`« ${item.title} » a été supprimé.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Résidences"
        description="Gestion des logements : fiches, photos, tarifs, capacité — ajout, modification et suppression."
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <button type="button" onClick={openCreate} className="cta-premium">
          + Ajouter un logement
        </button>
        <Link href="/admin/dashboard/reservations" className="rounded-full border border-febis-ink/15 px-4 py-2 text-sm font-bold">
          Réservations →
        </Link>
        <Link
          href="/residences"
          className="rounded-full border border-febis-ink/15 px-4 py-2 text-sm font-bold"
          target="_blank"
        >
          Voir le site ↗
        </Link>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-4 py-3 text-sm font-semibold text-febis-red">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="mb-4 rounded-xl border border-febis-ink/10 bg-febis-cream/50 px-4 py-3 text-sm text-febis-ink/70">
          {info}
        </p>
      ) : null}

      <div className="admin-panel overflow-hidden">
        <div className="border-b border-febis-ink/8 px-5 py-3 text-sm font-semibold text-febis-ink/70">
          {loading ? "Chargement…" : `${lodgings.length} logement(s)`}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-febis-ink/8 bg-febis-smoke/40 text-[10px] font-bold uppercase tracking-[0.14em] text-febis-ink/45">
              <tr>
                <th className="px-5 py-3">Logement</th>
                <th className="px-3 py-3">Catégorie</th>
                <th className="px-3 py-3">Prix / nuit</th>
                <th className="px-3 py-3">Statut</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-febis-ink/8">
              {lodgings.map((item) => (
                <tr key={item.slug} className="align-top hover:bg-febis-cream/35">
                  <td className="px-5 py-4">
                    <div className="flex gap-3">
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-febis-ink/10">
                        <Image
                          src={item.photos?.[0] || "/images/pole-residences.jpg"}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
                          unoptimized={(item.photos?.[0] ?? "").startsWith("/uploads/")}
                        />
                      </span>
                      <div>
                        <p className="font-display text-base font-bold text-febis-ink">
                          {item.title}
                        </p>
                        <p className="text-xs text-febis-ink/45">
                          {item.location} · {item.capacity} pers. ·{" "}
                          {item.bedrooms} ch.
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">{categoryLabel(item.category)}</td>
                  <td className="px-3 py-4 font-bold text-febis-red">
                    {formatXof(item.pricePerNight)}
                  </td>
                  <td className="px-3 py-4">
                    <span className="rounded-full bg-febis-mist px-2.5 py-1 text-[11px] font-bold">
                      {statusLabel(item.status)}
                    </span>
                  </td>
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
                        onClick={() => void onDelete(item)}
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
          {lodgings.map((item) => (
            <div key={item.slug} className="px-4 py-4">
              <p className="font-display text-lg font-bold">{item.title}</p>
              <p className="text-sm text-febis-ink/55">
                {categoryLabel(item.category)} · {formatXof(item.pricePerNight)}
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
                  onClick={() => void onDelete(item)}
                  className="rounded-full border border-febis-red/25 px-3 py-1.5 text-xs font-bold text-febis-red"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && lodgings.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-febis-ink/50">
              Aucun logement en base. Ajoutez une fiche.
            </p>
            <button type="button" onClick={openCreate} className="cta-premium mt-4">
              + Ajouter un logement
            </button>
          </div>
        ) : null}
      </div>

      <AdminFormOverlay
        open={formOpen}
        onClose={closeForm}
        title={editingSlug ? "Modifier le logement" : "Nouveau logement"}
        subtitle="Fiche, photos, tarif et capacité"
        wide
        footer={
          <>
            <button
              type="submit"
              form="residence-form"
              disabled={saving}
              className="cta-premium disabled:opacity-60"
            >
              {saving
                ? "Enregistrement…"
                : editingSlug
                  ? "Enregistrer"
                  : "Créer le logement"}
            </button>
            {editingSlug ? (
              <button
                type="button"
                onClick={() => {
                  const current = lodgings.find((l) => l.slug === editingSlug);
                  if (current) void onDelete(current);
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
        <form id="residence-form" onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm font-semibold">
              Titre *
              <input
                required
                autoFocus
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="field-premium mt-1.5"
              />
            </label>
            <label className="block text-sm font-semibold">
              Slug
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="field-premium mt-1.5"
                placeholder="Auto si vide"
              />
            </label>
            <label className="block text-sm font-semibold">
              Catégorie
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                className="field-premium mt-1.5"
              >
                {LODGING_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {categoryLabel(c)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Statut
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
                className="field-premium mt-1.5"
              >
                {LODGING_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Prix / nuit (XOF)
              <input
                required
                inputMode="numeric"
                value={form.pricePerNight}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pricePerNight: e.target.value }))
                }
                className="field-premium mt-1.5"
              />
            </label>
            <label className="block text-sm font-semibold">
              Acompte (%)
              <input
                inputMode="numeric"
                value={form.depositPercent}
                onChange={(e) =>
                  setForm((f) => ({ ...f, depositPercent: e.target.value }))
                }
                className="field-premium mt-1.5"
              />
            </label>
            <label className="block text-sm font-semibold">
              Localisation
              <input
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                className="field-premium mt-1.5"
              />
            </label>
            <label className="block text-sm font-semibold">
              Quartier
              <input
                value={form.neighborhood}
                onChange={(e) =>
                  setForm((f) => ({ ...f, neighborhood: e.target.value }))
                }
                className="field-premium mt-1.5"
              />
            </label>
            <label className="block text-sm font-semibold">
              Capacité
              <input
                inputMode="numeric"
                value={form.capacity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, capacity: e.target.value }))
                }
                className="field-premium mt-1.5"
              />
            </label>
            <label className="block text-sm font-semibold">
              Chambres / SDB
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <input
                  inputMode="numeric"
                  value={form.bedrooms}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bedrooms: e.target.value }))
                  }
                  className="field-premium"
                  placeholder="Chambres"
                />
                <input
                  inputMode="numeric"
                  value={form.bathrooms}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bathrooms: e.target.value }))
                  }
                  className="field-premium"
                  placeholder="SDB"
                />
              </div>
            </label>
          </div>

          <label className="block text-sm font-semibold">
            Description *
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="field-premium mt-1.5"
            />
          </label>

          <label className="block text-sm font-semibold">
            Description longue
            <textarea
              rows={3}
              value={form.longDescription}
              onChange={(e) =>
                setForm((f) => ({ ...f, longDescription: e.target.value }))
              }
              className="field-premium mt-1.5"
            />
          </label>

          <div className="space-y-3 border-t border-febis-ink/8 pt-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-febis-ink">Photos</p>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    photos: [...f.photos, "/images/pole-residences.jpg"],
                  }))
                }
                className="text-xs font-bold text-febis-red hover:underline"
              >
                + Photo
              </button>
            </div>
            {form.photos.map((photo, index) => (
              <div key={`${photo}-${index}`} className="space-y-2">
                <ImageUploadField
                  label={`Photo ${index + 1}`}
                  folder="residences"
                  value={photo}
                  onChange={(url) =>
                    setForm((f) => ({
                      ...f,
                      photos: f.photos.map((p, i) =>
                        i === index
                          ? url || "/images/pole-residences.jpg"
                          : p,
                      ),
                    }))
                  }
                  fallbackPreview="/images/pole-residences.jpg"
                />
                {form.photos.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        photos: f.photos.filter((_, i) => i !== index),
                      }))
                    }
                    className="text-xs font-bold text-febis-red"
                  >
                    Retirer cette photo
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          <label className="block text-sm font-semibold">
            Équipements (virgules)
            <input
              value={form.amenitiesText}
              onChange={(e) =>
                setForm((f) => ({ ...f, amenitiesText: e.target.value }))
              }
              className="field-premium mt-1.5"
            />
          </label>
          <label className="block text-sm font-semibold">
            Points forts (virgules)
            <input
              value={form.highlightsText}
              onChange={(e) =>
                setForm((f) => ({ ...f, highlightsText: e.target.value }))
              }
              className="field-premium mt-1.5"
            />
          </label>
        </form>
      </AdminFormOverlay>
    </>
  );
}

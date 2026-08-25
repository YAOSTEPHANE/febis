"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import type { BlogPost } from "@/lib/blog";
import { blogCategoryLabel } from "@/lib/blog";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import { AdminFormOverlay } from "@/components/admin/AdminFormOverlay";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

const emptyPost = (): BlogPost => ({
  slug: "",
  title: "",
  excerpt: "",
  content: [""],
  category: "entreprise",
  author: "Équipe FEBiS",
  date: new Date().toISOString().slice(0, 10),
  readMinutes: 3,
  image: "/images/blog-residences.jpg",
  featured: false,
});

export function BlogAdminEditor({ initial }: { initial: BlogPost[] }) {
  const [posts, setPosts] = useState(initial);
  const [draft, setDraft] = useState<BlogPost>(emptyPost());
  const [formOpen, setFormOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function openCreate() {
    setEditingSlug(null);
    setDraft(emptyPost());
    setFormOpen(true);
    setMessage("");
    setError("");
  }

  function openEdit(post: BlogPost) {
    setEditingSlug(post.slug);
    setDraft(post);
    setFormOpen(true);
    setMessage("");
    setError("");
  }

  function closeForm() {
    setFormOpen(false);
    setEditingSlug(null);
    setDraft(emptyPost());
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload: BlogPost = {
        ...draft,
        content: draft.content.filter((p) => p.trim().length > 0),
        slug: draft.slug.trim(),
      };
      if (!payload.slug || !payload.title) {
        throw new Error("Slug et titre obligatoires");
      }
      const res = await fetch("/api/admin/blog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string; post?: BlogPost };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      const saved = json.post ?? payload;
      setPosts((prev) => {
        const without = prev.filter(
          (p) => p.slug !== saved.slug && p.slug !== editingSlug,
        );
        return [saved, ...without].sort((a, b) => b.date.localeCompare(a.date));
      });
      setMessage("Article enregistré.");
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function remove(post: BlogPost) {
    if (!confirm(`Supprimer « ${post.title} » ?`)) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/blog?slug=${encodeURIComponent(post.slug)}`,
        { method: "DELETE" },
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      setPosts((prev) => prev.filter((p) => p.slug !== post.slug));
      if (editingSlug === post.slug) closeForm();
      setMessage("Article supprimé.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Blog"
        description="Articles affichés sur l’accueil et la page /blog."
        actions={
          <button type="button" onClick={openCreate} className="cta-premium">
            + Nouvel article
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
          {posts.length} article(s)
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-febis-ink/8 bg-febis-smoke/40 text-[10px] font-bold uppercase tracking-[0.14em] text-febis-ink/45">
              <tr>
                <th className="px-5 py-3">Article</th>
                <th className="px-3 py-3">Catégorie</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-febis-ink/8">
              {posts.map((post) => (
                <tr
                  key={post.slug}
                  className="align-top hover:bg-febis-cream/35"
                >
                  <td className="px-5 py-4">
                    <div className="flex gap-3">
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-febis-ink/10">
                        <Image
                          src={post.image || "/images/blog-residences.jpg"}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
                          unoptimized={post.image.startsWith("/uploads/")}
                        />
                      </span>
                      <div>
                        <p className="font-display text-base font-bold text-febis-ink">
                          {post.title}
                        </p>
                        <p className="text-xs text-febis-ink/45">
                          {post.slug}
                          {post.featured ? " · À la une" : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    {blogCategoryLabel(post.category)}
                  </td>
                  <td className="px-3 py-4">{post.date}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(post)}
                        className="rounded-full border border-febis-ink/15 px-3 py-1.5 text-xs font-bold"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(post)}
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
          {posts.map((post) => (
            <div key={post.slug} className="flex gap-3 px-4 py-4">
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-febis-ink/10">
                <Image
                  src={post.image || "/images/blog-residences.jpg"}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                  unoptimized={post.image.startsWith("/uploads/")}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold">{post.title}</p>
                <p className="text-sm text-febis-ink/55">
                  {blogCategoryLabel(post.category)} · {post.date}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(post)}
                    className="rounded-full border border-febis-ink/15 px-3 py-1.5 text-xs font-bold"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(post)}
                    className="rounded-full border border-febis-red/25 px-3 py-1.5 text-xs font-bold text-febis-red"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-febis-ink/50">
              Aucun article. Créez le premier.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="cta-premium mt-4"
            >
              + Nouvel article
            </button>
          </div>
        ) : null}
      </div>

      <AdminFormOverlay
        open={formOpen}
        onClose={closeForm}
        title={editingSlug ? "Modifier l’article" : "Nouvel article"}
        subtitle="Contenu, image et mise en avant"
        wide
        footer={
          <>
            <button
              type="submit"
              form="blog-form"
              disabled={saving}
              className="cta-premium disabled:opacity-60"
            >
              {saving
                ? "Enregistrement…"
                : editingSlug
                  ? "Enregistrer"
                  : "Créer l’article"}
            </button>
            {editingSlug ? (
              <button
                type="button"
                onClick={() => {
                  const current = posts.find((p) => p.slug === editingSlug);
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
        <form id="blog-form" onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm font-semibold">
            Slug
            <input
              required
              className="field-premium mt-2"
              value={draft.slug}
              onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
            />
          </label>
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
            Extrait
            <textarea
              className="field-premium mt-2"
              value={draft.excerpt}
              onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold">
            Contenu (paragraphes, un par ligne vide)
            <textarea
              className="field-premium mt-2 min-h-40"
              value={draft.content.join("\n\n")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  content: e.target.value.split(/\n\s*\n/),
                })
              }
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Catégorie
              <select
                className="field-premium mt-2"
                value={draft.category}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    category: e.target.value as BlogPost["category"],
                  })
                }
              >
                <option value="residences">Résidences</option>
                <option value="evenementiel">Événementiel</option>
                <option value="btp">BTP</option>
                <option value="entreprise">Entreprise</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Date
              <input
                type="date"
                className="field-premium mt-2"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </label>
            <label className="text-sm font-semibold">
              Auteur
              <input
                className="field-premium mt-2"
                value={draft.author}
                onChange={(e) => setDraft({ ...draft, author: e.target.value })}
              />
            </label>
            <label className="text-sm font-semibold">
              Minutes de lecture
              <input
                type="number"
                min={1}
                className="field-premium mt-2"
                value={draft.readMinutes}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    readMinutes: Number.parseInt(e.target.value || "1", 10),
                  })
                }
              />
            </label>
          </div>
          <ImageUploadField
            label="Image"
            folder="blog"
            value={draft.image}
            onChange={(url) =>
              setDraft({
                ...draft,
                image: url || "/images/blog-residences.jpg",
              })
            }
            fallbackPreview="/images/blog-residences.jpg"
          />
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={Boolean(draft.featured)}
              onChange={(e) =>
                setDraft({ ...draft, featured: e.target.checked })
              }
            />
            À la une (accueil)
          </label>
        </form>
      </AdminFormOverlay>
    </>
  );
}

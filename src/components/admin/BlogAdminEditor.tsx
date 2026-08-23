"use client";

import { useMemo, useState } from "react";
import type { BlogPost } from "@/lib/blog";
import {
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/AdminForms";

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
  const [selectedSlug, setSelectedSlug] = useState(initial[0]?.slug ?? "");
  const [draft, setDraft] = useState<BlogPost>(initial[0] ?? emptyPost());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selected = useMemo(
    () => posts.find((p) => p.slug === selectedSlug),
    [posts, selectedSlug],
  );

  function selectPost(slug: string) {
    const post = posts.find((p) => p.slug === slug);
    if (!post) return;
    setSelectedSlug(slug);
    setDraft(post);
  }

  function startNew() {
    const post = emptyPost();
    setSelectedSlug("");
    setDraft(post);
  }

  async function save() {
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
        const without = prev.filter((p) => p.slug !== saved.slug);
        return [saved, ...without].sort((a, b) => b.date.localeCompare(a.date));
      });
      setSelectedSlug(saved.slug);
      setDraft(saved);
      setMessage("Article enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selected?.slug) return;
    if (!confirm(`Supprimer « ${selected.title} » ?`)) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/blog?slug=${encodeURIComponent(selected.slug)}`,
        { method: "DELETE" },
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      const next = posts.filter((p) => p.slug !== selected.slug);
      setPosts(next);
      setSelectedSlug(next[0]?.slug ?? "");
      setDraft(next[0] ?? emptyPost());
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
      />
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-2">
          <button
            type="button"
            onClick={startNew}
            className="w-full rounded-xl border border-dashed border-febis-red/40 px-3 py-2 text-sm font-bold text-febis-red"
          >
            + Nouvel article
          </button>
          {posts.map((post) => (
            <button
              key={post.slug}
              type="button"
              onClick={() => selectPost(post.slug)}
              className={`block w-full rounded-xl border px-3 py-3 text-left ${
                selectedSlug === post.slug
                  ? "border-febis-red/40 bg-white"
                  : "border-febis-ink/8 bg-white/60"
              }`}
            >
              <p className="font-semibold text-febis-ink">{post.title}</p>
              <p className="text-xs text-febis-ink/50">
                {post.date} · {post.category}
              </p>
            </button>
          ))}
        </div>

        <div className="space-y-3 rounded-2xl border border-febis-ink/8 bg-white/70 p-5">
          <label className="block text-sm font-semibold">
            Slug
            <input
              className="field-premium mt-2"
              value={draft.slug}
              onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold">
            Titre
            <input
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
          <label className="block text-sm font-semibold">
            Image
            <input
              className="field-premium mt-2"
              value={draft.image}
              onChange={(e) => setDraft({ ...draft, image: e.target.value })}
            />
          </label>
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
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="cta-premium disabled:opacity-60"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            {selected && (
              <button
                type="button"
                onClick={remove}
                className="rounded-full border border-febis-red/30 px-4 py-2 text-sm font-bold text-febis-red"
              >
                Supprimer
              </button>
            )}
            <AdminNotice message={message} error={error} />
          </div>
        </div>
      </div>
    </>
  );
}

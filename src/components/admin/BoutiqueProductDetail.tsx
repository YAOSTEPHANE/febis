"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminPageHeader, AdminSaveButton } from "@/components/admin/AdminForms";
import {
  formatXof,
  PRODUCT_CATEGORIES,
  productCategoryLabel,
  type SerializedProduct,
} from "@/lib/boutique-shared";

type VariantForm = {
  sku: string;
  size: string;
  color: string;
  stock: string;
  price: string;
};

export function BoutiqueProductDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<SerializedProduct | null>(null);
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/admin/boutique/${params.id}`);
        const json = (await res.json()) as {
          product?: SerializedProduct;
          error?: string;
        };
        if (!res.ok) throw new Error(json.error ?? "Introuvable");
        if (cancelled) return;
        const p = json.product!;
        setProduct(p);
        setVariants(
          p.variants.map((v) => ({
            sku: v.sku,
            size: v.size ?? "",
            color: v.color ?? "",
            stock: String(v.stock),
            price: String(v.price),
          })),
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erreur");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product) return;
    setSaving(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const res = await fetch(`/api/admin/boutique/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          slug: data.get("slug"),
          category: data.get("category"),
          description: data.get("description"),
          photo: data.get("photo"),
          featured: data.get("featured") === "on",
          variants: variants.map((v) => ({
            sku: v.sku,
            size: v.size || undefined,
            color: v.color || undefined,
            stock: Number.parseInt(v.stock || "0", 10),
            price: Number.parseInt(v.price || "0", 10),
          })),
        }),
      });
      const json = (await res.json()) as {
        product?: SerializedProduct;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      setProduct(json.product ?? product);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!product) return;
    if (!window.confirm(`Supprimer « ${product.name} » ?`)) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/boutique/${product.id}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Suppression impossible");
      router.push("/admin/dashboard/boutique");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  if (loading) {
    return <p className="text-sm text-febis-ink/55">Chargement…</p>;
  }

  if (!product) {
    return (
      <div>
        <p className="text-sm font-semibold text-febis-red">
          {error || "Produit introuvable"}
        </p>
        <Link
          href="/admin/dashboard/boutique"
          className="mt-4 inline-block text-sm font-bold text-febis-red hover:underline"
        >
          ← Retour boutique
        </Link>
      </div>
    );
  }

  return (
    <>
      <AdminPageHeader
        title={product.name}
        description={`Fiche produit · stock total ${product.stockTotal} · dès ${formatXof(product.priceFrom)}`}
      />
      <Link
        href="/admin/dashboard/boutique"
        className="mb-5 inline-block text-sm font-bold text-febis-red hover:underline"
      >
        ← Catalogue admin
      </Link>

      {error ? (
        <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-4 py-3 text-sm font-semibold text-febis-red">
          {error}
        </p>
      ) : null}

      <form onSubmit={onSave} className="admin-panel admin-panel-premium space-y-4 p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm font-semibold">
            Nom
            <input
              name="name"
              required
              defaultValue={product.name}
              className="field-premium mt-1.5"
            />
          </label>
          <label className="block text-sm font-semibold">
            Slug
            <input
              name="slug"
              required
              defaultValue={product.slug}
              className="field-premium mt-1.5"
            />
          </label>
          <label className="block text-sm font-semibold">
            Catégorie
            <select
              name="category"
              defaultValue={product.category}
              className="field-premium mt-1.5"
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {productCategoryLabel(c)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Photo
            <input
              name="photo"
              defaultValue={product.photo}
              className="field-premium mt-1.5"
            />
          </label>
        </div>
        <label className="block text-sm font-semibold">
          Description
          <textarea
            name="description"
            rows={4}
            defaultValue={product.description}
            className="field-premium mt-1.5"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={product.featured}
          />
          À la une (vitrine)
        </label>

        <div className="space-y-3 border-t border-febis-ink/8 pt-4">
          <div className="flex items-center justify-between">
            <p className="font-bold text-febis-ink">Variantes · stock · prix</p>
            <button
              type="button"
              onClick={() =>
                setVariants((list) => [
                  ...list,
                  { sku: "", size: "", color: "", stock: "0", price: "0" },
                ])
              }
              className="text-xs font-bold text-febis-red hover:underline"
            >
              + Variante
            </button>
          </div>
          {variants.map((row, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-xl border border-febis-ink/10 bg-white/50 p-3 md:grid-cols-5"
            >
              <input
                value={row.sku}
                onChange={(e) =>
                  setVariants((list) =>
                    list.map((v, i) =>
                      i === index ? { ...v, sku: e.target.value } : v,
                    ),
                  )
                }
                placeholder="SKU"
                required
                className="field-premium"
              />
              <input
                value={row.size}
                onChange={(e) =>
                  setVariants((list) =>
                    list.map((v, i) =>
                      i === index ? { ...v, size: e.target.value } : v,
                    ),
                  )
                }
                placeholder="Taille"
                className="field-premium"
              />
              <input
                value={row.color}
                onChange={(e) =>
                  setVariants((list) =>
                    list.map((v, i) =>
                      i === index ? { ...v, color: e.target.value } : v,
                    ),
                  )
                }
                placeholder="Couleur"
                className="field-premium"
              />
              <input
                value={row.stock}
                onChange={(e) =>
                  setVariants((list) =>
                    list.map((v, i) =>
                      i === index ? { ...v, stock: e.target.value } : v,
                    ),
                  )
                }
                placeholder="Stock"
                required
                className="field-premium"
              />
              <input
                value={row.price}
                onChange={(e) =>
                  setVariants((list) =>
                    list.map((v, i) =>
                      i === index ? { ...v, price: e.target.value } : v,
                    ),
                  )
                }
                placeholder="Prix"
                required
                className="field-premium"
              />
              {variants.length > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setVariants((list) => list.filter((_, i) => i !== index))
                  }
                  className="text-left text-xs font-bold text-febis-red md:col-span-5"
                >
                  Retirer
                </button>
              ) : null}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <AdminSaveButton saving={saving} />
          <button
            type="button"
            onClick={() => void onDelete()}
            className="rounded-full border border-febis-red/30 px-4 py-2 text-sm font-bold text-febis-red"
          >
            Supprimer
          </button>
          <Link
            href={`/boutique/${product.slug}`}
            target="_blank"
            className="rounded-full border border-febis-ink/15 px-4 py-2 text-sm font-bold text-febis-ink/70"
          >
            Voir en boutique ↗
          </Link>
        </div>
      </form>
    </>
  );
}

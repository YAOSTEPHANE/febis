"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import { AdminFormOverlay } from "@/components/admin/AdminFormOverlay";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import {
  formatXof,
  ORDER_STATUSES,
  orderStatusLabel,
  PRODUCT_CATEGORIES,
  productCategoryLabel,
  variantLabel,
  type SerializedProduct,
  type SerializedShopOrder,
} from "@/lib/boutique-shared";
import { cn } from "@/lib/cn";

type Tab = "produits" | "ventes";

type Stats = {
  ordersCount: number;
  activeOrders: number;
  revenue: number;
  productsCount: number;
  lowStockCount: number;
  outOfStockCount: number;
};

type VariantForm = {
  sku: string;
  size: string;
  color: string;
  stock: string;
  price: string;
};

type ProductFormState = {
  name: string;
  slug: string;
  category: string;
  description: string;
  photo: string;
  featured: boolean;
  variants: VariantForm[];
};

const emptyVariant = (): VariantForm => ({
  sku: "",
  size: "",
  color: "",
  stock: "0",
  price: "0",
});

const emptyForm = (): ProductFormState => ({
  name: "",
  slug: "",
  category: "mode",
  description: "",
  photo: "/images/boutique-produits.jpg",
  featured: false,
  variants: [emptyVariant()],
});

function productToForm(product: SerializedProduct): ProductFormState {
  return {
    name: product.name,
    slug: product.slug,
    category: product.category,
    description: product.description,
    photo: product.photo,
    featured: product.featured,
    variants: product.variants.map((v) => ({
      sku: v.sku,
      size: v.size ?? "",
      color: v.color ?? "",
      stock: String(v.stock),
      price: String(v.price),
    })),
  };
}

function stockTone(stock: number) {
  if (stock <= 0) return "text-febis-red bg-febis-red/10";
  if (stock <= 5) return "text-[#8a7010] bg-[#c9a227]/15";
  return "text-emerald-800 bg-emerald-50";
}

function stockLabel(stock: number) {
  if (stock <= 0) return "Rupture";
  if (stock <= 5) return "Stock bas";
  return "En stock";
}

export function BoutiqueAdminClient() {
  const [tab, setTab] = useState<Tab>("produits");
  const [products, setProducts] = useState<SerializedProduct[]>([]);
  const [orders, setOrders] = useState<SerializedShopOrder[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());

      if (tab === "produits") {
        params.set("tab", "produits");
        if (category !== "all") params.set("category", category);
        const [productsRes, statsRes] = await Promise.all([
          fetch(`/api/admin/boutique?${params}`),
          fetch("/api/admin/boutique?tab=stats"),
        ]);
        const productsJson = (await productsRes.json()) as {
          products?: SerializedProduct[];
          error?: string;
        };
        const statsJson = (await statsRes.json()) as {
          stats?: Stats;
          error?: string;
        };
        if (!productsRes.ok) throw new Error(productsJson.error ?? "Erreur");
        if (!statsRes.ok) throw new Error(statsJson.error ?? "Erreur stats");
        setProducts(productsJson.products ?? []);
        setStats(statsJson.stats ?? null);
      } else {
        params.set("tab", "commandes");
        if (status !== "all") params.set("status", status);
        const [ordersRes, statsRes] = await Promise.all([
          fetch(`/api/admin/boutique?${params}`),
          fetch("/api/admin/boutique?tab=stats"),
        ]);
        const ordersJson = (await ordersRes.json()) as {
          orders?: SerializedShopOrder[];
          error?: string;
        };
        const statsJson = (await statsRes.json()) as {
          stats?: Stats;
          error?: string;
        };
        if (!ordersRes.ok) throw new Error(ordersJson.error ?? "Erreur");
        if (!statsRes.ok) throw new Error(statsJson.error ?? "Erreur stats");
        setOrders(ordersJson.orders ?? []);
        setStats(statsJson.stats ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [tab, q, category, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        void load();
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!formOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeForm();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [formOpen]);

  const productStats = useMemo(() => {
    const low = products.filter((p) => p.stockTotal > 0 && p.stockTotal <= 5).length;
    const out = products.filter((p) => p.stockTotal <= 0).length;
    return { low, out, count: products.length };
  }, [products]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
    setError("");
    setInfo("");
  }

  function openEdit(product: SerializedProduct) {
    setEditingId(product.id);
    setForm(productToForm(product));
    setFormOpen(true);
    setError("");
    setInfo("");
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  function updateVariant(
    index: number,
    patch: Partial<VariantForm>,
  ) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === index ? { ...v, ...patch } : v,
      ),
    }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setInfo("");
    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      category: form.category,
      description: form.description,
      photo: form.photo,
      featured: form.featured,
      variants: form.variants.map((v) => ({
        sku: v.sku,
        size: v.size || undefined,
        color: v.color || undefined,
        stock: Number.parseInt(v.stock || "0", 10),
        price: Number.parseInt(v.price || "0", 10),
      })),
    };

    try {
      const res = await fetch(
        editingId
          ? `/api/admin/boutique/${editingId}`
          : "/api/admin/boutique",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Enregistrement impossible");
      setInfo(
        editingId
          ? "Produit mis à jour."
          : "Produit créé — visible dans la liste et en boutique.",
      );
      closeForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(product: SerializedProduct) {
    if (
      !window.confirm(
        `Supprimer définitivement « ${product.name} » et ses variantes ?`,
      )
    ) {
      return;
    }
    setError("");
    setInfo("");
    try {
      const res = await fetch(`/api/admin/boutique/${product.id}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Suppression impossible");
      if (editingId === product.id) closeForm();
      setInfo(`« ${product.name} » a été supprimé.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function onImportDemo() {
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const res = await fetch("/api/admin/boutique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import_demo" }),
      });
      const json = (await res.json()) as {
        error?: string;
        result?: { upserted: number; total: number };
      };
      if (!res.ok) throw new Error(json.error ?? "Import impossible");
      setInfo(
        `Catalogue importé : ${json.result?.upserted ?? 0} fiche(s), ${json.result?.total ?? 0} produit(s) au total.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  const [orderOpen, setOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] =
    useState<SerializedShopOrder | null>(null);
  const [orderStatus, setOrderStatus] = useState("");
  const [orderSaving, setOrderSaving] = useState(false);

  function openOrder(order: SerializedShopOrder) {
    setSelectedOrder(order);
    setOrderStatus(order.status);
    setError("");
    setOrderOpen(true);
  }

  function closeOrder() {
    setOrderOpen(false);
    setSelectedOrder(null);
    setOrderStatus("");
  }

  async function onStatusChange(id: string, nextStatus: string) {
    setError("");
    try {
      const res = await fetch(`/api/admin/boutique/commandes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Mise à jour impossible");
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, status: nextStatus as SerializedShopOrder["status"] }
            : o,
        ),
      );
      if (selectedOrder?.id === id) {
        setSelectedOrder((o) =>
          o
            ? { ...o, status: nextStatus as SerializedShopOrder["status"] }
            : o,
        );
        setOrderStatus(nextStatus);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function onSaveOrderStatus() {
    if (!selectedOrder) return;
    setOrderSaving(true);
    try {
      await onStatusChange(selectedOrder.id, orderStatus);
      closeOrder();
    } finally {
      setOrderSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Module Boutique"
        description="Gestion des produits : fiches, stock, prix — ajout, modification et suppression."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            ["produits", "Gestion des produits"],
            ["ventes", "Commandes & ventes"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              closeForm();
            }}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-bold",
              tab === id
                ? "border-febis-red bg-febis-red text-white"
                : "border-febis-ink/12 bg-white text-febis-ink/70",
            )}
          >
            {label}
          </button>
        ))}
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

      {tab === "produits" ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Produits", String(productStats.count)],
              ["Stock bas", String(stats?.lowStockCount ?? productStats.low)],
              [
                "Ruptures",
                String(stats?.outOfStockCount ?? productStats.out),
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="admin-panel admin-panel-premium px-4 py-4"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-febis-gold-deep">
                  {label}
                </p>
                <p className="mt-2 font-display text-2xl font-extrabold text-febis-ink">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="admin-panel admin-panel-premium p-5">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[12rem] flex-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-febis-gold-deep">
                  Recherche
                </label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Nom, SKU, description…"
                  className="field-premium mt-1.5"
                />
              </div>
              <div className="min-w-[10rem]">
                <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-febis-gold-deep">
                  Catégorie
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="field-premium mt-1.5"
                >
                  <option value="all">Toutes</option>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {productCategoryLabel(c)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={openCreate}
                className="cta-premium shrink-0"
              >
                + Ajouter un produit
              </button>
              {products.length === 0 && !loading ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void onImportDemo()}
                  className="rounded-full border border-febis-ink/15 px-4 py-2.5 text-sm font-bold text-febis-ink/70 disabled:opacity-60"
                >
                  Importer le catalogue démo
                </button>
              ) : null}
            </div>
          </div>

          {formOpen ? (
            <div
              className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4"
              role="presentation"
            >
              <button
                type="button"
                aria-label="Fermer l’overlay"
                className="absolute inset-0 bg-febis-ink/45 backdrop-blur-[2px]"
                onClick={closeForm}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="boutique-product-form-title"
                className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-febis-ink/10 bg-[#fffdf9] shadow-[0_24px_64px_rgba(26,18,16,0.28)] sm:rounded-2xl"
              >
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-febis-ink/8 px-5 py-4">
                  <div>
                    <p
                      id="boutique-product-form-title"
                      className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep"
                    >
                      {editingId
                        ? "Modifier la fiche produit"
                        : "Nouvelle fiche produit"}
                    </p>
                    <p className="mt-0.5 text-sm text-febis-ink/50">
                      Fiche, stock et prix par variante
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-febis-ink/12 text-lg font-bold text-febis-ink/50 transition hover:border-febis-ink/25 hover:text-febis-ink"
                    aria-label="Fermer"
                  >
                    ×
                  </button>
                </div>

                <form
                  onSubmit={onSubmit}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="block text-sm font-semibold">
                        Nom *
                        <input
                          required
                          autoFocus
                          value={form.name}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, name: e.target.value }))
                          }
                          className="field-premium mt-1.5"
                          placeholder="Ex. Chemise premium"
                        />
                      </label>
                      <label className="block text-sm font-semibold">
                        Slug
                        <input
                          value={form.slug}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, slug: e.target.value }))
                          }
                          className="field-premium mt-1.5"
                          placeholder="Auto si vide"
                        />
                      </label>
                      <label className="block text-sm font-semibold">
                        Catégorie *
                        <select
                          required
                          value={form.category}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              category: e.target.value,
                            }))
                          }
                          className="field-premium mt-1.5"
                        >
                          {PRODUCT_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {productCategoryLabel(c)}
                            </option>
                          ))}
                        </select>
                      </label>
                    <label className="block text-sm font-semibold md:col-span-2">
                      <ImageUploadField
                        label="Photo produit"
                        folder="boutique"
                        value={form.photo}
                        onChange={(url) =>
                          setForm((f) => ({
                            ...f,
                            photo: url || "/images/boutique-produits.jpg",
                          }))
                        }
                        fallbackPreview="/images/boutique-produits.jpg"
                      />
                    </label>
                  </div>

                    <label className="block text-sm font-semibold">
                      Description
                      <textarea
                        rows={3}
                        value={form.description}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            description: e.target.value,
                          }))
                        }
                        className="field-premium mt-1.5"
                        placeholder="Fiche produit — matériaux, usage…"
                      />
                    </label>

                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={form.featured}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            featured: e.target.checked,
                          }))
                        }
                      />
                      Mettre à la une (vitrine)
                    </label>

                    <div className="space-y-3 border-t border-febis-ink/8 pt-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-febis-ink">
                            Variantes · stock · prix
                          </p>
                          <p className="text-xs text-febis-ink/45">
                            Chaque variante a un SKU, un stock et un prix (XOF).
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              variants: [...f.variants, emptyVariant()],
                            }))
                          }
                          className="text-xs font-bold text-febis-red hover:underline"
                        >
                          + Variante
                        </button>
                      </div>

                      {form.variants.map((row, index) => (
                        <div
                          key={index}
                          className="grid gap-2 rounded-xl border border-febis-ink/10 bg-white/60 p-3 md:grid-cols-5"
                        >
                          <input
                            value={row.sku}
                            onChange={(e) =>
                              updateVariant(index, { sku: e.target.value })
                            }
                            placeholder="SKU *"
                            required
                            className="field-premium"
                          />
                          <input
                            value={row.size}
                            onChange={(e) =>
                              updateVariant(index, { size: e.target.value })
                            }
                            placeholder="Taille"
                            className="field-premium"
                          />
                          <input
                            value={row.color}
                            onChange={(e) =>
                              updateVariant(index, { color: e.target.value })
                            }
                            placeholder="Couleur"
                            className="field-premium"
                          />
                          <input
                            value={row.stock}
                            onChange={(e) =>
                              updateVariant(index, { stock: e.target.value })
                            }
                            placeholder="Stock *"
                            required
                            inputMode="numeric"
                            className="field-premium"
                          />
                          <input
                            value={row.price}
                            onChange={(e) =>
                              updateVariant(index, { price: e.target.value })
                            }
                            placeholder="Prix XOF *"
                            required
                            inputMode="numeric"
                            className="field-premium"
                          />
                          {form.variants.length > 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setForm((f) => ({
                                  ...f,
                                  variants: f.variants.filter(
                                    (_, i) => i !== index,
                                  ),
                                }))
                              }
                              className="text-left text-xs font-bold text-febis-red md:col-span-5"
                            >
                              Retirer cette variante
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-3 border-t border-febis-ink/8 bg-white/80 px-5 py-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="cta-premium disabled:opacity-60"
                    >
                      {saving
                        ? "Enregistrement…"
                        : editingId
                          ? "Enregistrer les modifications"
                          : "Créer le produit"}
                    </button>
                    {editingId ? (
                      <button
                        type="button"
                        onClick={() => {
                          const current = products.find(
                            (p) => p.id === editingId,
                          );
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
                  </div>
                </form>
              </div>
            </div>
          ) : null}

          <div className="admin-panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-febis-ink/8 px-5 py-3">
              <p className="text-sm font-semibold text-febis-ink/70">
                {loading || pending
                  ? "Chargement…"
                  : `${products.length} produit(s)`}
              </p>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-febis-ink/8 bg-febis-smoke/40 text-[10px] font-bold uppercase tracking-[0.14em] text-febis-ink/45">
                  <tr>
                    <th className="px-5 py-3">Produit</th>
                    <th className="px-3 py-3">Catégorie</th>
                    <th className="px-3 py-3">Stock</th>
                    <th className="px-3 py-3">Prix dès</th>
                    <th className="px-3 py-3">Variantes</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-febis-ink/8">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className={cn(
                        "align-top transition hover:bg-febis-cream/35",
                        editingId === product.id && "bg-febis-red/5",
                      )}
                    >
                      <td className="px-5 py-4">
                        <div className="flex gap-3">
                          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-febis-ink/10 bg-white">
                            <Image
                              src={product.photo || "/images/boutique-produits.jpg"}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </span>
                          <div>
                            <p className="font-display text-base font-bold text-febis-ink">
                              {product.name}
                            </p>
                            <p className="text-xs text-febis-ink/40">
                              /{product.slug}
                              {product.featured ? " · À la une" : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-febis-ink/65">
                        {productCategoryLabel(product.category)}
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold",
                            stockTone(product.stockTotal),
                          )}
                        >
                          {product.stockTotal} · {stockLabel(product.stockTotal)}
                        </span>
                      </td>
                      <td className="px-3 py-4 font-bold text-febis-red">
                        {formatXof(product.priceFrom)}
                      </td>
                      <td className="px-3 py-4 text-xs text-febis-ink/50">
                        {product.variants.length} ·{" "}
                        {product.variants
                          .slice(0, 2)
                          .map((v) => v.sku)
                          .join(", ")}
                        {product.variants.length > 2 ? "…" : ""}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(product)}
                            className="rounded-full border border-febis-ink/15 px-3 py-1.5 text-xs font-bold text-febis-ink/75 hover:border-febis-red/30 hover:text-febis-red"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDelete(product)}
                            className="rounded-full border border-febis-red/25 px-3 py-1.5 text-xs font-bold text-febis-red"
                          >
                            Supprimer
                          </button>
                          <Link
                            href={`/boutique/${product.slug}`}
                            target="_blank"
                            className="rounded-full border border-febis-ink/10 px-3 py-1.5 text-xs font-bold text-febis-ink/45"
                          >
                            Voir ↗
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-febis-ink/8 md:hidden">
              {products.map((product) => (
                <div key={product.id} className="px-4 py-4">
                  <div className="flex gap-3">
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-febis-ink/10">
                      <Image
                        src={product.photo || "/images/boutique-produits.jpg"}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-bold text-febis-ink">
                        {product.name}
                      </p>
                      <p className="text-sm text-febis-ink/55">
                        {productCategoryLabel(product.category)} · dès{" "}
                        {formatXof(product.priceFrom)}
                      </p>
                      <span
                        className={cn(
                          "mt-1.5 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold",
                          stockTone(product.stockTotal),
                        )}
                      >
                        Stock {product.stockTotal}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(product)}
                      className="rounded-full border border-febis-ink/15 px-3 py-1.5 text-xs font-bold"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDelete(product)}
                      className="rounded-full border border-febis-red/25 px-3 py-1.5 text-xs font-bold text-febis-red"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {!loading && products.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-febis-ink/50">
                  Aucun produit en base. Ajoutez une fiche ou importez le
                  catalogue démo.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={openCreate}
                    className="cta-premium"
                  >
                    + Ajouter un produit
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void onImportDemo()}
                    className="rounded-full border border-febis-ink/15 px-4 py-2.5 text-sm font-bold disabled:opacity-60"
                  >
                    Importer le catalogue démo
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {stats ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Commandes", String(stats.ordersCount)],
                ["CA (hors annulées)", formatXof(stats.revenue)],
                ["Produits", String(stats.productsCount)],
                [
                  "Stock bas / rupture",
                  `${stats.lowStockCount} / ${stats.outOfStockCount}`,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="admin-panel admin-panel-premium px-4 py-4"
                >
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

          <div className="admin-panel admin-panel-premium p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="N° commande, client, email…"
                className="field-premium"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="field-premium"
              >
                <option value="all">Tous statuts</option>
                <option value="en_attente">En attente</option>
                <option value="confirmee">Confirmée</option>
                <option value="expediee">Expédiée</option>
                <option value="livree">Livrée</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>
          </div>

          <div className="admin-panel overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-febis-mist/80 text-[11px] uppercase tracking-wider text-febis-ink/55">
                <tr>
                  <th className="px-4 py-3">Commande</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-febis-ink/8">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/60">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-febis-ink">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-febis-ink/40">
                        {new Date(order.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-febis-ink">
                        {order.clientName}
                      </p>
                      <p className="text-xs text-febis-ink/45">
                        {order.clientEmail}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-bold text-febis-red">
                      {formatXof(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-febis-mist px-2.5 py-1 text-[11px] font-bold">
                        {orderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openOrder(order)}
                        className="rounded-full border border-febis-ink/15 px-3 py-1.5 text-xs font-bold"
                      >
                        Modifier
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-febis-ink/50"
                    >
                      Aucune commande pour le moment.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            {(loading || pending) && orders.length === 0 ? (
              <p className="px-5 py-6 text-sm text-febis-ink/50">
                Chargement…
              </p>
            ) : null}
          </div>
        </div>
      )}

      <AdminFormOverlay
        open={orderOpen && Boolean(selectedOrder)}
        title="Détail commande"
        subtitle={
          selectedOrder
            ? `${selectedOrder.orderNumber} · ${selectedOrder.clientName}`
            : undefined
        }
        onClose={closeOrder}
        footer={
          <>
            <button
              type="button"
              onClick={closeOrder}
              className="rounded-full border border-febis-ink/15 px-4 py-2.5 text-sm font-bold"
            >
              Fermer
            </button>
            <button
              type="button"
              disabled={orderSaving || !selectedOrder}
              onClick={() => void onSaveOrderStatus()}
              className="cta-premium ml-auto disabled:opacity-60"
            >
              {orderSaving ? "Enregistrement…" : "Enregistrer le statut"}
            </button>
          </>
        }
      >
        {selectedOrder ? (
          <div className="space-y-4">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <span className="font-bold text-febis-ink/50">Email</span>
                <br />
                {selectedOrder.clientEmail}
              </p>
              <p>
                <span className="font-bold text-febis-ink/50">Téléphone</span>
                <br />
                {selectedOrder.clientPhone}
              </p>
              <p className="sm:col-span-2">
                <span className="font-bold text-febis-ink/50">Livraison</span>
                <br />
                {selectedOrder.deliveryAddress}
              </p>
              {selectedOrder.message ? (
                <p className="sm:col-span-2">
                  <span className="font-bold text-febis-ink/50">Message</span>
                  <br />
                  {selectedOrder.message}
                </p>
              ) : null}
            </div>
            <ul className="space-y-2 rounded-xl border border-febis-ink/8 bg-white/60 p-4 text-sm">
              {selectedOrder.lines.map((line) => (
                <li
                  key={`${selectedOrder.id}-${line.sku}`}
                  className="flex justify-between gap-3"
                >
                  <span>
                    {line.quantity}× {line.productName} ({variantLabel(line)})
                  </span>
                  <span className="font-semibold">
                    {formatXof(line.lineTotal)}
                  </span>
                </li>
              ))}
              <li className="flex justify-between border-t border-febis-ink/8 pt-2 font-bold text-febis-red">
                <span>Total</span>
                <span>{formatXof(selectedOrder.totalAmount)}</span>
              </li>
            </ul>
            <label className="block text-sm font-semibold">
              Statut
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="field-premium mt-2"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {orderStatusLabel(s)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </AdminFormOverlay>
    </>
  );
}

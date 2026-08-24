"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState, useTransition } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import {
  formatXof,
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

const emptyVariant = () => ({
  sku: "",
  size: "",
  color: "",
  stock: "0",
  price: "0",
});

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
  const [creating, setCreating] = useState(false);
  const [variants, setVariants] = useState([emptyVariant()]);
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
        const res = await fetch(`/api/admin/boutique?${params}`);
        const json = (await res.json()) as {
          products?: SerializedProduct[];
          error?: string;
        };
        if (!res.ok) throw new Error(json.error ?? "Erreur");
        setProducts(json.products ?? []);
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

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/admin/boutique", {
        method: "POST",
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
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Création impossible");
      event.currentTarget.reset();
      setVariants([emptyVariant()]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setCreating(false);
    }
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
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Module Boutique"
        description="Fiches produits, variantes (taille/couleur), stock & prix, commandes et historique des ventes."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            ["produits", "Produits & stock"],
            ["ventes", "Commandes & ventes"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
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

      {tab === "produits" ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <div className="admin-panel admin-panel-premium p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
                Recherche
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Nom, SKU…"
                  className="field-premium"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="field-premium"
                >
                  <option value="all">Toutes catégories</option>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {productCategoryLabel(c)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-panel overflow-hidden">
              <div className="border-b border-febis-ink/8 px-5 py-3 text-sm font-semibold text-febis-ink/70">
                {loading || pending
                  ? "Chargement…"
                  : `${products.length} produit(s)`}
              </div>
              <div className="divide-y divide-febis-ink/8">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/admin/dashboard/boutique/${product.id}`}
                    className="flex items-start justify-between gap-4 px-5 py-4 transition hover:bg-febis-cream/40"
                  >
                    <div>
                      <p className="font-display text-lg font-bold text-febis-ink">
                        {product.name}
                      </p>
                      <p className="text-sm text-febis-ink/55">
                        {productCategoryLabel(product.category)} ·{" "}
                        {product.variants.length} variante(s) · stock{" "}
                        {product.stockTotal}
                      </p>
                      <p className="mt-1 text-xs text-febis-ink/40">
                        {product.variants
                          .slice(0, 3)
                          .map((v) => `${v.sku} (${variantLabel(v)})`)
                          .join(" · ")}
                        {product.variants.length > 3 ? "…" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-febis-red">
                        dès {formatXof(product.priceFrom)}
                      </p>
                      {product.featured ? (
                        <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wide text-febis-orange">
                          À la une
                        </span>
                      ) : null}
                    </div>
                  </Link>
                ))}
                {!loading && products.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-febis-ink/50">
                    Aucun produit — créez-en un à droite, ou lancez{" "}
                    <code className="text-xs">npm run seed</code>.
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <form
            onSubmit={onCreate}
            className="admin-panel admin-panel-premium h-fit space-y-3 p-5"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
              Nouveau produit
            </p>
            <input name="name" required placeholder="Nom" className="field-premium" />
            <input name="slug" placeholder="Slug (auto si vide)" className="field-premium" />
            <select name="category" required className="field-premium" defaultValue="mode">
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {productCategoryLabel(c)}
                </option>
              ))}
            </select>
            <textarea
              name="description"
              rows={3}
              placeholder="Description"
              className="field-premium"
            />
            <input
              name="photo"
              placeholder="Photo URL (/images/...)"
              className="field-premium"
              defaultValue="/images/boutique-produits.jpg"
            />
            <label className="flex items-center gap-2 text-sm font-semibold text-febis-ink/80">
              <input type="checkbox" name="featured" className="rounded" />
              Mettre à la une
            </label>

            <div className="space-y-3 border-t border-febis-ink/8 pt-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-febis-ink">Variantes</p>
                <button
                  type="button"
                  onClick={() => setVariants((v) => [...v, emptyVariant()])}
                  className="text-xs font-bold text-febis-red hover:underline"
                >
                  + Ajouter
                </button>
              </div>
              {variants.map((row, index) => (
                <div
                  key={index}
                  className="grid gap-2 rounded-xl border border-febis-ink/10 bg-white/60 p-3 sm:grid-cols-2"
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
                    placeholder="Prix XOF"
                    required
                    className="field-premium sm:col-span-2"
                  />
                  {variants.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setVariants((list) => list.filter((_, i) => i !== index))
                      }
                      className="text-left text-xs font-bold text-febis-red sm:col-span-2"
                    >
                      Retirer cette variante
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={creating}
              className="cta-premium w-full justify-center disabled:opacity-60"
            >
              {creating ? "Création…" : "Créer le produit"}
            </button>
          </form>
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
            <div className="border-b border-febis-ink/8 px-5 py-3 text-sm font-semibold text-febis-ink/70">
              {loading || pending
                ? "Chargement…"
                : `${orders.length} commande(s)`}
            </div>
            <div className="divide-y divide-febis-ink/8">
              {orders.map((order) => (
                <div key={order.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-bold text-febis-ink">
                        {order.orderNumber}
                      </p>
                      <p className="text-sm text-febis-ink/55">
                        {order.clientName} · {order.clientEmail} ·{" "}
                        {order.clientPhone}
                      </p>
                      <p className="mt-1 text-xs text-febis-ink/40">
                        {new Date(order.createdAt).toLocaleString("fr-FR")} ·{" "}
                        {order.deliveryAddress}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-febis-red">
                        {formatXof(order.totalAmount)}
                      </p>
                      <p className="text-xs font-bold uppercase tracking-wide text-febis-ink/45">
                        {orderStatusLabel(order.status)}
                      </p>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-febis-ink/65">
                    {order.lines.map((line) => (
                      <li key={`${order.id}-${line.sku}`}>
                        {line.quantity}× {line.productName} (
                        {variantLabel(line)}) — {formatXof(line.lineTotal)}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3">
                    <select
                      value={order.status}
                      onChange={(e) => onStatusChange(order.id, e.target.value)}
                      className="field-premium max-w-xs"
                    >
                      <option value="en_attente">En attente</option>
                      <option value="confirmee">Confirmée</option>
                      <option value="expediee">Expédiée</option>
                      <option value="livree">Livrée</option>
                      <option value="annulee">Annulée</option>
                    </select>
                  </div>
                </div>
              ))}
              {!loading && orders.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-febis-ink/50">
                  Aucune commande pour le moment.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

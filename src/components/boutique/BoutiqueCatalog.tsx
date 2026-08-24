"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useBoutiqueCart } from "@/components/boutique/BoutiqueCartProvider";
import {
  formatXof,
  productCategoryLabel,
  variantLabel,
  type SerializedProduct,
} from "@/lib/boutique-shared";
import { cn } from "@/lib/cn";

export function BoutiqueCatalog({
  products,
}: {
  products: SerializedProduct[];
}) {
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!query) return true;
      return `${p.name} ${p.description}`.toLowerCase().includes(query);
    });
  }, [products, category, q]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return Array.from(set);
  }, [products]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <label className="block max-w-md flex-1 text-sm font-semibold text-febis-ink/80">
          Rechercher
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, description…"
            className="mt-1.5 w-full rounded-xl border border-febis-ink/12 bg-white/80 px-3 py-2.5 text-sm outline-none ring-febis-red/30 focus:ring-2"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide",
              category === "all"
                ? "border-febis-red bg-febis-red text-white"
                : "border-febis-ink/15 bg-white/70 text-febis-ink/70",
            )}
          >
            Tous
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide",
                category === cat
                  ? "border-febis-red bg-febis-red text-white"
                  : "border-febis-ink/15 bg-white/70 text-febis-ink/70",
              )}
            >
              {productCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-febis-ink/15 bg-white/50 px-6 py-12 text-center text-febis-ink/55">
          Aucun produit ne correspond à votre recherche.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <article key={product.id || product.slug} className="lodging-card group overflow-hidden">
              <Link href={`/boutique/${product.slug}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={product.photo}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-febis-ink">
                    {product.stockTotal > 0
                      ? `${product.stockTotal} en stock`
                      : "Rupture"}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-febis-orange">
                    {productCategoryLabel(product.category)}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-bold text-febis-ink">
                    {product.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-febis-ink/60">
                    {product.description}
                  </p>
                  <p className="mt-4 font-display text-lg font-extrabold text-febis-red">
                    dès {formatXof(product.priceFrom)}
                  </p>
                  <p className="mt-1 text-xs text-febis-ink/45">
                    {product.variants.length} variante
                    {product.variants.length > 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductPurchasePanel({
  product,
}: {
  product: SerializedProduct;
}) {
  const { addItem } = useBoutiqueCart();
  const available = product.variants.filter((v) => v.stock > 0);
  const [sku, setSku] = useState(available[0]?.sku ?? product.variants[0]?.sku ?? "");
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState("");

  const variant = product.variants.find((v) => v.sku === sku) ?? product.variants[0];

  function onAdd() {
    if (!variant || variant.stock < 1) {
      setToast("Cette variante est en rupture.");
      return;
    }
    addItem({
      slug: product.slug,
      sku: variant.sku,
      productName: product.name,
      photo: product.photo,
      size: variant.size,
      color: variant.color,
      unitPrice: variant.price,
      maxStock: variant.stock,
      quantity,
    });
    setToast("Ajouté au panier.");
    setTimeout(() => setToast(""), 2200);
  }

  return (
    <div className="rounded-2xl border border-febis-ink/10 bg-white/80 p-6 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-febis-orange">
        {productCategoryLabel(product.category)}
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-febis-ink md:text-4xl">
        {product.name}
      </h1>
      <p className="mt-3 text-febis-ink/65">{product.description}</p>
      <p className="mt-5 font-display text-2xl font-extrabold text-febis-red">
        {variant ? formatXof(variant.price) : formatXof(product.priceFrom)}
      </p>

      <label className="mt-6 block text-sm font-semibold text-febis-ink/80">
        Variante
        <select
          value={sku}
          onChange={(e) => {
            setSku(e.target.value);
            setQuantity(1);
          }}
          className="mt-1.5 w-full rounded-xl border border-febis-ink/12 bg-white px-3 py-2.5 text-sm outline-none ring-febis-red/30 focus:ring-2"
        >
          {product.variants.map((v) => (
            <option key={v.sku} value={v.sku} disabled={v.stock < 1}>
              {variantLabel(v)} · {formatXof(v.price)}
              {v.stock < 1 ? " (rupture)" : ` · ${v.stock} dispo`}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm font-semibold text-febis-ink/80">
        Quantité
        <input
          type="number"
          min={1}
          max={variant?.stock ?? 1}
          value={quantity}
          onChange={(e) =>
            setQuantity(
              Math.max(
                1,
                Math.min(
                  Number.parseInt(e.target.value || "1", 10) || 1,
                  variant?.stock ?? 1,
                ),
              ),
            )
          }
          className="mt-1.5 w-28 rounded-xl border border-febis-ink/12 bg-white px-3 py-2.5 text-sm outline-none ring-febis-red/30 focus:ring-2"
        />
      </label>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onAdd}
          disabled={!variant || variant.stock < 1}
          className="cta-premium disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ajouter au panier
        </button>
        <Link
          href="/boutique/panier"
          className="inline-flex items-center rounded-full border border-febis-ink/15 bg-white px-5 py-2.5 text-sm font-bold text-febis-ink hover:border-febis-red/40"
        >
          Voir le panier
        </Link>
      </div>
      {toast ? (
        <p className="mt-3 text-sm font-semibold text-febis-red">{toast}</p>
      ) : null}
    </div>
  );
}

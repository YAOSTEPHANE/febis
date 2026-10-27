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
      <div className="glass-panel mb-8 flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-end md:justify-between">
        <label className="block max-w-md flex-1 text-sm font-semibold text-febis-ink/80">
          Rechercher
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, description…"
            className="field-premium mt-1.5"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn("filter-chip", category === "all" && "is-active")}
          >
            Tous
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn("filter-chip", category === cat && "is-active")}
            >
              {productCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="glass-panel px-6 py-14 text-center text-febis-ink/55">
          Aucun produit ne correspond à votre recherche.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <article
              key={product.id || product.slug}
              className="lodging-card group overflow-hidden"
            >
              <Link href={`/boutique/${product.slug}`} className="block">
                <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[4/3]">
                  <Image
                    src={product.photo}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-febis-ink/80 via-transparent to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-febis-ink backdrop-blur-sm">
                    {product.stockTotal > 0
                      ? `${product.stockTotal} en stock`
                      : "Rupture"}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-febis-amber">
                      {productCategoryLabel(product.category)}
                    </p>
                    <h3 className="mt-1 font-display text-xl font-bold text-white">
                      {product.name}
                    </h3>
                    <div className="mt-3 inline-flex items-center rounded-full border border-white/20 bg-white/15 px-3 py-1.5 backdrop-blur-md">
                      <p className="font-display text-sm font-extrabold text-white">
                        dès {formatXof(product.priceFrom)}
                      </p>
                    </div>
                  </div>
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
  const sizes = useMemo(
    () =>
      Array.from(
        new Set(
          product.variants
            .map((v) => v.size)
            .filter((s): s is string => Boolean(s)),
        ),
      ),
    [product.variants],
  );
  const colors = useMemo(
    () =>
      Array.from(
        new Set(
          product.variants
            .map((v) => v.color)
            .filter((c): c is string => Boolean(c)),
        ),
      ),
    [product.variants],
  );

  const available = product.variants.filter((v) => v.stock > 0);
  const [size, setSize] = useState(() => available[0]?.size ?? sizes[0] ?? "");
  const [color, setColor] = useState(() => available[0]?.color ?? colors[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState("");

  const matching = useMemo(() => {
    return (
      product.variants.find(
        (v) =>
          (!size || v.size === size) &&
          (!color || v.color === color),
      ) ??
      product.variants.find((v) => v.size === size) ??
      product.variants[0]
    );
  }, [product.variants, size, color]);

  const variant = matching;

  function stockFor(sizeVal: string, colorVal: string) {
    return (
      product.variants.find((v) => v.size === sizeVal && v.color === colorVal)
        ?.stock ?? 0
    );
  }

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
    <div className="glass-panel sticky top-24 p-5 sm:p-6 md:p-7">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-febis-orange">
        {productCategoryLabel(product.category)}
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-febis-ink md:text-4xl">
        {product.name}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-febis-ink/65 sm:text-base">
        {product.description}
      </p>
      <p className="mt-5 font-display text-2xl font-extrabold text-febis-red md:text-3xl">
        {variant ? formatXof(variant.price) : formatXof(product.priceFrom)}
      </p>
      {variant ? (
        <p className="mt-1 text-xs font-semibold text-febis-ink/45">
          SKU {variant.sku} · {variant.stock > 0 ? `${variant.stock} dispo` : "Rupture"}
        </p>
      ) : null}

      {colors.length > 0 ? (
        <div className="mt-6">
          <p className="text-sm font-semibold text-febis-ink/80">Couleur</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {colors.map((c) => {
              const ok = product.variants.some(
                (v) => v.color === c && (!size || v.size === size) && v.stock > 0,
              );
              return (
                <button
                  key={c}
                  type="button"
                  disabled={!ok && size !== ""}
                  onClick={() => {
                    setColor(c);
                    setQuantity(1);
                  }}
                  className={cn(
                    "filter-chip",
                    color === c && "is-active",
                    !ok && "opacity-40",
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {sizes.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-semibold text-febis-ink/80">Taille</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map((s) => {
              const stock = color ? stockFor(s, color) : product.variants.find((v) => v.size === s)?.stock ?? 0;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={stock < 1}
                  onClick={() => {
                    setSize(s);
                    setQuantity(1);
                  }}
                  className={cn(
                    "inline-flex min-w-11 items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-bold transition focus-ring-premium",
                    size === s
                      ? "border-febis-red bg-febis-red text-white"
                      : "border-febis-ink/12 bg-white/80 text-febis-ink hover:border-febis-red/40",
                    stock < 1 && "cursor-not-allowed opacity-35",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <label className="mt-6 block text-sm font-semibold text-febis-ink/80">
          Variante
          <select
            value={variant?.sku ?? ""}
            onChange={(e) => {
              const next = product.variants.find((v) => v.sku === e.target.value);
              if (next) {
                setSize(next.size ?? "");
                setColor(next.color ?? "");
                setQuantity(1);
              }
            }}
            className="field-premium mt-1.5"
          >
            {product.variants.map((v) => (
              <option key={v.sku} value={v.sku} disabled={v.stock < 1}>
                {variantLabel(v)} · {formatXof(v.price)}
                {v.stock < 1 ? " (rupture)" : ` · ${v.stock} dispo`}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="mt-5 block text-sm font-semibold text-febis-ink/80">
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
          className="field-premium mt-1.5 w-28"
        />
      </label>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
          className="inline-flex items-center justify-center rounded-full border border-febis-ink/15 bg-white/80 px-5 py-2.5 text-sm font-bold text-febis-ink transition hover:border-febis-red/40 focus-ring-premium"
        >
          Voir le panier
        </Link>
      </div>
      {toast ? (
        <p
          className={cn(
            "mt-3 status-banner",
            toast.includes("rupture") ? "is-error" : "is-success",
          )}
          role="status"
        >
          {toast}
        </p>
      ) : null}
    </div>
  );
}

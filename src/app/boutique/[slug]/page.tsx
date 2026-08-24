import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductPurchasePanel } from "@/components/boutique/BoutiqueCatalog";
import { getPublicProductBySlug, listPublicProducts } from "@/lib/boutique-data";
import { formatXof, variantLabel } from "@/lib/boutique-shared";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  if (!product) return { title: "Produit — Boutique FEBiS" };
  return {
    title: `${product.name} — Boutique FEBiS`,
    description: product.description,
  };
}

export default async function BoutiqueProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  if (!product) notFound();

  const related = (await listPublicProducts({ category: product.category }))
    .filter((p) => p.slug !== product.slug)
    .slice(0, 3);

  return (
    <section className="pt-24 pb-16 md:pb-24">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Link
          href="/boutique"
          className="text-sm font-bold text-febis-red hover:underline"
        >
          ← Catalogue
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-febis-ink/10">
            <Image
              src={product.photo}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <ProductPurchasePanel product={product} />
        </div>

        <div className="mt-10 overflow-x-auto rounded-2xl border border-febis-ink/10 bg-white/70">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-febis-ink/10 text-[11px] font-bold uppercase tracking-wide text-febis-ink/50">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Variante</th>
                <th className="px-4 py-3">Prix</th>
                <th className="px-4 py-3">Stock</th>
              </tr>
            </thead>
            <tbody>
              {product.variants.map((v) => (
                <tr key={v.sku} className="border-b border-febis-ink/6">
                  <td className="px-4 py-3 font-mono text-xs">{v.sku}</td>
                  <td className="px-4 py-3">{variantLabel(v)}</td>
                  <td className="px-4 py-3 font-semibold text-febis-red">
                    {formatXof(v.price)}
                  </td>
                  <td className="px-4 py-3">
                    {v.stock > 0 ? v.stock : "Rupture"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {related.length > 0 ? (
          <div className="mt-14">
            <h2 className="font-display text-2xl font-extrabold text-febis-ink">
              Dans la même catégorie
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/boutique/${p.slug}`}
                  className="rounded-2xl border border-febis-ink/10 bg-white/70 p-4 hover:border-febis-red/30"
                >
                  <p className="font-display text-lg font-bold text-febis-ink">
                    {p.name}
                  </p>
                  <p className="mt-1 text-sm text-febis-red">
                    dès {formatXof(p.priceFrom)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

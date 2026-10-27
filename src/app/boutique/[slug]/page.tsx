import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductPurchasePanel } from "@/components/boutique/BoutiqueCatalog";
import { getPublicProductBySlug, listPublicProducts } from "@/lib/boutique-data";
import { formatXof } from "@/lib/boutique-shared";

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
      <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-febis-ink/40">
          <Link href="/boutique" className="hover:text-febis-red">
            Boutique
          </Link>
          <span className="mx-2">/</span>
          <span className="text-febis-ink/70">{product.name}</span>
        </p>

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.35rem] border border-febis-ink/8 sm:aspect-[4/3] lg:sticky lg:top-24">
            <Image
              src={product.photo}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-febis-ink/25 to-transparent" />
          </div>
          <ProductPurchasePanel product={product} />
        </div>

        {related.length > 0 ? (
          <div className="mt-16">
            <h2 className="font-display text-2xl font-extrabold text-febis-ink">
              Dans la même catégorie
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/boutique/${p.slug}`}
                  className="glass-panel is-interactive group overflow-hidden p-0"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={p.photo}
                      alt={p.name}
                      fill
                      sizes="33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-display text-lg font-bold text-febis-ink">
                      {p.name}
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-febis-red">
                      dès {formatXof(p.priceFrom)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

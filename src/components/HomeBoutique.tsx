import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import {
  BOUTIQUE_PROCESS,
  formatXof,
  type PublicProduct,
} from "@/lib/boutique";

export function HomeBoutique({ products }: { products: PublicProduct[] }) {
  const preview = products.filter((p) => p.featured).slice(0, 3);
  const cards = preview.length > 0 ? preview : products.slice(0, 3);

  return (
    <section id="boutique" className="relative overflow-hidden py-16 md:py-24">
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-febis-red/8 blur-3xl" />
      <div className="absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-febis-gold/12 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-febis-red">
            Module CDC · Boutique
          </p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="font-display text-4xl font-extrabold tracking-tight text-febis-ink md:text-5xl">
                Produits & variantes.{" "}
                <span className="text-gold-sheen">Panier en ligne.</span>
              </h2>
              <p className="mt-4 text-lg text-febis-ink/65">
                Fiches, stock, prix, tailles/couleurs, tunnel de commande et
                historique des ventes — le parcours commerce FEBiS.
              </p>
            </div>
            <Link
              href="/boutique"
              className="text-sm font-bold text-febis-red hover:underline"
            >
              Ouvrir la boutique →
            </Link>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BOUTIQUE_PROCESS.map((step, index) => (
            <Reveal key={step.title} delay={index * 0.05}>
              <div className="h-full border-l-2 border-febis-orange/80 bg-white/50 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-febis-orange">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-display text-lg font-bold text-febis-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-febis-ink/60">
                  {step.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {cards.map((product, index) => (
            <Reveal key={product.slug} delay={index * 0.08}>
              <article className="lodging-card group overflow-hidden">
                <Link href="/boutique" className="block">
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
                    <h3 className="font-display text-xl font-bold text-febis-ink">
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
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

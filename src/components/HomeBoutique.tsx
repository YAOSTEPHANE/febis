import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { formatXof, type PublicProduct } from "@/lib/boutique";

export function HomeBoutique({ products }: { products: PublicProduct[] }) {
  const featured =
    products.find((p) => p.featured) ?? products[0] ?? null;
  const rest = products
    .filter((p) => p.slug !== featured?.slug)
    .slice(0, 4);

  if (!featured) return null;

  return (
    <section id="boutique" className="section-pad relative overflow-hidden">
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-febis-red/8 blur-3xl" />
      <div className="absolute -right-16 bottom-8 h-64 w-64 rounded-full bg-febis-gold/12 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 xs:px-5 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-7 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between md:mb-10">
            <div className="min-w-0 max-w-2xl">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-febis-red sm:text-sm">
                04 · Boutique
              </p>
              <h2 className="font-display text-[clamp(1.45rem,4.5vw,2.5rem)] font-extrabold tracking-tight text-febis-ink">
                Produits prêts à{" "}
                <span className="text-gold-sheen">commander</span>
              </h2>
              <p className="mt-3 text-sm text-febis-ink/65 sm:text-base">
                Variantes, stock et panier — le parcours commerce FEBiS.
              </p>
            </div>
            <Link href="/boutique" className="shrink-0 text-sm font-bold text-febis-red hover:underline">
              Ouvrir la boutique →
            </Link>
          </div>
        </Reveal>

        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal>
            <Link
              href={`/boutique/${featured.slug}`}
              className="lodging-card group relative block min-h-[260px] overflow-hidden xs:min-h-[300px] sm:min-h-[360px]"
            >
              <Image
                src={featured.photo}
                alt={featured.name}
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-febis-ink/90 via-febis-ink/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-febis-amber">
                  Coup de cœur · {featured.stockTotal} en stock
                </p>
                <h3 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl">
                  {featured.name}
                </h3>
                <p className="mt-2 line-clamp-2 max-w-md text-sm text-white/70">
                  {featured.description}
                </p>
                <p className="mt-4 font-display text-xl font-extrabold text-white">
                  dès {formatXof(featured.priceFrom)}
                </p>
              </div>
            </Link>
          </Reveal>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {rest.map((product, index) => (
              <Reveal key={product.slug} delay={0.05 + index * 0.04}>
                <Link
                  href={`/boutique/${product.slug}`}
                  className="glass-panel is-interactive group flex items-center gap-3 p-2.5 sm:p-3"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-20">
                    <Image
                      src={product.photo}
                      alt={product.name}
                      fill
                      sizes="80px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-base font-bold text-febis-ink">
                      {product.name}
                    </h3>
                    <p className="mt-0.5 text-sm font-extrabold text-febis-red">
                      dès {formatXof(product.priceFrom)}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

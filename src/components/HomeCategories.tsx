import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { categoryLabel } from "@/lib/residences";
import type { CategoryContent } from "@/lib/homepage-content";

export function HomeCategories({
  categories,
}: {
  categories: CategoryContent[];
}) {
  return (
    <section id="categories" className="relative pt-8 pb-10 md:pt-10 md:pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-febis-red">
                Catégories
              </p>
              <h2 className="font-display max-w-2xl text-[1.7rem] font-extrabold tracking-tight text-febis-ink sm:text-3xl md:text-4xl">
                Choisissez votre{" "}
                <span className="text-gold-sheen">type de logement</span>
              </h2>
            </div>
            <p className="hidden max-w-sm text-sm text-febis-ink/60 lg:block">
              Appartement, studio, villa ou suite — chaque catégorie FEBiS répond
              à un usage précis.
            </p>
          </div>
        </Reveal>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:mt-8 lg:grid-cols-4 lg:gap-5">
          {categories.map((cat, index) => (
            <Reveal key={cat.key} delay={index * 0.08} className="h-full min-w-0">
              <Link
                href={`/residences?categorie=${cat.key}`}
                className="category-card group block h-full"
              >
                <div className="relative aspect-[3/4] overflow-hidden sm:aspect-[4/5]">
                  <Image
                    src={cat.image}
                    alt={categoryLabel(cat.key)}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-febis-ink/85 via-febis-ink/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 lg:p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-febis-amber sm:text-[11px] sm:tracking-[0.18em]">
                      Dès {cat.from} XOF
                    </p>
                    <h3 className="mt-1 font-display text-lg font-bold text-white sm:text-xl lg:text-2xl">
                      {categoryLabel(cat.key)}
                    </h3>
                    <p className="mt-2 hidden text-sm leading-relaxed text-white/75 lg:line-clamp-3 lg:block">
                      {cat.description}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-white transition-transform duration-300 group-hover:translate-x-1 sm:mt-4 sm:gap-2 sm:text-sm">
                      Voir
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path
                          d="M5 12h14M13 6l6 6-6 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

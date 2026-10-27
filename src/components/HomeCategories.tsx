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
  const [featured, ...rest] = categories;
  if (!featured) return null;

  return (
    <section id="categories" className="section-pad relative">
      <div className="mx-auto max-w-7xl px-4 xs:px-5 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-7 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between md:mb-10">
            <div className="min-w-0">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-febis-red sm:text-sm">
                02 · Affiner
              </p>
              <h2 className="font-display max-w-2xl text-[clamp(1.45rem,4.5vw,2.5rem)] font-extrabold tracking-tight text-febis-ink">
                Quel{" "}
                <span className="text-gold-sheen">type de séjour</span> ?
              </h2>
            </div>
            <p className="hidden max-w-xs text-sm leading-relaxed text-febis-ink/55 lg:block">
              Après la sélection éditoriale — filtrez par appartement, studio,
              villa ou suite.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-3 xs:gap-4 lg:grid-cols-[1.35fr_0.85fr] lg:gap-5">
          <Reveal>
            <Link
              href={`/residences?categorie=${featured.key}`}
              className="category-card group relative block min-h-[240px] overflow-hidden xs:min-h-[280px] sm:min-h-[340px] md:min-h-[400px] lg:min-h-[460px]"
            >
              <Image
                src={featured.image}
                alt={categoryLabel(featured.key)}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-febis-ink/90 via-febis-ink/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 xs:p-5 sm:p-7 md:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-febis-amber xs:text-[11px]">
                  Dès {featured.from} XOF · Phare
                </p>
                <h3 className="mt-2 font-display text-[1.65rem] font-extrabold text-white xs:text-3xl sm:text-4xl">
                  {categoryLabel(featured.key)}
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-white/75 sm:mt-3 sm:text-base">
                  {featured.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-white transition-transform duration-300 group-hover:translate-x-1 sm:mt-5">
                  Explorer
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
            </Link>
          </Reveal>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-1">
            {rest.map((cat, index) => (
              <Reveal key={cat.key} delay={0.06 + index * 0.06}>
                <Link
                  href={`/residences?categorie=${cat.key}`}
                  className="glass-panel is-interactive group flex h-full min-h-[96px] overflow-hidden xs:min-h-[108px] sm:min-h-[130px] lg:min-h-0"
                >
                  <div className="relative w-[32%] max-w-[7.5rem] shrink-0 overflow-hidden sm:w-[40%] sm:max-w-none lg:w-36">
                    <Image
                      src={cat.image}
                      alt={categoryLabel(cat.key)}
                      fill
                      sizes="140px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center p-3.5 xs:p-4 sm:p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-febis-orange">
                      Dès {cat.from} XOF
                    </p>
                    <h3 className="mt-1 truncate font-display text-base font-bold text-febis-ink sm:text-lg lg:text-xl">
                      {categoryLabel(cat.key)}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-febis-ink/55 sm:text-sm">
                      {cat.description}
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

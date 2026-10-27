import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { StatusBadge } from "@/components/residences/StatusBadge";
import { categoryLabel, formatXof } from "@/lib/residences";
import { listPublicLodgings } from "@/lib/residences-data";

export async function HomeResidences() {
  const lodgings = await listPublicLodgings();
  const featured = lodgings[0];
  const side = lodgings.slice(1, 4);

  if (!featured) return null;

  const photo = featured.photos[0] ?? "/images/pole-residences.jpg";

  return (
    <section
      id="residences-accueil"
      className="section-band-mist section-pad relative"
    >
      <div className="mx-auto max-w-7xl px-4 xs:px-5 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-7 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between md:mb-10">
            <div className="min-w-0">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-febis-red sm:text-sm">
                01 · Résidences
              </p>
              <h2 className="font-display max-w-2xl text-[clamp(1.45rem,4.5vw,2.5rem)] font-extrabold tracking-tight text-febis-ink">
                Sélection{" "}
                <span className="text-gold-sheen">éditoriale</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm text-febis-ink/65 sm:text-base">
                L’offre la plus demandée en tête, puis un accès rapide aux autres
                fiches.
              </p>
            </div>
            <Link
              href="/residences"
              className="cta-ghost w-full justify-center !border-febis-ink/15 !text-febis-ink sm:w-auto"
            >
              Tout le catalogue
            </Link>
          </div>
        </Reveal>

        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1.4fr_0.9fr]">
          <Reveal>
            <article className="lodging-card group overflow-hidden">
              <Link href={`/residences/${featured.slug}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden xs:aspect-[16/11] sm:aspect-[16/10]">
                  <Image
                    src={photo}
                    alt={featured.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-febis-ink/85 via-febis-ink/20 to-transparent" />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2 xs:left-4 xs:top-4 sm:left-5 sm:top-5">
                    <StatusBadge status={featured.status} />
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-febis-ink">
                      {categoryLabel(featured.category)}
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4 xs:p-5 sm:p-7">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/65 xs:text-xs">
                      {featured.neighborhood}
                    </p>
                    <h3 className="mt-1 font-display text-[1.35rem] font-extrabold text-white xs:text-2xl sm:text-3xl md:text-4xl">
                      {featured.title}
                    </h3>
                    <p className="mt-2 max-w-lg line-clamp-2 text-sm text-white/70 sm:mt-3">
                      {featured.description}
                    </p>
                    <p className="mt-3 font-display text-lg font-extrabold text-febis-amber xs:mt-4 xs:text-xl">
                      {formatXof(featured.pricePerNight)}
                      <span className="text-sm font-semibold text-white/55"> / nuit</span>
                    </p>
                  </div>
                </div>
              </Link>
            </article>
          </Reveal>

          <div className="flex flex-col gap-3">
            {side.map((lodging, index) => {
              const thumb = lodging.photos[0] ?? "/images/pole-residences.jpg";
              return (
                <Reveal key={lodging.slug} delay={0.08 + index * 0.05}>
                  <Link
                    href={`/residences/${lodging.slug}`}
                    className="glass-panel is-interactive group flex gap-2.5 p-2 xs:gap-3 xs:p-2.5 sm:gap-4 sm:p-3"
                  >
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl xs:h-24 xs:w-28 sm:h-28 sm:w-32">
                      <Image
                        src={thumb}
                        alt={lodging.title}
                        fill
                        sizes="128px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center py-1 pr-1 xs:pr-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-febis-orange">
                        {lodging.neighborhood}
                      </p>
                      <h3 className="mt-0.5 truncate font-display text-[0.95rem] font-bold text-febis-ink xs:text-base sm:text-lg">
                        {lodging.title}
                      </h3>
                      <p className="mt-1 text-sm font-extrabold text-febis-red">
                        {formatXof(lodging.pricePerNight)}
                        <span className="font-semibold text-febis-ink/40"> / nuit</span>
                      </p>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
            <Reveal delay={0.28}>
              <Link
                href="/residences"
                className="glass-panel is-interactive flex min-h-12 items-center justify-between px-4 py-3.5 text-sm font-bold text-febis-ink xs:px-5 xs:py-4"
              >
                Voir toutes les résidences
                <span className="text-febis-red">→</span>
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

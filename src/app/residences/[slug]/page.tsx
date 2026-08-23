import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { StatusBadge } from "@/components/residences/StatusBadge";
import { ProcessTimeline } from "@/components/residences/ProcessTimeline";
import { BookingPanel } from "@/components/residences/BookingPanel";
import { Reveal } from "@/components/Reveal";
import {
  getCalendarForSlug,
  getPublicLodgingBySlug,
} from "@/lib/residences-data";
import { FALLBACK_LODGINGS, formatXof } from "@/lib/residences";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return FALLBACK_LODGINGS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lodging = await getPublicLodgingBySlug(slug);
  if (!lodging) return { title: "Logement — FEBiS" };
  return {
    title: `${lodging.title} — Résidences FEBiS`,
    description: lodging.description,
  };
}

export default async function LodgingDetailPage({ params }: Props) {
  const { slug } = await params;
  const lodging = await getPublicLodgingBySlug(slug);
  if (!lodging) notFound();

  const now = new Date();
  const calendar = await getCalendarForSlug(
    slug,
    now.getFullYear(),
    now.getMonth() + 1,
  );

  const gallery = lodging.photos.length
    ? lodging.photos
    : ["/images/pole-residences.jpg"];

  return (
    <>
      <PublicHeader />
      <main className="pt-20">
        <section className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
          <Link
            href="/residences"
            className="text-sm font-semibold text-febis-ink/55 hover:text-febis-red"
          >
            ← Toutes les résidences
          </Link>

          <div className="mt-6 grid gap-4 md:grid-cols-[1.4fr_0.8fr] md:grid-rows-2 md:gap-3">
            <div className="relative min-h-[280px] overflow-hidden rounded-[1.4rem] md:row-span-2 md:min-h-[460px]">
              <Image
                src={gallery[0]!}
                alt={lodging.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover"
              />
            </div>
            {gallery.slice(1, 3).map((src, i) => (
              <div
                key={src}
                className="relative hidden min-h-[220px] overflow-hidden rounded-[1.2rem] md:block"
              >
                <Image
                  src={src}
                  alt={`${lodging.title} — vue ${i + 2}`}
                  fill
                  sizes="40vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <Reveal>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={lodging.status} />
                <span className="text-sm font-semibold text-febis-ink/50">
                  {lodging.location}
                </span>
              </div>
              <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-febis-ink md:text-5xl">
                {lodging.title}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-febis-ink/65">
                {lodging.longDescription}
              </p>

              <div className="mt-6 flex flex-wrap gap-6 border-y border-febis-ink/8 py-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-febis-ink/45">
                    Tarif
                  </p>
                  <p className="font-display text-2xl font-extrabold text-febis-red">
                    {formatXof(lodging.pricePerNight)}
                    <span className="text-sm font-semibold text-febis-ink/45">
                      {" "}
                      / nuit
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-febis-ink/45">
                    Acompte
                  </p>
                  <p className="font-display text-2xl font-bold text-febis-ink">
                    {lodging.depositPercent}%
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-febis-ink/45">
                    Capacité
                  </p>
                  <p className="font-display text-2xl font-bold text-febis-ink">
                    {lodging.capacity} pers.
                  </p>
                </div>
              </div>

              <h2 className="mt-8 font-display text-xl font-bold text-febis-ink">
                Équipements
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {lodging.amenities.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-febis-ink/10 bg-white/60 px-3 py-1.5 text-sm font-semibold text-febis-ink/75"
                  >
                    {item}
                  </li>
                ))}
              </ul>

              {lodging.highlights.length > 0 && (
                <>
                  <h2 className="mt-8 font-display text-xl font-bold text-febis-ink">
                    Points forts
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {lodging.highlights.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm font-semibold text-febis-ink/80"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-febis-gold-light to-febis-red" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Reveal>

            <Reveal delay={0.1}>
              <div className="rounded-[1.5rem] border border-febis-ink/8 bg-gradient-to-br from-febis-ink to-[#3a1515] p-6 text-white md:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-febis-amber">
                  Signature FEBiS
                </p>
                <p className="mt-3 font-display text-2xl font-bold leading-snug">
                  Calendrier en temps réel & parcours maîtrisé.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  Disponible · Réservé · Maintenance — puis demande, confirmation,
                  acompte, check-in/out et état des lieux.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="border-t border-febis-ink/8 bg-white/35 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <Reveal>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-febis-red">
                Disponibilité
              </p>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-febis-ink md:text-4xl">
                Calendrier & demande de séjour
              </h2>
              <p className="mt-3 max-w-2xl text-febis-ink/60">
                Cliquez une date d’arrivée puis une date de départ. Les jours
                réservés ou en maintenance ne sont pas sélectionnables.
              </p>
            </Reveal>

            <div className="mt-10">
              <BookingPanel
                lodging={lodging}
                initialYear={calendar?.year ?? now.getFullYear()}
                initialMonth={calendar?.month ?? now.getMonth() + 1}
                initialDays={calendar?.days ?? []}
              />
            </div>
          </div>
        </section>

        <ProcessTimeline activeStep="demande" />
      </main>
      <Footer />
    </>
  );
}

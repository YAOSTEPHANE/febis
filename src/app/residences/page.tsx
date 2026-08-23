import type { Metadata } from "next";
import Image from "next/image";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { LodgingCard } from "@/components/residences/LodgingCard";
import { ProcessTimeline } from "@/components/residences/ProcessTimeline";
import { Reveal } from "@/components/Reveal";
import { listPublicLodgings } from "@/lib/residences-data";
import {
  categoryLabel,
  isLodgingCategory,
} from "@/lib/residences";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Résidences meublées — FEBiS",
  description:
    "Fiches logements FEBiS : photos, tarifs, calendrier de disponibilité et demande de réservation à Abidjan.",
};

type Props = {
  searchParams: Promise<{
    destination?: string;
    arrivee?: string;
    retour?: string;
    categorie?: string;
  }>;
};

export default async function ResidencesPage({ searchParams }: Props) {
  const params = await searchParams;
  const destination = params.destination?.trim() ?? "";
  const arrivee = params.arrivee?.trim() ?? "";
  const retour = params.retour?.trim() ?? "";
  const categorie = params.categorie?.trim() ?? "";

  const all = await listPublicLodgings();
  let lodgings = all;

  if (destination) {
    lodgings = lodgings.filter((l) =>
      `${l.neighborhood} ${l.location}`
        .toLowerCase()
        .includes(destination.toLowerCase()),
    );
  }

  if (categorie && isLodgingCategory(categorie)) {
    lodgings = lodgings.filter((l) => l.category === categorie);
  }

  return (
    <>
      <PublicHeader />
      <main>
        <section className="relative min-h-[70svh] overflow-hidden bg-febis-ink pt-20">
          <div className="absolute inset-0">
            <Image
              src="/images/residences-hero.jpg"
              alt="Résidences FEBiS"
              fill
              priority
              sizes="100vw"
              className="object-cover ken-burns"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1210]/88) via-[#1a1210]/55) to-[#d71920]/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1210]/75 via-transparent to-[#1a1210]/25" />
          </div>
          <div className="fan-layers opacity-70 max-md:opacity-40" aria-hidden>
            <span />
            <span />
            <span />
          </div>

          <div className="relative mx-auto flex min-h-[70svh] max-w-7xl flex-col justify-end px-5 pb-16 md:justify-center md:px-8 md:pb-20">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-febis-amber">
              Module CDC · Résidences
            </p>
            <h1 className="font-display max-w-3xl text-[clamp(2.4rem,6vw,4.5rem)] font-extrabold leading-[0.95] tracking-tight text-white">
              Séjourner avec{" "}
              <span className="text-gold-sheen">l’exigence FEBiS</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/78 md:text-lg">
              Fiches logements, calendrier dispo / réservé / maintenance, et
              parcours complet de réservation — du premier contact à l’état des
              lieux.
            </p>
            {(destination || arrivee || retour || categorie) && (
              <p className="mt-5 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white/90 backdrop-blur">
                Recherche
                {categorie && isLodgingCategory(categorie)
                  ? ` · ${categoryLabel(categorie)}`
                  : ""}
                {destination ? ` · ${destination}` : ""}
                {arrivee ? ` · arrivée ${arrivee}` : ""}
                {retour ? ` · retour ${retour}` : ""}
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#logements" className="cta-premium">
                Voir les logements
              </a>
              <a href="#parcours" className="cta-ghost">
                Comprendre le parcours
              </a>
            </div>
          </div>
        </section>

        <section id="logements" className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <Reveal>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-febis-red">
                Catalogue
              </p>
              <h2 className="font-display max-w-2xl text-4xl font-extrabold tracking-tight text-febis-ink md:text-5xl">
                Fiches logements — photos, description, tarifs
              </h2>
              {destination || categorie ? (
                <p className="mt-3 text-febis-ink/60">
                  {lodgings.length} résultat{lodgings.length > 1 ? "s" : ""}
                  {categorie && isLodgingCategory(categorie)
                    ? ` · ${categoryLabel(categorie)}`
                    : ""}
                  {destination ? ` · « ${destination} »` : ""}
                </p>
              ) : null}
            </Reveal>

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {lodgings.length === 0 ? (
                <p className="text-febis-ink/60 md:col-span-3">
                  Aucun logement pour cette destination. Essayez une autre zone.
                </p>
              ) : (
                lodgings.map((lodging, index) => (
                  <LodgingCard
                    key={lodging.slug}
                    lodging={lodging}
                    index={index}
                  />
                ))
              )}
            </div>
          </div>
        </section>

        <div id="parcours">
          <ProcessTimeline />
        </div>
      </main>
      <Footer />
    </>
  );
}

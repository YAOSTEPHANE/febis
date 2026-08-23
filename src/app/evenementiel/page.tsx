import type { Metadata } from "next";
import Image from "next/image";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { EventQuoteBuilder } from "@/components/evenementiel/EventQuoteBuilder";
import { HomeRecentWorks } from "@/components/HomeRecentWorks";
import { listPublicEquipment } from "@/lib/evenementiel-data";
import { listTravauxAdmin } from "@/lib/homepage-data";
import { EVENT_PROCESS } from "@/lib/evenementiel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Événementiel — Location matériel FEBiS",
  description:
    "Catalogue matériel FEBiS : disponibilité temps réel, prix, cautions, devis de location, sorties/retours et pénalités.",
};

export default async function EvenementielPage() {
  const [equipment, travaux] = await Promise.all([
    listPublicEquipment(),
    listTravauxAdmin(),
  ]);
  const eventWorks = travaux.filter((w) => w.pole === "evenementiel");

  return (
    <>
      <PublicHeader />
      <main>
        <section className="relative min-h-[60svh] overflow-hidden bg-febis-ink pt-20">
          <div className="absolute inset-0">
            <Image
              src="/images/pole-eventiel.jpg"
              alt="Événementiel FEBiS"
              fill
              priority
              sizes="100vw"
              className="object-cover ken-burns"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1210]/88) via-[#1a1210]/55) to-[#d71920]/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1210]/75 via-transparent to-[#1a1210]/25" />
          </div>

          <div className="relative mx-auto flex min-h-[60svh] max-w-7xl flex-col justify-end px-5 pb-14 md:justify-center md:px-8 md:pb-16">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-febis-amber">
              Module CDC · Événementiel
            </p>
            <h1 className="font-display max-w-3xl text-[clamp(2.3rem,5.5vw,4.2rem)] font-extrabold leading-[0.95] tracking-tight text-white">
              Catalogue live.{" "}
              <span className="text-gold-sheen">Devis instantané.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/78 md:text-lg">
              Disponibilité temps réel, prix & cautions, génération de devis,
              suivi des sorties/retours et gestion des dommages.
            </p>
          </div>
        </section>

        <section className="border-b border-febis-ink/8 bg-white/40 py-12">
          <div className="mx-auto grid max-w-7xl gap-4 px-5 sm:grid-cols-2 lg:grid-cols-5 md:px-8">
            {EVENT_PROCESS.map((step, index) => (
              <Reveal key={step.title} delay={index * 0.05}>
                <div className="border-l-2 border-febis-red/70 pl-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-febis-red">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-1 font-display text-lg font-bold text-febis-ink">
                    {step.title}
                  </h2>
                  <p className="mt-1 text-sm text-febis-ink/60">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="catalogue" className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <Reveal>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-febis-red">
                Catalogue
              </p>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-febis-ink md:text-4xl">
                Matériel, stocks & devis
              </h2>
              <p className="mt-3 max-w-2xl text-febis-ink/60">
                Sélectionnez les quantités, indiquez les dates d’événement et de
                retour, puis générez votre devis de location.
              </p>
            </Reveal>

            <div className="mt-10">
              <EventQuoteBuilder equipment={equipment} />
            </div>
          </div>
        </section>

        <HomeRecentWorks
          id="realisations-event"
          items={eventWorks}
          initialFilter="evenementiel"
          showFilters={false}
          limit={3}
          subheading="Mariages, galas et réceptions accompagnés par FEBiS."
        />

        <section className="border-t border-febis-ink/8 bg-febis-ink py-14 text-white">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              Sorties, retours, dommages & pénalités
            </h2>
            <p className="mt-3 max-w-3xl text-white/70">
              Après acceptation du devis, FEBiS enregistre la sortie du matériel,
              le retour, puis les éventuels dommages avec pénalités associées
              (montant défini par article). Le suivi opérationnel est disponible
              dans l’espace pro.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}


import type { Metadata } from "next";
import Image from "next/image";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { BtpHouseQuoteBuilder } from "@/components/btp/BtpHouseQuoteBuilder";
import { HomeRecentWorks } from "@/components/HomeRecentWorks";
import { listTravauxAdmin } from "@/lib/homepage-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "BTP — Devis construction maison FEBiS",
  description:
    "Devis chantier maison FEBiS : gros œuvre, toiture, électricité, plomberie, finitions et extérieurs — chiffrage détaillé en Côte d’Ivoire.",
};

const STEPS = [
  {
    title: "Programme",
    text: "Surface, niveaux, pièces et niveau de finition.",
  },
  {
    title: "Lots chantier",
    text: "Tous les postes : fondations, béton, toiture, second œuvre…",
  },
  {
    title: "Devis",
    text: "Estimation live puis envoi à l’équipe BTP FEBiS.",
  },
  {
    title: "Contrat",
    text: "Validation du périmètre, délais et montants.",
  },
  {
    title: "Livraison",
    text: "Suivi de chantier jusqu’à la réception.",
  },
];

export default async function BtpPage() {
  const travaux = await listTravauxAdmin();
  const btpWorks = travaux.filter((w) => w.pole === "btp");

  return (
    <>
      <PublicHeader />
      <main>
        <section className="list-hero relative min-h-[60svh]">
          <div className="absolute inset-0">
            <Image
              src="/images/pole-btp.jpg"
              alt="BTP FEBiS"
              fill
              priority
              sizes="100vw"
              className="object-cover ken-burns"
            />
            <div className="list-hero-overlay" />
          </div>
          <div className="relative mx-auto flex min-h-[60svh] max-w-7xl flex-col justify-end px-5 pb-14 md:justify-center md:px-8 md:pb-16">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
              Accueil / BTP
            </p>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-febis-amber">
              Construction maison
            </p>
            <h1 className="font-display max-w-3xl text-[clamp(2.3rem,5.5vw,4.2rem)] font-extrabold leading-[0.95] tracking-tight text-white">
              Devis chantier.{" "}
              <span className="text-gold-sheen">Tous les lots.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/78 md:text-lg">
              Chiffrez fondations, gros œuvre, toiture, électricité, plomberie,
              finitions et extérieurs — puis envoyez votre devis à FEBiS.
            </p>
          </div>
        </section>

        <section className="border-b border-febis-ink/8 bg-white/30 py-10 backdrop-blur-sm md:py-12">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-4 xs:px-5 sm:grid-cols-2 sm:px-6 md:grid-cols-3 md:px-8 lg:grid-cols-5">
            {STEPS.map((step, index) => (
              <Reveal key={step.title} delay={index * 0.05}>
                <div className="glass-panel h-full p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-febis-red">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-1 font-display text-base font-bold text-febis-ink sm:text-lg">
                    {step.title}
                  </h2>
                  <p className="mt-1 text-sm text-febis-ink/60">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="devis" className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <Reveal>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-febis-red">
                Devis construction
              </p>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-febis-ink md:text-4xl">
                Maison complète, poste par poste
              </h2>
              <p className="mt-3 max-w-2xl text-febis-ink/60">
                Sélectionnez les éléments nécessaires à la construction :
                études, terrassement, béton, toiture, second œuvre, finitions et
                extérieurs. Les quantités s’adaptent à la surface et aux
                niveaux.
              </p>
            </Reveal>

            <div className="mt-10">
              <BtpHouseQuoteBuilder />
            </div>
          </div>
        </section>

        <HomeRecentWorks
          id="realisations-btp"
          items={btpWorks}
          initialFilter="btp"
          showFilters={false}
          limit={3}
          subheading="Réalisations BTP FEBiS en Côte d’Ivoire."
        />
      </main>
      <Footer />
    </>
  );
}

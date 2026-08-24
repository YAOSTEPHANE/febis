import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { BoutiqueCatalog } from "@/components/boutique/BoutiqueCatalog";
import { listPublicProducts } from "@/lib/boutique-data";
import { BOUTIQUE_PROCESS } from "@/lib/boutique";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boutique FEBiS — Produits & variantes",
  description:
    "Catalogue FEBiS : fiches produits, stock, prix, variantes taille/couleur, panier et commandes.",
};

export default async function BoutiquePage() {
  const products = await listPublicProducts();

  return (
    <>
      <section className="relative min-h-[56svh] overflow-hidden bg-febis-ink pt-20">
        <div className="absolute inset-0">
          <Image
            src="/images/pole-boutique.jpg"
            alt="Boutique FEBiS"
            fill
            priority
            sizes="100vw"
            className="object-cover ken-burns"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a1210]/88) via-[#1a1210]/55) to-[#d71920]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1210]/75 via-transparent to-[#1a1210]/25" />
        </div>
        <div className="relative mx-auto flex min-h-[56svh] max-w-7xl flex-col justify-end px-5 pb-14 md:justify-center md:px-8 md:pb-16">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-febis-amber">
            Module CDC · Boutique
          </p>
          <h1 className="font-display max-w-3xl text-[clamp(2.3rem,5.5vw,4.2rem)] font-extrabold leading-[0.95] tracking-tight text-white">
            Catalogue live.{" "}
            <span className="text-gold-sheen">Panier en ligne.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/78 md:text-lg">
            Fiches produits, variantes taille/couleur, stock & prix, tunnel de
            commande et historique des ventes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#catalogue" className="cta-premium">
              Voir le catalogue
            </Link>
            <Link
              href="/boutique/commandes"
              className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/20"
            >
              Historique commandes
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-febis-ink/8 bg-white/40 py-12">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 sm:grid-cols-2 lg:grid-cols-4 md:px-8">
          {BOUTIQUE_PROCESS.map((step, index) => (
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
            <h2 className="font-display text-3xl font-extrabold text-febis-ink md:text-4xl">
              Catalogue
            </h2>
            <p className="mt-2 max-w-2xl text-febis-ink/60">
              Choisissez une variante, ajoutez au panier, validez votre
              commande.
            </p>
          </Reveal>
          <div className="mt-10">
            <BoutiqueCatalog products={products} />
          </div>
        </div>
      </section>
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

const cards = [
  {
    title: "Résidences meublées",
    eyebrow: "Séjourner",
    description:
      "Fiches logements, calendrier dispo / réservé / maintenance et demande de réservation en ligne.",
    image: "/images/pole-residences.jpg",
    href: "/residences",
    cta: "Voir les logements",
    accent: "from-febis-red to-febis-orange",
  },
  {
    title: "BTP & chantiers",
    eyebrow: "Construire",
    description:
      "De la prospection au suivi d’avancement : devis, contrats et livraison finale.",
    image: "/images/pole-btp.jpg",
    href: "/#travaux",
    cta: "Voir les chantiers",
    accent: "from-febis-orange to-febis-amber",
  },
  {
    title: "Événementiel",
    eyebrow: "Célébrer",
    description:
      "Catalogue matériel, cautions, devis de location et suivi des sorties / retours.",
    image: "/images/pole-eventiel.jpg",
    href: "/evenementiel",
    cta: "Explorer le catalogue",
    accent: "from-febis-gold to-febis-amber",
  },
];

export function HomeCards() {
  return (
    <section id="cartes" className="relative pt-6 pb-12 md:pt-8 md:pb-16">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-febis-red/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-febis-red">
            Accès rapide
          </p>
          <h2 className="font-display max-w-2xl text-4xl font-extrabold tracking-tight text-febis-ink md:text-5xl">
            Trois portes d’entrée.{" "}
            <span className="text-gold-sheen">Une signature FEBiS.</span>
          </h2>
          <p className="mt-4 max-w-xl text-lg text-febis-ink/65">
            Choisissez votre parcours — chaque carte mène directement à l’action.
          </p>
        </Reveal>

        <div className="mt-6 grid gap-5 md:mt-8 md:grid-cols-3">
          {cards.map((card, index) => (
            <Reveal key={card.title} delay={index * 0.1}>
              <Link href={card.href} className="home-card group block h-full">
                <div className="relative aspect-[5/4] overflow-hidden">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-febis-ink/80 via-febis-ink/25 to-transparent" />
                  <div
                    className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${card.accent}`}
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                    {card.eyebrow}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5 md:p-6">
                  <h3 className="font-display text-2xl font-bold tracking-tight text-febis-ink">
                    <span className="draw-underline">{card.title}</span>
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-febis-ink/65">
                    {card.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-febis-red transition-transform duration-300 group-hover:translate-x-1">
                    {card.cta}
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
          ))}
        </div>
      </div>
    </section>
  );
}

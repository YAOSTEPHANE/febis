import Link from "next/link";
import { LodgingCard } from "@/components/residences/LodgingCard";
import { Reveal } from "@/components/Reveal";
import { listPublicLodgings } from "@/lib/residences-data";

export async function HomeResidences() {
  const lodgings = (await listPublicLodgings()).slice(0, 3);

  return (
    <section id="residences-accueil" className="section-band-mist relative pt-8 pb-12 md:pt-10 md:pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-febis-red">
                Résidences
              </p>
              <h2 className="font-display max-w-2xl text-[1.7rem] font-extrabold tracking-tight text-febis-ink sm:text-3xl md:text-4xl">
                Nos logements{" "}
                <span className="text-gold-sheen">à la une</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm text-febis-ink/65 sm:text-base">
                Photos, tarifs et disponibilité — réservez depuis la fiche.
              </p>
            </div>
            <Link
              href="/residences"
              className="text-sm font-bold text-febis-red hover:underline"
            >
              Voir toutes les résidences →
            </Link>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 md:mt-8 lg:grid-cols-3">
          {lodgings.map((lodging, index) => (
            <LodgingCard key={lodging.slug} lodging={lodging} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

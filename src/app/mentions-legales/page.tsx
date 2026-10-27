import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Mentions légales — FEBiS",
  description: "Mentions légales de la plateforme digitale FEBiS.",
};

export default function MentionsLegalesPage() {
  return (
    <>
      <PublicHeader />
      <main>
        <section className="border-b border-febis-ink/10 bg-febis-ink text-white">
          <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
              Accueil / Mentions légales
            </p>
            <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3rem)] font-extrabold tracking-tight">
              Mentions légales
            </h1>
          </div>
        </section>
        <article className="mx-auto max-w-3xl space-y-8 px-5 py-12 sm:px-8 sm:py-16 text-[15px] leading-relaxed text-febis-ink/75">
          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold text-febis-ink">
              Éditeur
            </h2>
            <p>
              FEBiS — plateforme digitale multi-activités (résidences meublées,
              BTP, événementiel, boutique) opérée en Côte d’Ivoire.
            </p>
            <p>
              Contact :{" "}
              <a
                href="mailto:contact@febis.ci"
                className="font-semibold text-febis-red hover:underline"
              >
                contact@febis.ci
              </a>
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold text-febis-ink">
              Hébergement
            </h2>
            <p>
              Application web hébergée selon l’infrastructure de déploiement
              FEBiS (environnement cloud).
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold text-febis-ink">
              Propriété intellectuelle
            </h2>
            <p>
              Le code, les contenus et les données de la plateforme restent la
              propriété exclusive de FEBiS.
            </p>
          </section>
          <p className="border-t border-febis-ink/10 pt-6 text-xs text-febis-ink/45">
            Voir aussi la{" "}
            <Link href="/confidentialite" className="underline">
              politique de confidentialité
            </Link>{" "}
            et la{" "}
            <Link href="/cookies" className="underline">
              politique cookies
            </Link>
            .
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}

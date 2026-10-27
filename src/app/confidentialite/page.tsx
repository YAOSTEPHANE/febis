import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Confidentialité — FEBiS",
  description:
    "Politique de confidentialité FEBiS : collecte et usage des données clients.",
};

export default function ConfidentialitePage() {
  return (
    <>
      <PublicHeader />
      <main>
        <section className="border-b border-febis-ink/10 bg-febis-ink text-white">
          <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
              Accueil / Confidentialité
            </p>
            <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3rem)] font-extrabold tracking-tight">
              Politique de confidentialité
            </h1>
          </div>
        </section>
        <article className="mx-auto max-w-3xl space-y-8 px-5 py-12 sm:px-8 sm:py-16 text-[15px] leading-relaxed text-febis-ink/75">
          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold text-febis-ink">
              Données collectées
            </h2>
            <p>
              Identité et coordonnées (nom, email, téléphone), messages de
              contact, demandes de réservation, devis événementiel, commandes
              boutique, prospects BTP, et préférences cookies.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold text-febis-ink">
              Finalités
            </h2>
            <p>
              Traitement des demandes commerciales, gestion des séjours,
              locations, ventes, chantiers, facturation, paiements et support
              client. Les données alimentent le CRM central FEBiS.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold text-febis-ink">
              Conservation & sécurité
            </h2>
            <p>
              Accès restreint par rôles (Admin, Direction, Compta,
              Opérationnels), mots de passe hachés, sessions sécurisées. Les
              données sont conservées le temps nécessaire à la relation
              commerciale et aux obligations légales.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold text-febis-ink">
              Vos droits
            </h2>
            <p>
              Pour toute demande d’accès, rectification ou suppression :{" "}
              <a
                href="mailto:contact@febis.ci"
                className="font-semibold text-febis-red hover:underline"
              >
                contact@febis.ci
              </a>
              .
            </p>
          </section>
          <p className="border-t border-febis-ink/10 pt-6 text-xs text-febis-ink/45">
            Dernière mise à jour : 27 octobre 2026 ·{" "}
            <Link href="/cookies" className="underline">
              Cookies
            </Link>
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { CookiePreferencesButton } from "@/components/CookiePreferencesButton";
import { COOKIE_CATEGORIES } from "@/lib/cookie-consent";

export const metadata: Metadata = {
  title: "Politique cookies — FEBiS",
  description:
    "Comment FEBiS utilise les cookies sur sa plateforme digitale en Côte d’Ivoire : finalités, durée et gestion de vos choix.",
};

export default function CookiesPage() {
  return (
    <>
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden border-b border-febis-ink/10 bg-febis-ink text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(ellipse 50% 60% at 10% 20%, rgba(215,25,32,0.4), transparent 55%), radial-gradient(ellipse 40% 50% at 90% 80%, rgba(212,168,75,0.25), transparent 50%)",
            }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
              Accueil / Cookies
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.28em] text-febis-amber">
              Confidentialité
            </p>
            <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.05] tracking-tight">
              Politique cookies
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/72 sm:text-lg">
              Cette page explique quels cookies FEBiS dépose sur votre appareil,
              pourquoi, et comment les contrôler.
            </p>
          </div>
        </section>

        <article className="mx-auto max-w-3xl space-y-10 px-5 py-12 sm:px-8 sm:py-16">
          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-febis-ink">
              Qu’est-ce qu’un cookie ?
            </h2>
            <p className="text-[15px] leading-relaxed text-febis-ink/75">
              Un cookie est un petit fichier enregistré sur votre navigateur
              lorsque vous consultez un site. Il permet de mémoriser des
              informations (session, préférences, mesure d’audience) pendant une
              durée limitée.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-febis-ink">
              Qui est responsable ?
            </h2>
            <p className="text-[15px] leading-relaxed text-febis-ink/75">
              FEBiS — Côte d’Ivoire — opère la plateforme digitale (résidences,
              BTP, événementiel, boutique). Pour toute question relative aux
              cookies ou à vos données :{" "}
              <a
                href="mailto:contact@febis.ci"
                className="font-semibold text-febis-red underline-offset-2 hover:underline"
              >
                contact@febis.ci
              </a>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-2xl font-bold tracking-tight text-febis-ink">
              Catégories utilisées
            </h2>
            <ul className="space-y-4">
              {COOKIE_CATEGORIES.map((category) => (
                <li
                  key={category.id}
                  className="rounded-2xl border border-febis-ink/8 bg-white/70 p-5 shadow-[0_1px_0_rgba(26,18,16,0.04)]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-bold text-febis-ink">
                      {category.title}
                    </h3>
                    {category.required ? (
                      <span className="rounded-full bg-febis-amber/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-febis-gold-deep">
                        Toujours actifs
                      </span>
                    ) : (
                      <span className="rounded-full bg-febis-mist px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-febis-ink/55">
                        Sur consentement
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[15px] leading-relaxed text-febis-ink/70">
                    {category.description}
                  </p>
                  <p className="mt-2 text-sm text-febis-ink/45">
                    Exemples : {category.examples.join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-febis-ink">
              Durée de conservation
            </h2>
            <p className="text-[15px] leading-relaxed text-febis-ink/75">
              Votre choix de consentement est conservé jusqu’à 12 mois. Passé ce
              délai, ou si vous effacez les données du navigateur, la bannière
              vous sera présentée à nouveau. Les cookies de session
              administrateur expirent à la déconnexion ou selon la durée fixée
              côté serveur.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-febis-ink">
              Gérer vos préférences
            </h2>
            <p className="text-[15px] leading-relaxed text-febis-ink/75">
              Vous pouvez accepter, refuser ou personnaliser les cookies non
              essentiels à tout moment. Vous pouvez aussi bloquer les cookies via
              les réglages de votre navigateur ; certaines fonctions du site
              (connexion espace pro, panier) peuvent alors être limitées.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <CookiePreferencesButton />
              <Link
                href="/#contact"
                className="inline-flex items-center rounded-full border border-febis-ink/15 px-5 py-2.5 text-sm font-semibold text-febis-ink transition hover:border-febis-ink/30 hover:bg-white"
              >
                Nous contacter
              </Link>
            </div>
          </section>

          <p className="border-t border-febis-ink/10 pt-6 text-xs text-febis-ink/45">
            Dernière mise à jour : 27 octobre 2026.
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}

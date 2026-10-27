import Image from "next/image";
import Link from "next/link";
import { CookiePreferencesButton } from "@/components/CookiePreferencesButton";

const poles = [
  { href: "/residences", label: "Résidences" },
  { href: "/evenementiel", label: "Événementiel" },
  { href: "/boutique", label: "Boutique" },
  { href: "/btp", label: "BTP" },
];

const explore = [
  { href: "/blog", label: "Blog" },
  { href: "/#travaux", label: "Travaux récents" },
  { href: "/#temoignages", label: "Témoignages" },
  { href: "/#equipe", label: "Notre équipe" },
];

const legal = [
  { href: "/contact", label: "Contact" },
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/cookies", label: "Cookies" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-febis-ink text-white">
      <div className="fan-layers opacity-35" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 15% 0%, rgba(215,25,32,0.35), transparent 60%), radial-gradient(ellipse 40% 35% at 90% 100%, rgba(212,168,75,0.2), transparent 55%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 xs:px-5 xs:py-14 sm:gap-10 md:grid-cols-2 md:gap-8 md:py-16 lg:grid-cols-[1.2fr_1fr_1fr_0.9fr] lg:px-8">
        <div>
          <Image
            src="/logo-febis.jpg"
            alt="FEBiS"
            width={160}
            height={56}
            className="mb-5 h-10 w-auto rounded-sm object-contain sm:h-11"
          />
          <p className="max-w-sm text-sm leading-relaxed text-white/65">
            Résidences, BTP, événementiel et boutique — un écosystème digital
            unifié en Côte d&apos;Ivoire.
          </p>
          <Link
            href="/contact"
            className="cta-premium mt-6 !px-5 !py-2.5 text-sm"
          >
            Nous écrire
          </Link>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-febis-amber">
            Pôles
          </p>
          <ul className="mt-4 space-y-2.5 text-sm font-semibold text-white/75">
            {poles.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-febis-amber">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-febis-amber">
            Explorer
          </p>
          <ul className="mt-4 space-y-2.5 text-sm font-semibold text-white/75">
            {explore.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-febis-amber">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-febis-amber">
            Contact
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            <li>
              <span className="font-semibold text-white/90">Côte d&apos;Ivoire</span>
            </li>
            <li>
              <a href="mailto:contact@febis.ci" className="hover:text-febis-amber">
                contact@febis.ci
              </a>
            </li>
            {legal.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-febis-amber">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <CookiePreferencesButton className="text-left text-sm text-white/70 transition hover:text-febis-amber">
                Gérer les cookies
              </CookiePreferencesButton>
            </li>
            <li className="pt-2">
              <Link
                href="/admin"
                className="text-xs font-semibold text-white/40 transition hover:text-white/70"
              >
                Espace pro →
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/10 px-4 py-5 text-center text-xs leading-relaxed text-white/40 sm:flex sm:items-center sm:justify-between sm:px-5 sm:text-left lg:px-8">
        <p>© {new Date().getFullYear()} FEBiS. Tous droits réservés.</p>
        <p className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1 sm:mt-0 sm:justify-end">
          <Link href="/mentions-legales" className="transition hover:text-white/70">
            Mentions légales
          </Link>
          <Link href="/confidentialite" className="transition hover:text-white/70">
            Confidentialité
          </Link>
          <Link href="/cookies" className="transition hover:text-white/70">
            Cookies
          </Link>
        </p>
      </div>
    </footer>
  );
}

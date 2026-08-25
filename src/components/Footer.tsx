import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-febis-ink text-white">
      <div className="fan-layers opacity-40" aria-hidden>
        <span />
        <span />
        <span />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-5 sm:py-14 md:flex-row md:items-end md:justify-between lg:px-8">
        <div>
          <Image
            src="/logo-febis.jpg"
            alt="FEBiS"
            width={160}
            height={56}
            className="mb-5 h-10 w-auto rounded-sm object-contain sm:h-11"
          />
          <p className="max-w-sm text-sm leading-relaxed text-white/65">
            FEBiS — résidences meublées, BTP, événementiel et boutique en Côte
            d&apos;Ivoire. Plateforme digitale unifiée.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm font-semibold text-white/75 sm:flex sm:flex-wrap sm:gap-6">
          <Link href="/residences" className="hover:text-febis-amber">
            Résidences
          </Link>
          <Link href="/evenementiel" className="hover:text-febis-amber">
            Événementiel
          </Link>
          <Link href="/#travaux" className="hover:text-febis-amber">
            Travaux
          </Link>
          <Link href="/blog" className="hover:text-febis-amber">
            Blog
          </Link>
          <Link href="/#temoignages" className="hover:text-febis-amber">
            Témoignages
          </Link>
          <Link href="/#btp" className="hover:text-febis-amber">
            BTP
          </Link>
          <Link href="/boutique" className="hover:text-febis-amber">
            Boutique
          </Link>
          <Link href="/admin" className="hover:text-febis-amber">
            Espace pro
          </Link>
        </div>
      </div>

      <div className="relative border-t border-white/10 px-4 py-5 text-center text-xs leading-relaxed text-white/45 sm:px-5 lg:px-8">
        © {new Date().getFullYear()} FEBiS. Tous droits réservés. · Réf.
        NYI-CDC-FEBIS-2026-001
      </div>
    </footer>
  );
}

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

      <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-5 py-14 md:flex-row md:items-end md:justify-between md:px-8">
        <div>
          <Image
            src="/logo-febis.jpg"
            alt="FEBiS"
            width={160}
            height={56}
            className="mb-5 h-11 w-auto rounded-sm object-contain"
          />
          <p className="max-w-sm text-sm leading-relaxed text-white/65">
            FEBiS — résidences meublées, BTP, événementiel et boutique en Côte
            d&apos;Ivoire. Plateforme digitale unifiée.
          </p>
        </div>

        <div className="flex flex-wrap gap-6 text-sm font-semibold text-white/75">
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
          <Link href="/#boutique" className="hover:text-febis-amber">
            Boutique
          </Link>
          <Link href="/admin" className="hover:text-febis-amber">
            Espace pro
          </Link>
        </div>
      </div>

      <div className="relative border-t border-white/10 px-5 py-5 text-center text-xs text-white/45 md:px-8">
        © {new Date().getFullYear()} FEBiS. Tous droits réservés. · Réf.
        NYI-CDC-FEBIS-2026-001
      </div>
    </footer>
  );
}

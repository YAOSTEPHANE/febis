import Link from "next/link";

type LogoLinkProps = {
  href?: string;
  className?: string;
};

export function LogoLink({ href = "/", className = "" }: LogoLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center ${className}`}
      aria-label="FEBiS — Accueil"
    >
      {/* SVG transparent — pas de fond */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-febis.svg"
        alt="FEBiS"
        width={150}
        height={40}
        className="h-9 w-auto md:h-10"
      />
    </Link>
  );
}

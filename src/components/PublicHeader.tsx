"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/residences", label: "Résidences" },
  { href: "/evenementiel", label: "Événementiel" },
  { href: "/boutique", label: "Boutique" },
  { href: "/blog", label: "Blog" },
  { href: "/#temoignages", label: "Avis" },
  { href: "/#contact", label: "Contact" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "nav-glass fixed inset-x-0 top-0 z-50 transition-shadow duration-300",
        scrolled && "is-scrolled",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-[4.25rem] md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo-febis.jpg"
            alt="FEBiS"
            width={140}
            height={48}
            className="h-9 w-auto rounded-sm object-contain md:h-10"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => {
            const active =
              link.href === "/residences" ||
              link.href === "/evenementiel" ||
              link.href === "/boutique"
                ? pathname.startsWith(link.href)
                : pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group text-sm font-semibold tracking-wide transition-colors",
                  active
                    ? "text-febis-red"
                    : "text-febis-ink/75 hover:text-febis-red",
                )}
              >
                <span className="draw-underline">{link.label}</span>
              </Link>
            );
          })}
          <Link href="/admin" className="cta-premium !px-5 !py-2.5 text-sm">
            Espace pro
          </Link>
        </nav>

        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-febis-ink/10 bg-white/60 md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <div className="flex w-5 flex-col gap-1.5">
            <span
              className={cn(
                "h-0.5 w-full rounded bg-febis-ink",
                open && "translate-y-2 rotate-45",
              )}
            />
            <span
              className={cn(
                "h-0.5 w-full rounded bg-febis-ink",
                open && "opacity-0",
              )}
            />
            <span
              className={cn(
                "h-0.5 w-full rounded bg-febis-ink",
                open && "-translate-y-2 -rotate-45",
              )}
            />
          </div>
        </button>
      </div>

      {open && (
        <div className="border-t border-febis-ink/8 bg-febis-smoke/95 px-5 py-6 md:hidden">
          <nav className="flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-lg font-semibold text-febis-ink"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

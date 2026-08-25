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

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={cn(
        "nav-glass fixed inset-x-0 top-0 z-50 transition-shadow duration-300",
        scrolled && "is-scrolled",
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-5 md:h-[4.25rem] lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo-febis.jpg"
            alt="FEBiS"
            width={140}
            height={48}
            className="h-8 w-auto rounded-sm object-contain sm:h-9 md:h-10"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-4 xl:gap-7 lg:flex">
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
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-febis-ink/10 bg-white/60 lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <div className="flex w-5 flex-col gap-1.5">
            <span
              className={cn(
                "h-0.5 w-full rounded bg-febis-ink transition-transform",
                open && "translate-y-2 rotate-45",
              )}
            />
            <span
              className={cn(
                "h-0.5 w-full rounded bg-febis-ink transition-opacity",
                open && "opacity-0",
              )}
            />
            <span
              className={cn(
                "h-0.5 w-full rounded bg-febis-ink transition-transform",
                open && "-translate-y-2 -rotate-45",
              )}
            />
          </div>
        </button>
      </div>

      {open && (
        <div className="max-h-[min(78vh,520px)] overflow-y-auto border-t border-febis-ink/8 bg-febis-smoke/98 px-4 py-5 backdrop-blur-xl sm:px-5 sm:py-6 lg:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-3 text-base font-semibold text-febis-ink transition-colors hover:bg-white/70 sm:text-lg"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="cta-premium mt-3 w-full"
              onClick={() => setOpen(false)}
            >
              Espace pro
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

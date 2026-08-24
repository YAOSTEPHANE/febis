"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

const links = [
  { href: "#categories", label: "Logements" },
  { href: "#evenementiel", label: "Événementiel" },
  { href: "/boutique", label: "Boutique" },
  { href: "#travaux", label: "Travaux" },
  { href: "#blog", label: "Blog" },
  { href: "#contact", label: "Contact" },
];

export function Header() {
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
        <Link href="#accueil" className="group flex items-center gap-2.5">
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
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group text-sm font-semibold tracking-wide text-febis-ink/75 transition-colors hover:text-febis-red"
            >
              <span className="draw-underline">{link.label}</span>
            </a>
          ))}
          <Link
            href="/admin"
            className="text-sm font-semibold text-febis-ink/50 hover:text-febis-red"
          >
            Espace pro
          </Link>
          <a href="#contact" className="cta-premium !px-5 !py-2.5 text-sm">
            Contact FEBiS
          </a>
        </nav>

        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-febis-ink/10 bg-white/60 md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
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
        <div className="border-t border-febis-ink/8 bg-febis-smoke/95 px-5 py-6 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-lg font-semibold text-febis-ink"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/admin"
              className="text-lg font-semibold text-febis-ink"
              onClick={() => setOpen(false)}
            >
              Espace pro
            </Link>
            <a
              href="#contact"
              className="cta-premium mt-2 w-full"
              onClick={() => setOpen(false)}
            >
              Contact FEBiS
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

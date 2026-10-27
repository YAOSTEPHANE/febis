"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

const links = [
  {
    href: "/#poles",
    label: "Pôles",
    match: null as string | null,
    hint: "Quatre activités, une plateforme",
  },
  {
    href: "/residences",
    label: "Résidences",
    match: "/residences",
    hint: "Séjours meublés & disponibilités",
  },
  {
    href: "/evenementiel",
    label: "Événementiel",
    match: "/evenementiel",
    hint: "Location matériel & devis live",
  },
  {
    href: "/btp",
    label: "BTP",
    match: "/btp",
    hint: "Prospects, devis & chantiers",
  },
  {
    href: "/boutique",
    label: "Boutique",
    match: "/boutique",
    hint: "Produits, variantes & stock",
  },
  {
    href: "/blog",
    label: "Blog",
    match: "/blog",
    hint: "Guides & coulisses FEBiS",
  },
] as const;

function isActive(pathname: string, match: string | null) {
  if (!match) return false;
  return pathname === match || pathname.startsWith(`${match}/`);
}

export function Header() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const indicatorId = useId();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const onHome = pathname === "/";
  const heroTop = onHome && (!hydrated || !scrolled);

  useEffect(() => {
    setHydrated(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
        "nav-glass fixed inset-x-0 top-0 z-50",
        scrolled && "is-scrolled",
        heroTop && "is-hero-top",
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:h-16 sm:gap-4 sm:px-5 md:h-16 md:px-6 lg:gap-6 lg:px-8 xl:h-[4.75rem] 3xl:max-w-[92rem]">
        <Link
          href="/"
          className="site-logo group relative z-10 flex shrink-0 items-center gap-2.5 rounded-sm focus-ring-premium sm:gap-3"
          aria-label="FEBiS — Accueil"
        >
          <span className="relative flex h-8 w-8 overflow-hidden rounded-[0.35rem] shadow-[0_6px_18px_rgba(0,0,0,0.18)] ring-1 ring-white/20 xs:h-9 xs:w-9 sm:h-10 sm:w-10 xl:h-11 xl:w-11">
            <Image
              src="/logo-febis.jpg"
              alt=""
              width={192}
              height={181}
              className="site-logo-img h-full w-full object-contain"
              sizes="44px"
              priority
            />
          </span>
          <span className="hidden min-w-0 flex-col sm:flex">
            <span
              className={cn(
                "font-display text-lg font-extrabold leading-none tracking-tight xl:text-xl",
                heroTop ? "text-white" : "text-febis-ink",
              )}
            >
              FEBiS
            </span>
            <span
              className={cn(
                "mt-0.5 text-[9px] font-bold uppercase tracking-[0.22em]",
                heroTop ? "text-white/45" : "text-febis-ink/35",
              )}
            >
              Côte d&apos;Ivoire
            </span>
          </span>
        </Link>

        <nav
          className="ml-auto hidden items-center lg:flex"
          aria-label="Navigation principale"
        >
          <div
            className={cn(
              "nav-island relative flex items-center gap-0.5 rounded-full p-1 xl:gap-1 xl:p-1.5",
              heroTop
                ? "border border-white/14 bg-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl"
                : "border border-febis-ink/8 bg-white/70 shadow-[0_10px_36px_rgba(26,18,16,0.08)] backdrop-blur-xl",
            )}
          >
            {links.map((link) => {
              const active = isActive(pathname, link.match);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "nav-link-premium group relative z-[1] rounded-full px-3 py-2 text-[13px] font-semibold tracking-wide transition-colors focus-ring-premium xl:px-4 xl:text-sm",
                    active
                      ? heroTop
                        ? "text-white"
                        : "text-febis-red"
                      : heroTop
                        ? "text-white/78 hover:text-white"
                        : "text-febis-ink/62 hover:text-febis-ink",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId={indicatorId}
                      className={cn(
                        "absolute inset-0 -z-10 rounded-full",
                        heroTop
                          ? "bg-white/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]"
                          : "bg-febis-red/[0.11] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
                      )}
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 420, damping: 34 }
                      }
                    />
                  ) : null}
                  <span className="relative">{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="ml-3 flex items-center gap-2.5 xl:ml-5 xl:gap-3.5">
            <Link
              href="/admin"
              className={cn(
                "hidden text-[13px] font-semibold tracking-wide transition-colors focus-ring-premium xl:inline",
                heroTop
                  ? "text-white/48 hover:text-white/88"
                  : "text-febis-ink/38 hover:text-febis-red",
              )}
            >
              Espace pro
            </Link>
            <a
              href="/#contact"
              className={cn(
                "cta-premium !min-h-0 !gap-2 !px-4 !py-2.5 text-sm focus-ring-premium xl:!px-5",
                heroTop && "shadow-[0_10px_32px_rgba(0,0,0,0.32)]",
              )}
            >
              Contact
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </nav>

        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="nav-mobile-panel"
          className={cn(
            "nav-burger relative z-10 ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition focus-ring-premium lg:hidden",
            heroTop
              ? "border-white/25 bg-white/10 text-white backdrop-blur-md"
              : "border-febis-ink/10 bg-white/80 text-febis-ink backdrop-blur-md",
            open && "pointer-events-none opacity-0",
          )}
          onClick={() => setOpen(true)}
        >
          <span className="flex w-4 flex-col gap-1.5" aria-hidden>
            <span className="h-[1.5px] w-full rounded-full bg-current" />
            <span className="h-[1.5px] w-[70%] self-end rounded-full bg-current" />
            <span className="h-[1.5px] w-full rounded-full bg-current" />
          </span>
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="nav-drawer lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu FEBiS"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default"
              aria-label="Fermer le menu"
              onClick={() => setOpen(false)}
            />
            <motion.div
              id="nav-mobile-panel"
              className="nav-drawer-panel"
              initial={reduce ? false : { x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 380, damping: 36 }
              }
            >
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-febis-red">
                    Navigation
                  </p>
                  <p className="mt-2 font-display text-2xl font-extrabold tracking-tight text-febis-ink">
                    Explorer FEBiS
                  </p>
                </div>
                <button
                  type="button"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-febis-ink/10 bg-white/90 text-febis-ink focus-ring-premium"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <nav className="flex flex-1 flex-col" aria-label="Navigation mobile">
                <Link
                  href="/"
                  className={cn(
                    "nav-mobile-item group",
                    pathname === "/" && "is-active",
                  )}
                  onClick={() => setOpen(false)}
                >
                  <span className="nav-mobile-index">00</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-xl font-bold tracking-tight">
                      Accueil
                    </span>
                    <span className="mt-0.5 block text-sm text-febis-ink/45">
                      Plateforme & vision FEBiS
                    </span>
                  </span>
                  <span className="nav-mobile-arrow" aria-hidden>
                    →
                  </span>
                </Link>

                {links.map((link, index) => {
                  const active = isActive(pathname, link.match);
                  return (
                    <motion.div
                      key={link.href}
                      initial={reduce ? false : { opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: reduce ? 0 : 0.05 + index * 0.04,
                        duration: 0.35,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <Link
                        href={link.href}
                        className={cn(
                          "nav-mobile-item group",
                          active && "is-active",
                        )}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                      >
                        <span className="nav-mobile-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-display text-xl font-bold tracking-tight">
                            {link.label}
                          </span>
                          <span className="mt-0.5 block text-sm text-febis-ink/45">
                            {link.hint}
                          </span>
                        </span>
                        <span className="nav-mobile-arrow" aria-hidden>
                          →
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <div className="mt-auto space-y-3 border-t border-febis-ink/8 pt-6">
                <a
                  href="/#contact"
                  className="cta-premium w-full focus-ring-premium"
                  onClick={() => setOpen(false)}
                >
                  Contact FEBiS
                </a>
                <Link
                  href="/admin"
                  className="block rounded-full px-3 py-2.5 text-center text-sm font-semibold text-febis-ink/45 transition-colors hover:text-febis-red"
                  onClick={() => setOpen(false)}
                >
                  Espace professionnel →
                </Link>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

/** @deprecated Use Header — alias for legacy imports */
export const SiteHeader = Header;

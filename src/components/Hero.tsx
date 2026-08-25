"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { HeroContent } from "@/lib/homepage-content";

export function Hero({ content }: { content: HeroContent }) {
  const reduce = useReducedMotion();

  return (
    <section
      id="accueil"
      className="relative min-h-[100svh] overflow-hidden bg-febis-ink"
    >
      <div className="absolute inset-0">
        <Image
          src="/images/hero-sky-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className={`object-cover object-center ${reduce ? "" : "ken-burns"}`}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1210]/94) via-[#1a1210]/62) to-[#1a1210]/25 max-md:via-[#1a1210]/78 max-md:to-[#1a1210]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1210]/88 via-transparent to-[#1a1210]/35 max-md:from-[#1a1210]/92" />
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, x: 48, y: 24 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="hero-villa-cutout pointer-events-none absolute bottom-[-4%] right-[-6%] z-[2] h-[88%] w-[min(72vw,820px)] opacity-100 max-md:bottom-0 max-md:right-[-12%] max-md:h-[52%] max-md:w-[90%] max-md:opacity-70 max-sm:bottom-[-2%] max-sm:right-[-18%] max-sm:h-[42%] max-sm:w-[88%] max-sm:opacity-55"
        aria-hidden
      >
        <Image
          src="/images/villa-3d.png"
          alt=""
          fill
          priority
          sizes="(max-width: 640px) 88vw, (max-width: 768px) 90vw, 70vw"
          className="object-contain object-bottom drop-shadow-[0_35px_60px_rgba(0,0,0,0.45)]"
        />
      </motion.div>

      <div className="relative z-[3] mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-4 pb-28 pt-24 sm:px-5 sm:pb-32 sm:pt-28 md:justify-center md:px-8 md:pb-28 md:pt-24">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[20rem] sm:max-w-xl md:max-w-2xl"
        >
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-febis-amber sm:mb-3 sm:text-xs sm:tracking-[0.32em]">
            {content.eyebrow}
          </p>

          <p className="font-display text-[clamp(2.45rem,12vw,6.5rem)] font-extrabold leading-[0.85] tracking-tight text-white sm:text-[clamp(3.2rem,9vw,6.5rem)]">
            {content.brand}
          </p>

          <h1 className="mt-3 font-display text-[clamp(1.25rem,4.5vw,2.35rem)] font-bold leading-snug tracking-tight text-white/92 sm:mt-4 sm:text-[clamp(1.55rem,3.4vw,2.35rem)]">
            {content.headline}{" "}
            <span className="text-gold-sheen">{content.highlight}</span>.
          </h1>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/72 sm:mt-5 sm:text-base md:text-lg">
            {content.description}
          </p>

          <div className="mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href={content.primaryCtaHref}
              className="cta-premium w-full justify-center sm:w-auto"
            >
              {content.primaryCtaLabel}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <a
              href={content.secondaryCtaHref}
              className="cta-ghost w-full justify-center sm:w-auto"
            >
              {content.secondaryCtaLabel}
            </a>
          </div>
        </motion.div>
      </div>

      <a
        href="#recherche-sejour"
        className="hero-scroll-cue absolute bottom-5 left-1/2 z-[3] hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/55 md:flex"
      >
        Défiler
        <span className="hero-scroll-line" aria-hidden />
      </a>
    </section>
  );
}

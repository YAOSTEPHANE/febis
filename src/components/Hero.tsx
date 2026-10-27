"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { HeroContent } from "@/lib/homepage-content";

export function Hero({ content }: { content: HeroContent }) {
  const reduce = useReducedMotion();

  return (
    <section
      id="accueil"
      className="relative isolate min-h-[100svh] overflow-hidden bg-febis-ink supports-[height:100dvh]:min-h-[100dvh]"
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
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1210]/92) via-[#1a1210]/55) to-[#1a1210]/35 max-md:via-[#1a1210]/72 max-md:to-[#1a1210]/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1210]/90 via-transparent to-[#1a1210]/40" />
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 55% 50% at 18% 70%, rgba(215,25,32,0.22), transparent 60%), radial-gradient(ellipse 40% 45% at 88% 20%, rgba(212,168,75,0.16), transparent 55%)",
          }}
          aria-hidden
        />
      </div>

      <div className="relative z-[3] mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] pt-[calc(5.25rem+env(safe-area-inset-top,0px))] supports-[height:100dvh]:min-h-[100dvh] xs:px-5 sm:px-6 sm:pb-28 sm:pt-24 md:justify-center md:px-8 md:pb-24 lg:px-10 xl:pb-28 3xl:max-w-[92rem]">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[22rem] sm:max-w-xl md:max-w-2xl lg:max-w-3xl"
        >
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.26em] text-febis-amber sm:mb-3 sm:text-xs sm:tracking-[0.32em]">
            {content.eyebrow}
          </p>

          <p className="font-display text-[clamp(2.5rem,12vw,6.5rem)] font-extrabold leading-[0.86] tracking-tight text-white">
            {content.brand}
          </p>

          <h1 className="mt-3 font-display text-[clamp(1.2rem,4.4vw,2.45rem)] font-bold leading-snug tracking-tight text-white/92 sm:mt-4">
            {content.headline}{" "}
            <span className="text-gold-sheen">{content.highlight}</span>.
          </h1>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/72 sm:mt-5 sm:text-base md:text-lg">
            {content.description}
          </p>

          <div className="mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:max-w-md sm:flex-row sm:flex-wrap sm:items-center md:max-w-none">
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
        href="#poles"
        className="hero-scroll-cue absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-[3] hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/55 lg:flex"
      >
        Découvrir
        <span className="hero-scroll-line" aria-hidden />
      </a>
    </section>
  );
}

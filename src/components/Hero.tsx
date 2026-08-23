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
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1210]/90) via-[#1a1210]/50) to-[#1a1210]/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1210]/75 via-transparent to-[#1a1210]/30" />
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, x: 48, y: 24 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="hero-villa-cutout pointer-events-none absolute bottom-[-4%] right-[-6%] z-[2] h-[88%] w-[min(72vw,820px)] max-md:bottom-0 max-md:right-[-10%] max-md:h-[58%] max-md:w-[95%]"
        aria-hidden
      >
        <Image
          src="/images/villa-3d.png"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 95vw, 70vw"
          className="object-contain object-bottom drop-shadow-[0_35px_60px_rgba(0,0,0,0.45)]"
        />
      </motion.div>

      <div className="relative z-[3] mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-5 pb-24 pt-28 md:justify-center md:px-8 md:pb-28 md:pt-24">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl md:max-w-2xl"
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-febis-amber">
            {content.eyebrow}
          </p>

          <p className="font-display text-[clamp(3.2rem,9vw,6.5rem)] font-extrabold leading-[0.85] tracking-tight text-white">
            {content.brand}
          </p>

          <h1 className="mt-4 font-display text-[clamp(1.55rem,3.4vw,2.35rem)] font-bold leading-snug tracking-tight text-white/92">
            {content.headline}{" "}
            <span className="text-gold-sheen">{content.highlight}</span>.
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-white/72 md:text-lg">
            {content.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={content.primaryCtaHref} className="cta-premium">
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
            <a href={content.secondaryCtaHref} className="cta-ghost">
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

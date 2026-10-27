"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import type { TrustStat } from "@/lib/homepage-content";

function AnimatedValue({ value, reduce }: { value: string; reduce: boolean | null }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [shown, setShown] = useState(reduce ? value : "—");
  const numeric = Number.parseFloat(value.replace(/[^\d.]/g, ""));
  const isNumeric = Number.isFinite(numeric) && /^\d/.test(value.trim());

  useEffect(() => {
    if (reduce || !isNumeric) {
      setShown(value);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const duration = 900;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          const current = Math.round(numeric * eased);
          const suffix = value.replace(/^[\d.\s]+/, "");
          setShown(`${current}${suffix}`);
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, reduce, isNumeric, numeric]);

  return (
    <p
      ref={ref}
      className="font-display text-2xl font-extrabold tracking-tight text-gold-sheen sm:text-3xl md:text-4xl"
    >
      {shown}
    </p>
  );
}

export function HomeTrustStrip({ stats }: { stats: TrustStat[] }) {
  const reduce = useReducedMotion();

  return (
    <section
      aria-label="Chiffres clés FEBiS"
      className="relative border-y border-white/10 bg-febis-ink text-white"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 40% 80% at 0% 50%, rgba(215,25,32,0.25), transparent), radial-gradient(ellipse 35% 70% at 100% 50%, rgba(212,168,75,0.15), transparent)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-px bg-white/10 md:grid-cols-4">
        {stats.map((stat, index) => (
          <Reveal key={`${stat.label}-${index}`} delay={index * 0.05}>
            <div className="bg-febis-ink/95 px-4 py-6 text-center backdrop-blur-sm sm:px-5 sm:py-8 md:py-10">
              <AnimatedValue value={stat.value} reduce={reduce} />
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55 sm:text-[11px] sm:tracking-[0.18em]">
                {stat.label}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

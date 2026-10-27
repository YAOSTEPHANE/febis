"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import {
  testimonialActivityLabel,
  type Testimonial,
} from "@/lib/temoignages";
import { cn } from "@/lib/cn";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < rating ? "text-febis-gold" : "text-white/20"}
          aria-hidden
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function HomeTestimonials({ items }: { items: Testimonial[] }) {
  const reduce = useReducedMotion();
  const list = items.length > 0 ? items : [];
  const [active, setActive] = useState(0);
  const current = list[active] ?? list[0];

  useEffect(() => {
    if (reduce || list.length < 2) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % list.length);
    }, 5600);
    return () => window.clearInterval(id);
  }, [list.length, reduce]);

  if (!current) return null;

  return (
    <section id="temoignages" className="section-pad relative overflow-hidden">
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-febis-red/8 blur-3xl" />
      <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-febis-amber/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
        <Reveal>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-febis-red">
                Témoignages
              </p>
              <h2 className="font-display max-w-2xl text-[1.7rem] font-extrabold tracking-tight text-febis-ink sm:text-3xl md:text-4xl">
                Confiance{" "}
                <span className="text-gold-sheen">terrain</span>
              </h2>
            </div>
            <div className="flex gap-2">
              {list.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Avis ${index + 1}`}
                  onClick={() => setActive(index)}
                  className={cn(
                    "h-2.5 rounded-full transition-all focus-ring-premium",
                    active === index
                      ? "w-8 bg-febis-red"
                      : "w-2.5 bg-febis-ink/20 hover:bg-febis-ink/40",
                  )}
                />
              ))}
            </div>
          </div>
        </Reveal>

        <div className="relative min-h-[280px] sm:min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={current.id}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="glass-panel-ink relative overflow-hidden rounded-[1.5rem] border border-white/10 px-5 py-8 sm:rounded-[1.75rem] sm:px-8 sm:py-10 md:px-12 md:py-14"
            >
              <span
                className="absolute -top-4 left-4 font-display text-[5rem] leading-none text-white/10 sm:left-6 sm:text-[7rem]"
                aria-hidden
              >
                “
              </span>
              <Stars rating={current.rating} />
              <p className="relative mt-5 font-display text-xl font-medium leading-snug sm:mt-6 sm:text-2xl md:text-3xl">
                {current.quote}
              </p>
              <footer className="relative mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-white/15 pt-5 sm:mt-8 sm:pt-6">
                <div>
                  <p className="font-bold text-white">{current.name}</p>
                  <p className="text-sm text-white/60">{current.role}</p>
                </div>
                <span className="rounded-full bg-febis-red/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]">
                  {testimonialActivityLabel(current.activity)}
                </span>
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

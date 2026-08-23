"use client";

import { useState } from "react";
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
          className={i < rating ? "text-febis-gold" : "text-febis-ink/15"}
          aria-hidden
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function HomeTestimonials({ items }: { items: Testimonial[] }) {
  const [active, setActive] = useState(0);
  const list = items.length > 0 ? items : [];
  const current = list[active] ?? list[0];

  if (!current) return null;

  return (
    <section id="temoignages" className="section-band-mist relative overflow-hidden pt-8 pb-12 md:pt-10 md:pb-16">
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-febis-red/8 blur-3xl" />
      <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-febis-amber/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-febis-red">
            Témoignages
          </p>
          <h2 className="font-display max-w-2xl text-3xl font-extrabold tracking-tight text-febis-ink md:text-4xl">
            Ils font confiance à{" "}
            <span className="text-gold-sheen">FEBiS</span>
          </h2>
          <p className="mt-3 max-w-xl text-base text-febis-ink/65">
            Clients résidences, événementiel, BTP et boutique — retours terrain.
          </p>
        </Reveal>

        <div className="mt-6 grid gap-6 md:mt-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <blockquote className="relative overflow-hidden rounded-[1.75rem] border border-febis-ink/8 bg-febis-ink px-8 py-10 text-white md:px-12 md:py-14">
              <span
                className="absolute -top-4 left-6 font-display text-[7rem] leading-none text-white/10"
                aria-hidden
              >
                “
              </span>
              <Stars rating={current.rating} />
              <p className="relative mt-6 font-display text-2xl font-medium leading-snug md:text-3xl">
                {current.quote}
              </p>
              <footer className="relative mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-white/15 pt-6">
                <div>
                  <p className="font-bold text-white">{current.name}</p>
                  <p className="text-sm text-white/60">{current.role}</p>
                </div>
                <span className="rounded-full bg-febis-red/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]">
                  {testimonialActivityLabel(current.activity)}
                </span>
              </footer>
            </blockquote>
          </Reveal>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {list.map((item, index) => (
              <Reveal key={item.id} delay={index * 0.04}>
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-4 text-left transition-colors",
                    active === index
                      ? "border-febis-red/40 bg-white shadow-[0_12px_40px_rgba(215,25,32,0.1)]"
                      : "border-febis-ink/8 bg-white/50 hover:bg-white/80",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-febis-ink">{item.name}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-febis-red">
                      {testimonialActivityLabel(item.activity)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-febis-ink/55">
                    {item.quote}
                  </p>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

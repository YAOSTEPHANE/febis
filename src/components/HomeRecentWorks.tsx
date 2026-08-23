"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import {
  workPoleLabel,
  type RecentWork,
  type WorkPole,
} from "@/lib/travaux";
import { cn } from "@/lib/cn";

type Filter = "tous" | WorkPole;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "tous", label: "Tous" },
  { id: "evenementiel", label: "Événementiel" },
  { id: "btp", label: "BTP" },
];

export function HomeRecentWorks({
  items,
  initialFilter = "tous",
  showFilters = true,
  limit,
  subheading = "Réalisations Événementiel et BTP — de la mise en scène au chantier livré.",
  id = "travaux",
}: {
  items: RecentWork[];
  initialFilter?: Filter;
  showFilters?: boolean;
  limit?: number;
  subheading?: string;
  id?: string;
}) {
  const [filter, setFilter] = useState<Filter>(initialFilter);

  const filtered =
    filter === "tous"
      ? items
      : items.filter((work) => work.pole === filter);
  const works = typeof limit === "number" ? filtered.slice(0, limit) : filtered;

  return (
    <section id={id} className="section-band-mist relative overflow-hidden pt-8 pb-12 md:pt-10 md:pb-16">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-febis-red/25 to-transparent" />
      <div className="absolute -right-28 top-24 h-80 w-80 rounded-full bg-febis-orange/10 blur-3xl" />
      <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-febis-gold/12 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-febis-red">
            Portfolio
          </p>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-febis-ink md:text-4xl">
                Nos récents{" "}
                <span className="text-gold-sheen">travaux</span>
              </h2>
              <p className="mt-3 text-base text-febis-ink/65">{subheading}</p>
            </div>

            {showFilters && (
              <div
                className="flex flex-wrap gap-2"
                role="tablist"
                aria-label="Filtrer les travaux"
              >
                {FILTERS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={filter === item.id}
                    onClick={() => setFilter(item.id)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                      filter === item.id
                        ? "bg-febis-red text-white"
                        : "bg-white/70 text-febis-ink/70 hover:bg-white hover:text-febis-ink",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Reveal>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 md:mt-8 lg:grid-cols-3">
          {works.map((work, index) => (
            <Reveal key={work.id} delay={index * 0.06}>
              <article className="group overflow-hidden rounded-[1.35rem] border border-febis-ink/8 bg-white/60 shadow-[0_20px_50px_rgba(26,18,16,0.06)] backdrop-blur-sm">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={work.image}
                    alt={work.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-febis-ink/75 via-febis-ink/15 to-transparent" />
                  <span
                    className={cn(
                      "absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md",
                      work.pole === "evenementiel"
                        ? "bg-febis-red/80"
                        : "bg-febis-orange/85",
                    )}
                  >
                    {workPoleLabel(work.pole)}
                  </span>
                  <p className="absolute bottom-4 left-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
                    {work.year} · {work.location}
                  </p>
                </div>

                <div className="p-5">
                  <h3 className="font-display text-xl font-bold text-febis-ink">
                    {work.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-febis-ink/60">
                    {work.summary}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {work.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-febis-mist/90 px-2.5 py-1 text-[11px] font-semibold text-febis-ink/65"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {showFilters && (
          <Reveal delay={0.15}>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
              <Link
                href="/evenementiel"
                className="font-bold text-febis-red hover:underline"
              >
                Catalogue événementiel →
              </Link>
              <span className="text-febis-ink/25">|</span>
              <a
                href="/#btp"
                className="font-bold text-febis-orange hover:underline"
              >
                Pôle BTP →
              </a>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

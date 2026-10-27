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
  subheading = "Preuves terrain — de la mise en scène au chantier livré.",
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
  const [lead, ...rest] = works;

  if (!lead) return null;

  return (
    <section
      id={id}
      className="section-band-mist section-pad relative overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-febis-red/25 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 xs:px-5 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-7 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between md:mb-10">
            <div className="min-w-0 max-w-2xl">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-febis-red sm:text-sm">
                Preuves
              </p>
              <h2 className="font-display text-[clamp(1.45rem,4.5vw,2.5rem)] font-extrabold tracking-tight text-febis-ink">
                Travaux{" "}
                <span className="text-gold-sheen">récents</span>
              </h2>
              <p className="mt-3 text-sm text-febis-ink/65 sm:text-base">
                {subheading}
              </p>
            </div>

            {showFilters ? (
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
                      "filter-chip",
                      filter === item.id && "is-active",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
          <Reveal className="lg:col-span-7">
            <WorkCard work={lead} featured />
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
            {rest.slice(0, 4).map((work, index) => (
              <Reveal key={work.id} delay={0.05 + index * 0.04}>
                <WorkCard work={work} compact />
              </Reveal>
            ))}
          </div>
        </div>

        {showFilters ? (
          <Reveal delay={0.12}>
            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
              <Link
                href="/evenementiel"
                className="font-bold text-febis-red hover:underline"
              >
                Catalogue événementiel →
              </Link>
              <span className="text-febis-ink/25">|</span>
              <a href="/btp" className="font-bold text-febis-orange hover:underline">
                Pôle BTP →
              </a>
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}

function WorkCard({
  work,
  featured = false,
  compact = false,
}: {
  work: RecentWork;
  featured?: boolean;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <article className="glass-panel is-interactive group flex overflow-hidden p-2.5 sm:p-3">
        <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl">
          <Image
            src={work.image}
            alt={work.title}
            fill
            sizes="112px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-febis-orange">
            {workPoleLabel(work.pole)} · {work.year}
          </p>
          <h3 className="mt-1 line-clamp-2 font-display text-base font-bold text-febis-ink">
            {work.title}
          </h3>
          <p className="mt-0.5 truncate text-xs text-febis-ink/50">
            {work.location}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[1.35rem]",
        featured ? "min-h-[360px] sm:min-h-[440px] lg:min-h-full lg:h-full" : "",
      )}
    >
      <Image
        src={work.image}
        alt={work.title}
        fill
        sizes="(max-width: 1024px) 100vw, 58vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-febis-ink/90 via-febis-ink/30 to-transparent" />
      <span
        className={cn(
          "absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md",
          work.pole === "evenementiel" ? "bg-febis-red/80" : "bg-febis-orange/85",
        )}
      >
        {workPoleLabel(work.pole)}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
          {work.year} · {work.location}
        </p>
        <h3 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl">
          {work.title}
        </h3>
        <p className="mt-2 max-w-lg line-clamp-2 text-sm text-white/70">
          {work.summary}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {work.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-md"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

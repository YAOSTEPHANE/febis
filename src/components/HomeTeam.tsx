"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { Reveal } from "@/components/Reveal";
import { departmentLabel } from "@/lib/rh-shared";
import { preparePublicTeam } from "@/lib/team";
import { cn } from "@/lib/cn";

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  department: string;
  bio?: string;
  /** Photo optionnelle — monogramme si absente */
  imageUrl?: string;
};

const FALLBACK_TEAM: TeamMember[] = preparePublicTeam([
  {
    id: "amina",
    name: "Amina Koffi",
    role: "Responsable résidences",
    department: "residences",
    bio: "Parcours client, check-in et excellence d’accueil.",
  },
  {
    id: "jean",
    name: "Jean Traoré",
    role: "Chef de chantier",
    department: "btp",
    bio: "Pilotage terrain et livraison des projets BTP.",
  },
  {
    id: "sara",
    name: "Sara Blé",
    role: "Coordinatrice événementiel",
    department: "evenementiel",
    bio: "Catalogue live, devis et logistique événementielle.",
  },
  {
    id: "yao",
    name: "Yao Mensah",
    role: "Responsable boutique",
    department: "boutique",
    bio: "Catalogue, stocks et expérience d’achat FEBiS.",
  },
]);

export function teamInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export const TEAM_ACCENT_BY_DEPT: Record<string, string> = {
  residences: "from-febis-red to-febis-orange",
  btp: "from-febis-orange to-febis-amber",
  evenementiel: "from-febis-red-deep to-febis-gold",
  boutique: "from-febis-gold-deep to-febis-red",
  direction: "from-febis-ink to-febis-red",
  admin: "from-febis-ink to-febis-gold-deep",
  compta: "from-febis-gold to-febis-orange",
  rh: "from-febis-red-deep to-febis-amber",
  operations: "from-febis-orange to-febis-red",
};

function deptAccent(department: string) {
  return TEAM_ACCENT_BY_DEPT[department] ?? "from-febis-red to-febis-gold";
}

type LogoSize = "sm" | "md" | "lg" | "xl";

const logoSizeClass: Record<LogoSize, string> = {
  sm: "h-12 w-12 text-sm",
  md: "h-14 w-14 text-base sm:h-16 sm:w-16",
  lg: "h-24 w-24 text-2xl sm:h-28 sm:w-28 sm:text-3xl",
  xl: "h-32 w-32 text-3xl sm:h-40 sm:w-40 sm:text-4xl",
};

function TeamLogo({
  member,
  size = "md",
  active = false,
  className,
}: {
  member: TeamMember;
  size?: LogoSize;
  active?: boolean;
  className?: string;
}) {
  const mark = teamInitials(member.name);

  return (
    <span
      className={cn(
        "team-logo-ring relative inline-flex shrink-0 items-center justify-center rounded-full",
        active && "is-active",
        className,
      )}
    >
      <span
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br font-display font-extrabold text-white shadow-[0_12px_32px_rgba(0,0,0,0.35)]",
          logoSizeClass[size],
          deptAccent(member.department),
        )}
      >
        {member.imageUrl ? (
          <Image
            src={member.imageUrl}
            alt=""
            fill
            sizes={size === "xl" || size === "lg" ? "160px" : "64px"}
            className="object-cover"
          />
        ) : (
          <span aria-hidden>{mark}</span>
        )}
        <span className="team-logo-sheen" aria-hidden />
      </span>
      <span
        className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-febis-ink bg-febis-amber sm:h-3 sm:w-3"
        aria-hidden
      />
    </span>
  );
}

const ROTATE_MS = 5600;

export function HomeTeam({ members }: { members?: TeamMember[] }) {
  const reduce = useReducedMotion();
  const team = useMemo(() => {
    if (!members || members.length === 0) return FALLBACK_TEAM;
    const seen = new Set(
      members.map((m) =>
        m.name
          .normalize("NFD")
          .replace(/\p{M}/gu, "")
          .toLowerCase()
          .trim(),
      ),
    );
    const extras = FALLBACK_TEAM.filter(
      (m) =>
        !seen.has(
          m.name
            .normalize("NFD")
            .replace(/\p{M}/gu, "")
            .toLowerCase()
            .trim(),
        ),
    );
    return preparePublicTeam([...members, ...extras], 8);
  }, [members]);
  const [activeId, setActiveId] = useState(team[0]?.id ?? "");
  const [paused, setPaused] = useState(false);

  const active =
    team.find((m) => m.id === activeId) ?? team[0] ?? null;

  useEffect(() => {
    if (team.length === 0) return;
    if (!team.some((m) => m.id === activeId)) {
      setActiveId(team[0]!.id);
    }
  }, [team, activeId]);

  useEffect(() => {
    if (reduce || paused || team.length < 2) return;
    const id = window.setInterval(() => {
      setActiveId((current) => {
        const idx = team.findIndex((m) => m.id === current);
        const next = team[(idx + 1 + team.length) % team.length];
        return next?.id ?? current;
      });
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reduce, paused, team]);

  if (!active) return null;

  return (
    <section
      id="equipe"
      className="section-pad relative overflow-hidden bg-febis-ink text-white"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 50% at 12% 15%, rgba(215,25,32,0.38), transparent 55%), radial-gradient(ellipse 45% 40% at 90% 85%, rgba(212,168,75,0.22), transparent 50%)",
        }}
        aria-hidden
      />
      <div className="fan-layers opacity-25 max-md:opacity-15" aria-hidden>
        <span />
        <span />
        <span />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 xs:px-5 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between md:mb-12">
            <div className="max-w-2xl">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-febis-amber sm:text-sm">
                Notre équipe
              </p>
              <h2 className="font-display text-[clamp(1.55rem,5vw,2.75rem)] font-extrabold tracking-tight">
                Les talents derrière{" "}
                <span className="text-gold-sheen">FEBiS</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
                Des spécialistes résidences, BTP, événementiel et boutique —
                unis autour d’une même exigence de service.
              </p>
            </div>
            <a
              href="#contact"
              className="cta-premium w-full justify-center !px-5 !py-3 text-sm sm:w-auto"
            >
              Nous rejoindre
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div
            className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-8 xl:gap-10"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setPaused(false);
              }
            }}
          >
            {/* Carte immersive — membre actif */}
            <article className="team-showcase-card glass-panel-ink relative flex min-h-[320px] flex-col overflow-hidden rounded-[1.5rem] border border-white/10 p-5 sm:min-h-[360px] sm:rounded-[1.75rem] sm:p-7 md:p-9">
              <div
                className={cn(
                  "pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-gradient-to-br opacity-30 blur-3xl",
                  deptAccent(active.department),
                )}
                aria-hidden
              />

              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={reduce ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="relative flex flex-1 flex-col"
                >
                  <div className="flex flex-1 flex-col gap-6 sm:flex-row sm:items-stretch sm:justify-between sm:gap-8">
                    <div className="min-w-0 flex-1">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-febis-amber" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-amber sm:text-[11px]">
                          {departmentLabel(active.department)}
                        </p>
                      </div>

                      <h3 className="mt-4 font-display text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-[1.05] tracking-tight">
                        {active.name}
                      </h3>
                      <p className="mt-2 text-sm font-semibold text-white/70 sm:text-base md:text-lg">
                        {active.role}
                      </p>
                      {active.bio ? (
                        <p className="mt-5 max-w-md text-sm leading-relaxed text-white/55 sm:text-base">
                          {active.bio}
                        </p>
                      ) : (
                        <p className="mt-5 max-w-md text-sm leading-relaxed text-white/45">
                          Talent FEBiS — expertise métier et culture du
                          service.
                        </p>
                      )}

                      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                          {team.length} profils
                        </p>
                        <span className="text-white/20" aria-hidden>
                          ·
                        </span>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                          Sélectionnez une photo
                        </p>
                      </div>
                    </div>

                    <motion.div
                      className="team-portrait relative mx-auto aspect-[4/5] w-full max-w-[220px] shrink-0 overflow-hidden rounded-[1.35rem] border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:mx-0 sm:max-w-[240px] md:max-w-[260px]"
                      initial={reduce ? false : { opacity: 0.6, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {active.imageUrl ? (
                        <Image
                          src={active.imageUrl}
                          alt={`Portrait de ${active.name}`}
                          fill
                          sizes="(max-width: 640px) 220px, 260px"
                          className="object-cover"
                          priority
                        />
                      ) : (
                        <div
                          className={cn(
                            "flex h-full w-full items-center justify-center bg-gradient-to-br font-display text-4xl font-extrabold text-white",
                            deptAccent(active.department),
                          )}
                        >
                          {teamInitials(active.name)}
                        </div>
                      )}
                      <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-febis-ink/55 via-transparent to-transparent"
                        aria-hidden
                      />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                        <TeamLogo member={active} size="sm" active />
                        <span className="rounded-full bg-black/35 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/85 backdrop-blur-sm">
                          {departmentLabel(active.department)}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </article>

            {/* Rail logos — à droite (desktop) / sous la carte (mobile) */}
            <div
              role="tablist"
              aria-label="Membres de l’équipe FEBiS"
              className="team-logo-rail flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0 lg:pr-1"
            >
              {team.map((member, index) => {
                const isActive = member.id === active.id;
                return (
                  <motion.button
                    key={member.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-pressed={isActive}
                    aria-label={`${member.name}, ${member.role}`}
                    title={`${member.name} — ${member.role}`}
                    onClick={() => setActiveId(member.id)}
                    initial={reduce ? false : { opacity: 0, x: 16 }}
                    whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: 0.06 + index * 0.05,
                      duration: 0.45,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={reduce ? undefined : { y: -3, scale: 1.04 }}
                    whileTap={reduce ? undefined : { scale: 0.97 }}
                    className={cn(
                      "team-logo-item group relative flex shrink-0 items-center gap-3 rounded-2xl border px-2.5 py-2 transition focus-ring-premium lg:w-[13.5rem] lg:px-3 lg:py-2.5",
                      isActive
                        ? "border-febis-gold/45 bg-white/10 shadow-[0_12px_36px_rgba(212,168,75,0.18)]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]",
                    )}
                  >
                    <TeamLogo
                      member={member}
                      size="md"
                      active={isActive}
                    />
                    <span className="hidden min-w-0 flex-1 text-left lg:block">
                      <span className="block truncate font-display text-sm font-bold text-white">
                        {member.name.split(/\s+/)[0]}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] font-semibold text-white/45">
                        {departmentLabel(member.department)}
                      </span>
                    </span>
                    {isActive ? (
                      <span
                        className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-febis-amber max-lg:hidden"
                        aria-hidden
                      />
                    ) : null}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import type { PoleContent } from "@/lib/homepage-content";
import { cn } from "@/lib/cn";

export function Poles({ poles }: { poles: PoleContent[] }) {
  const [lead, ...rest] = poles;
  if (!lead) return null;

  return (
    <section id="poles" className="section-pad relative">
      <div className="mx-auto max-w-7xl px-4 xs:px-5 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-7 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between md:mb-10">
            <div className="min-w-0">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-febis-red sm:text-sm">
                Carte des activités
              </p>
              <h2 className="font-display max-w-3xl text-[clamp(1.45rem,4.5vw,2.5rem)] font-extrabold tracking-tight text-febis-ink">
                Quatre pôles.{" "}
                <span className="text-gold-sheen">Une plateforme.</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm text-febis-ink/65 sm:text-base">
                Orientez-vous, puis plongez dans l’offre qui vous concerne.
              </p>
            </div>
            <a
              href="#residences-accueil"
              className="shrink-0 text-sm font-bold text-febis-red hover:underline"
            >
              Commencer par les résidences →
            </a>
          </div>
        </Reveal>

        <div className="grid gap-3 xs:gap-4 lg:grid-cols-12 lg:gap-5">
          <Reveal className="lg:col-span-7">
            <PoleTile pole={lead} featured />
          </Reveal>
          <div className="grid grid-cols-1 gap-3 xs:gap-4 sm:grid-cols-1 md:grid-cols-3 lg:col-span-5 lg:grid-cols-1 lg:gap-5">
            {rest.map((pole, index) => (
              <Reveal key={pole.id} delay={0.06 + index * 0.05}>
                <PoleTile pole={pole} compact priority={index < 2} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PoleTile({
  pole,
  featured = false,
  compact = false,
  priority = false,
}: {
  pole: PoleContent;
  featured?: boolean;
  compact?: boolean;
  priority?: boolean;
}) {
  const href = pole.href ?? "/#contact";
  const eager = featured || priority;

  if (compact) {
    return (
      <Link
        id={pole.id}
        href={href}
        className="glass-panel is-interactive group flex min-h-[96px] overflow-hidden xs:min-h-[108px] sm:min-h-[116px]"
      >
        <div className="relative w-[32%] max-w-[7.5rem] shrink-0 overflow-hidden sm:w-28 lg:max-w-none lg:w-32">
          <Image
            src={pole.image}
            alt={pole.title}
            fill
            sizes="128px"
            priority={eager}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-1 flex-col justify-center p-4 sm:p-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-febis-orange">
            {pole.tag}
          </span>
          <h3 className="mt-1 font-display text-lg font-bold text-febis-ink">
            {pole.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-xs text-febis-ink/55 sm:line-clamp-2 sm:text-sm">
            {pole.points[0]}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <article
      id={pole.id}
      className={cn(
        "service-tile group relative h-full min-h-[280px] overflow-hidden p-0 xs:min-h-[320px] sm:min-h-[380px] lg:min-h-[480px]",
        featured && "lg:min-h-full",
      )}
    >
      <Image
        src={pole.image}
        alt={pole.title}
        fill
        sizes="(max-width: 1024px) 100vw, 58vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        priority={eager}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-febis-ink/92 via-febis-ink/40 to-febis-ink/10" />
      <div className="absolute inset-x-0 bottom-0 p-4 xs:p-5 sm:p-7 md:p-8">
        <span className="rounded-full bg-febis-red px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white xs:text-[11px]">
          {pole.tag}
        </span>
        <h3 className="mt-3 font-display text-[1.65rem] font-extrabold text-white xs:mt-4 xs:text-3xl sm:text-4xl">
          {pole.title}
        </h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-white/72 sm:mt-3 sm:text-base">
          {pole.description}
        </p>
        <ul className="mt-4 hidden flex-wrap gap-2 xs:flex sm:mt-5">
          {pole.points.slice(0, 3).map((point) => (
            <li
              key={point}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85 backdrop-blur-md"
            >
              {point}
            </li>
          ))}
        </ul>
        {pole.href ? (
          <Link
            href={pole.href}
            className="cta-premium mt-4 !w-full !justify-center !px-5 !py-2.5 text-sm sm:mt-6 sm:!w-auto"
          >
            Entrer dans le pôle
          </Link>
        ) : null}
      </div>
    </article>
  );
}

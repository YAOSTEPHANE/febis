import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import {
  EVENT_PROCESS,
  equipmentStatusLabel,
  formatXof,
  type PublicEquipment,
} from "@/lib/evenementiel";
import { cn } from "@/lib/cn";

function StockBadge({ item }: { item: PublicEquipment }) {
  const tone =
    item.status === "disponible" && item.quantityAvailable > 0
      ? "bg-emerald-500/15 text-emerald-800"
      : item.status === "loue" || item.quantityAvailable === 0
        ? "bg-febis-red/12 text-febis-red-deep"
        : "bg-amber-500/15 text-amber-900";

  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] backdrop-blur-md",
        tone,
      )}
    >
      {item.status === "disponible" && item.quantityAvailable > 0
        ? `${item.quantityAvailable} dispo`
        : equipmentStatusLabel(item.status)}
    </span>
  );
}

export function HomeEvenementiel({
  equipment,
}: {
  equipment: PublicEquipment[];
}) {
  const featured = equipment[0];
  const side = equipment.slice(1, 4);

  if (!featured) return null;

  return (
    <section id="evenementiel" className="section-pad relative overflow-hidden">
      <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-febis-orange/10 blur-3xl" />
      <div className="absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-febis-gold/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 xs:px-5 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-7 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between md:mb-10">
            <div className="min-w-0 max-w-2xl">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-febis-red sm:text-sm">
                03 · Événementiel
              </p>
              <h2 className="font-display text-[clamp(1.45rem,4.5vw,2.5rem)] font-extrabold tracking-tight text-febis-ink">
                Matériel live.{" "}
                <span className="text-gold-sheen">Devis immédiat.</span>
              </h2>
              <p className="mt-3 text-sm text-febis-ink/65 sm:text-base">
                Stocks, cautions et génération de devis — pour monter un
                événement sans friction.
              </p>
            </div>
            <Link
              href="/evenementiel"
              className="cta-ghost w-full justify-center !border-febis-ink/15 !text-febis-ink sm:w-auto"
            >
              Ouvrir le catalogue
            </Link>
          </div>
        </Reveal>

        <div className="mb-8 grid min-w-0 grid-cols-2 gap-2.5 xs:gap-3 sm:grid-cols-3 md:mb-10 md:grid-cols-5">
          {EVENT_PROCESS.slice(0, 5).map((step, index) => (
            <Reveal
              key={step.title}
              delay={index * 0.04}
              className={index === 4 ? "col-span-2 sm:col-span-1" : undefined}
            >
              <div className="glass-panel h-full px-3 py-3 xs:px-4 xs:py-3.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-febis-red">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-1 font-display text-sm font-bold text-febis-ink">
                  {step.title}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
          <Reveal>
            <article className="lodging-card group overflow-hidden">
              <Link href="/evenementiel" className="relative block min-h-[320px] sm:min-h-[400px]">
                <Image
                  src={featured.photo}
                  alt={featured.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-febis-ink/90 via-febis-ink/25 to-transparent" />
                <div className="absolute left-4 top-4">
                  <StockBadge item={featured} />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-febis-amber">
                    Coup de cœur catalogue
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl">
                    {featured.name}
                  </h3>
                  <p className="mt-2 max-w-md line-clamp-2 text-sm text-white/70">
                    {featured.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4">
                    <p className="font-display text-xl font-extrabold text-white">
                      {formatXof(featured.pricePerDay)}
                      <span className="text-sm font-semibold text-white/55"> / jour</span>
                    </p>
                    <p className="text-sm font-semibold text-white/65">
                      Caution {formatXof(featured.depositAmount)}
                    </p>
                  </div>
                </div>
              </Link>
            </article>
          </Reveal>

          <div className="flex flex-col gap-3">
            {side.map((item, index) => (
              <Reveal key={item.slug} delay={0.06 + index * 0.05}>
                <Link
                  href="/evenementiel"
                  className="glass-panel is-interactive group flex gap-3 p-2.5 sm:p-3"
                >
                  <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={item.photo}
                      alt={item.name}
                      fill
                      sizes="112px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center py-1 pr-1">
                    <div className="mb-1">
                      <StockBadge item={item} />
                    </div>
                    <h3 className="truncate font-display text-base font-bold text-febis-ink">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-sm font-extrabold text-febis-red">
                      {formatXof(item.pricePerDay)}
                      <span className="font-semibold text-febis-ink/40"> / jour</span>
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
            <Reveal delay={0.25}>
              <Link
                href="/evenementiel#catalogue"
                className="glass-panel is-interactive flex items-center justify-between px-5 py-4 text-sm font-bold text-febis-ink"
              >
                Composer un devis
                <span className="text-febis-red">→</span>
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

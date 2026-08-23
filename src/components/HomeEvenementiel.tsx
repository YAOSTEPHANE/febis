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
        "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]",
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
  const preview = equipment.slice(0, 3);

  return (
    <section id="evenementiel" className="relative overflow-hidden pt-8 pb-12 md:pt-10 md:pb-16">
      <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-febis-orange/10 blur-3xl" />
      <div className="absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-febis-gold/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-febis-red">
            Module CDC · Événementiel
          </p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-febis-ink md:text-4xl">
                Location matériel.{" "}
                <span className="text-gold-sheen">Disponibilité live.</span>
              </h2>
              <p className="mt-3 text-base text-febis-ink/65">
                Catalogue, cautions, devis, sorties/retours et pénalités —
                le parcours complet FEBiS pour vos événements.
              </p>
            </div>
            <Link
              href="/evenementiel"
              className="text-sm font-bold text-febis-red hover:underline"
            >
              Ouvrir le catalogue →
            </Link>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:mt-8 lg:grid-cols-5">
          {EVENT_PROCESS.map((step, index) => (
            <Reveal key={step.title} delay={index * 0.05}>
              <div className="h-full border-l-2 border-febis-red/70 bg-white/50 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-febis-red">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-display text-lg font-bold text-febis-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-febis-ink/60">
                  {step.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-6 grid gap-5 md:mt-8 md:grid-cols-3">
          {preview.map((item, index) => (
            <Reveal key={item.slug} delay={index * 0.08}>
              <article className="lodging-card group overflow-hidden">
                <Link href="/evenementiel" className="block">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={item.photo}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute left-4 top-4">
                      <StockBadge item={item} />
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-xl font-bold text-febis-ink">
                      {item.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-febis-ink/60">
                      {item.description}
                    </p>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-febis-ink/45">
                          Prix / jour
                        </p>
                        <p className="font-display text-lg font-extrabold text-febis-red">
                          {formatXof(item.pricePerDay)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-wider text-febis-ink/45">
                          Caution
                        </p>
                        <p className="font-semibold text-febis-ink">
                          {formatXof(item.depositAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/components/residences/StatusBadge";
import { Reveal } from "@/components/Reveal";
import { formatXof, categoryLabel, type PublicLodging } from "@/lib/residences";

export function LodgingCard({
  lodging,
  index = 0,
}: {
  lodging: PublicLodging;
  index?: number;
}) {
  const photo = lodging.photos[0] ?? "/images/pole-residences.jpg";

  return (
    <Reveal delay={index * 0.08}>
      <article className="lodging-card group">
        <Link href={`/residences/${lodging.slug}`} className="block">
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={photo}
              alt={lodging.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-febis-ink/70 via-transparent to-transparent" />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <StatusBadge status={lodging.status} />
              <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-febis-ink">
                {categoryLabel(lodging.category)}
              </span>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                {lodging.neighborhood}
              </p>
              <h3 className="font-display text-2xl font-bold text-white">
                {lodging.title}
              </h3>
            </div>
          </div>

          <div className="p-5">
            <p className="line-clamp-2 text-sm leading-relaxed text-febis-ink/65">
              {lodging.description}
            </p>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-febis-ink/45">
                  À partir de
                </p>
                <p className="font-display text-xl font-extrabold text-febis-red">
                  {formatXof(lodging.pricePerNight)}
                  <span className="text-sm font-semibold text-febis-ink/45">
                    {" "}
                    / nuit
                  </span>
                </p>
              </div>
              <span className="text-sm font-bold text-febis-ink group-hover:text-febis-red">
                Voir la fiche →
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-febis-mist px-2.5 py-1 text-[11px] font-semibold text-febis-ink/70">
                {lodging.capacity} pers.
              </span>
              <span className="rounded-full bg-febis-mist px-2.5 py-1 text-[11px] font-semibold text-febis-ink/70">
                {lodging.bedrooms} ch.
              </span>
              <span className="rounded-full bg-febis-mist px-2.5 py-1 text-[11px] font-semibold text-febis-ink/70">
                Acompte {lodging.depositPercent}%
              </span>
            </div>
          </div>
        </Link>
      </article>
    </Reveal>
  );
}

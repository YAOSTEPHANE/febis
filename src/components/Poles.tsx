import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import type { PoleContent } from "@/lib/homepage-content";

export function Poles({ poles }: { poles: PoleContent[] }) {
  return (
    <section id="poles" className="relative pt-8 pb-12 md:pt-10 md:pb-16">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-febis-red">
            Activités FEBiS
          </p>
          <h2 className="font-display max-w-3xl text-3xl font-extrabold tracking-tight text-febis-ink md:text-4xl">
            Une vitrine claire pour{" "}
            <span className="text-gold-sheen">chaque pôle</span>.
          </h2>
          <p className="mt-3 max-w-2xl text-base text-febis-ink/65">
            Conformément au cahier des charges NYI-CDC-FEBIS-2026-001 : présentation
            des quatre activités et prise de contact centralisée.
          </p>
        </Reveal>

        <div className="mt-6 grid gap-5 md:mt-8 md:grid-cols-2">
          {poles.map((pole, index) => (
            <Reveal key={pole.id} delay={index * 0.08}>
              <article
                id={pole.id}
                className="service-tile group grid h-full overflow-hidden p-0 md:grid-cols-[1.05fr_0.95fr]"
              >
                <div className="relative min-h-[220px] md:min-h-full">
                  <Image
                    src={pole.image}
                    alt={pole.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-febis-ink/55 to-transparent md:bg-gradient-to-r" />
                  <span className="absolute left-4 top-4 rounded-full bg-febis-red px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    {pole.tag}
                  </span>
                </div>
                <div className="relative z-10 flex flex-col justify-center p-6 md:p-7">
                  <h3 className="font-display text-2xl font-bold tracking-tight text-febis-ink">
                    <span className="draw-underline">{pole.title}</span>
                  </h3>
                  <p className="mt-3 text-[0.98rem] leading-relaxed text-febis-ink/65">
                    {pole.description}
                  </p>
                  <ul className="mt-5 space-y-2">
                    {pole.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-center gap-2 text-sm font-semibold text-febis-ink/80"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-febis-gold-light to-febis-red"
                          aria-hidden
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                  {pole.href && (
                    <Link
                      href={pole.href}
                      className="mt-5 inline-flex text-sm font-bold text-febis-red hover:underline"
                    >
                      Ouvrir le module →
                    </Link>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

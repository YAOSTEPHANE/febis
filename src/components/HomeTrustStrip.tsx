import { Reveal } from "@/components/Reveal";
import type { TrustStat } from "@/lib/homepage-content";

export function HomeTrustStrip({ stats }: { stats: TrustStat[] }) {
  return (
    <section
      aria-label="Chiffres clés FEBiS"
      className="relative border-y border-febis-ink/8 bg-febis-ink text-white"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-white/10 md:grid-cols-4">
        {stats.map((stat, index) => (
          <Reveal key={`${stat.label}-${index}`} delay={index * 0.05}>
            <div className="bg-febis-ink px-4 py-5 text-center sm:px-5 sm:py-6 md:py-8">
              <p className="font-display text-2xl font-extrabold tracking-tight text-gold-sheen sm:text-3xl md:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55 sm:text-[11px] sm:tracking-[0.18em]">
                {stat.label}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

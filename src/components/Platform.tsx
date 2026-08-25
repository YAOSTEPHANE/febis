import { Reveal } from "@/components/Reveal";
import type { PlatformContent } from "@/lib/homepage-content";

export function Platform({ content }: { content: PlatformContent }) {
  return (
    <section id="plateforme" className="section-band-mist relative overflow-hidden pt-8 pb-12 md:pt-10 md:pb-16">
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-febis-red/10 blur-3xl" />
      <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-febis-gold/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
        <Reveal>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-febis-red">
            {content.eyebrow}
          </p>
          <h2 className="font-display max-w-3xl text-[1.7rem] font-extrabold tracking-tight text-febis-ink sm:text-3xl md:text-4xl">
            {content.title}{" "}
            <span className="text-gold-sheen">{content.highlight}</span>
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-febis-ink/65 sm:text-base">
            {content.description}
          </p>
        </Reveal>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:mt-8 xl:grid-cols-4">
          {content.items.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.07}>
              <div className="border-l-2 border-febis-red/70 bg-white/45 p-4 backdrop-blur-sm sm:p-5">
                <h3 className="font-display text-lg font-bold text-febis-ink sm:text-xl">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-febis-ink/60">
                  {item.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15}>
          <div className="mt-6 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-febis-ink/55 sm:gap-3 sm:text-xs sm:tracking-[0.18em] md:mt-8">
            {content.roles.map((role) => (
              <span
                key={role}
                className="rounded-full border border-febis-ink/10 bg-white/60 px-3 py-1.5 sm:px-4 sm:py-2"
              >
                {role}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

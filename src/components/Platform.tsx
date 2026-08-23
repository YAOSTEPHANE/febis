import { Reveal } from "@/components/Reveal";
import type { PlatformContent } from "@/lib/homepage-content";

export function Platform({ content }: { content: PlatformContent }) {
  return (
    <section id="plateforme" className="section-band-mist relative overflow-hidden pt-8 pb-12 md:pt-10 md:pb-16">
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-febis-red/10 blur-3xl" />
      <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-febis-gold/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-febis-red">
            {content.eyebrow}
          </p>
          <h2 className="font-display max-w-3xl text-3xl font-extrabold tracking-tight text-febis-ink md:text-4xl">
            {content.title}{" "}
            <span className="text-gold-sheen">{content.highlight}</span>
          </h2>
          <p className="mt-3 max-w-2xl text-base text-febis-ink/65">
            {content.description}
          </p>
        </Reveal>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:mt-8 lg:grid-cols-4">
          {content.items.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.07}>
              <div className="border-l-2 border-febis-red/70 bg-white/45 p-5 backdrop-blur-sm">
                <h3 className="font-display text-xl font-bold text-febis-ink">
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
          <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.18em] text-febis-ink/55 md:mt-8">
            {content.roles.map((role) => (
              <span
                key={role}
                className="rounded-full border border-febis-ink/10 bg-white/60 px-4 py-2"
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

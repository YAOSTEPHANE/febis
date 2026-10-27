import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import type { PlatformContent } from "@/lib/homepage-content";

export function Platform({ content }: { content: PlatformContent }) {
  const items = content.items.slice(0, 3);

  return (
    <section id="plateforme" className="section-pad relative overflow-hidden bg-febis-ink text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 50% at 10% 20%, rgba(215,25,32,0.35), transparent 55%), radial-gradient(ellipse 45% 40% at 90% 80%, rgba(212,168,75,0.2), transparent 50%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-14">
          <Reveal>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-febis-amber">
              {content.eyebrow}
            </p>
            <h2 className="font-display text-[1.7rem] font-extrabold tracking-tight sm:text-3xl md:text-4xl">
              {content.title}{" "}
              <span className="text-gold-sheen">{content.highlight}</span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65 sm:text-base">
              {content.description}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/admin" className="cta-premium">
                Accéder à l&apos;espace pro
              </Link>
              <a href="/#contact" className="cta-ghost">
                Demander une démo
              </a>
            </div>
          </Reveal>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {items.map((item, i) => (
              <Reveal key={item.title} delay={0.08 + i * 0.06}>
                <div className="glass-panel-ink rounded-2xl border border-white/10 p-5 backdrop-blur-xl sm:p-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-febis-amber">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    {item.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import { Reveal } from "@/components/Reveal";
import { RESERVATION_STEPS } from "@/lib/types";
import { stepLabel } from "@/lib/residences";

export function ProcessTimeline({ activeStep = "demande" }: { activeStep?: string }) {
  const activeIndex = RESERVATION_STEPS.indexOf(
    activeStep as (typeof RESERVATION_STEPS)[number],
  );

  return (
    <section className="relative py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-febis-red">
            Parcours CDC
          </p>
          <h2 className="font-display max-w-2xl text-3xl font-extrabold tracking-tight text-febis-ink md:text-4xl">
            Demande → réservation → acompte → check-in/out → état des lieux
          </h2>
        </Reveal>

        <div className="process-rail mt-10">
          {RESERVATION_STEPS.map((step, index) => {
            const done = activeIndex >= 0 && index <= activeIndex;
            return (
              <Reveal key={step} delay={index * 0.06} className="process-step">
                <div
                  className={`process-node ${done ? "is-active" : ""}`}
                  aria-current={index === activeIndex ? "step" : undefined}
                >
                  <span className="process-index">{String(index + 1).padStart(2, "0")}</span>
                  <p className="font-display text-lg font-bold text-febis-ink">
                    {stepLabel(step)}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.2}>
          <p className="mt-8 max-w-3xl rounded-2xl border border-dashed border-febis-gold/50 bg-white/50 px-5 py-4 text-sm leading-relaxed text-febis-ink/65">
            <span className="font-bold text-febis-red">À valider en cadrage :</span>{" "}
            règles précises d’annulation et de remboursement. En attendant, toute
            demande démarre au statut « Demande » et sera confirmée par l’équipe FEBiS.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

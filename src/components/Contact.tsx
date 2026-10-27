"use client";

import { FormEvent, useState } from "react";
import { Reveal } from "@/components/Reveal";

type Status = "idle" | "loading" | "success" | "error";

const activities = [
  { value: "general", label: "Demande générale" },
  { value: "residences", label: "Résidences meublées" },
  { value: "btp", label: "BTP" },
  { value: "evenementiel", label: "Événementiel" },
  { value: "boutique", label: "Boutique" },
];

export function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("Envoi en cours…");

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          company: data.get("company"),
          activity: data.get("activity"),
          message: data.get("message"),
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Envoi impossible");
      }

      setStatus("success");
      setMessage("Merci. Votre message a bien été enregistré.");
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue. Réessayez.",
      );
    }
  }

  return (
    <section id="contact" className="section-pad relative overflow-hidden pb-[calc(var(--section-y)+env(safe-area-inset-bottom,0px))]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-febis-mist/80 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 xs:px-5 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
          <Reveal>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-febis-red">
              Contact
            </p>
            <h2 className="font-display text-[1.7rem] font-extrabold tracking-tight text-febis-ink sm:text-3xl md:text-4xl">
              Une porte d&apos;entrée{" "}
              <span className="text-gold-sheen">unique</span>
            </h2>
            <p className="mt-3 text-base leading-relaxed text-febis-ink/65">
              Réservation, chantier, location événementielle ou boutique —
              répondez-nous en quelques champs.
            </p>

            <div className="mt-8 space-y-3">
              {[
                ["Pays", "Côte d'Ivoire"],
                ["Email", "contact@febis.ci"],
                ["Délai", "24–48 h"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="glass-panel flex items-center justify-between px-4 py-3"
                >
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-febis-red">
                    {label}
                  </span>
                  <span className="text-sm font-semibold text-febis-ink/80">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <form onSubmit={onSubmit} className="glass-panel relative p-4 sm:p-6 md:p-8">
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-febis-orange/20 blur-2xl"
                aria-hidden
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-febis-ink/80">
                  Nom
                  <input
                    required
                    name="name"
                    autoComplete="name"
                    className="field-premium mt-2"
                    placeholder="Votre nom"
                  />
                </label>
                <label className="block text-sm font-semibold text-febis-ink/80">
                  Email
                  <input
                    required
                    type="email"
                    name="email"
                    autoComplete="email"
                    className="field-premium mt-2"
                    placeholder="vous@exemple.com"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-febis-ink/80">
                  Téléphone
                  <input
                    name="phone"
                    autoComplete="tel"
                    className="field-premium mt-2"
                    placeholder="+225 …"
                  />
                </label>
                <label className="block text-sm font-semibold text-febis-ink/80">
                  Activité
                  <select
                    name="activity"
                    className="field-premium mt-2"
                    defaultValue="general"
                  >
                    {activities.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <input type="hidden" name="company" value="" />

              <label className="mt-4 block text-sm font-semibold text-febis-ink/80">
                Message
                <textarea
                  required
                  name="message"
                  rows={4}
                  className="field-premium mt-2 resize-y"
                  placeholder="Décrivez votre besoin…"
                />
              </label>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="cta-premium w-full justify-center disabled:cursor-wait disabled:opacity-70 sm:w-auto"
                >
                  {status === "loading" ? "Envoi…" : "Envoyer le message"}
                </button>
                {message ? (
                  <p
                    className={
                      status === "success"
                        ? "status-banner is-success"
                        : status === "loading"
                          ? "status-banner is-loading"
                          : status === "error"
                            ? "status-banner is-error"
                            : "text-sm text-febis-ink/60"
                    }
                    role="status"
                  >
                    {message}
                  </p>
                ) : null}
              </div>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

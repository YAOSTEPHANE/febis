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
    setMessage("");

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
    <section id="contact" className="relative overflow-hidden pt-8 pb-14 md:pt-10 md:pb-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-febis-mist/80 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <Reveal>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-febis-red">
              Contact
            </p>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-febis-ink md:text-4xl">
              Parlons de votre{" "}
              <span className="text-gold-sheen">besoin FEBiS</span>.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-febis-ink/65">
              Réservation, chantier, location événementielle ou boutique —
              une seule porte d&apos;entrée.
            </p>

            <div className="mt-6 space-y-4 text-sm font-semibold text-febis-ink/80">
              <p>
                <span className="text-febis-red">Pays</span> — Côte d&apos;Ivoire
              </p>
              <p>
                <span className="text-febis-red">Email</span> — contact@febis.ci
              </p>
              <p>
                <span className="text-febis-red">Réponse</span> — sous 24 à 48h
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <form
              onSubmit={onSubmit}
              className="relative overflow-hidden rounded-[1.5rem] border border-febis-ink/8 bg-white/70 p-6 shadow-[0_30px_80px_rgba(160,16,24,0.08)] backdrop-blur-xl md:p-8"
            >
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
                  Entreprise
                  <input
                    name="company"
                    autoComplete="organization"
                    className="field-premium mt-2"
                    placeholder="Optionnel"
                  />
                </label>
              </div>

              <label className="mt-4 block text-sm font-semibold text-febis-ink/80">
                Activité concernée
                <select name="activity" className="field-premium mt-2" defaultValue="general">
                  {activities.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-4 block text-sm font-semibold text-febis-ink/80">
                Message
                <textarea
                  required
                  name="message"
                  rows={5}
                  className="field-premium mt-2 resize-y"
                  placeholder="Décrivez votre besoin…"
                />
              </label>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="cta-premium disabled:cursor-wait disabled:opacity-70"
                >
                  {status === "loading" ? "Envoi…" : "Envoyer le message"}
                </button>
                {message && (
                  <p
                    className={
                      status === "success"
                        ? "text-sm font-semibold text-emerald-700"
                        : "text-sm font-semibold text-febis-red"
                    }
                    role="status"
                  >
                    {message}
                  </p>
                )}
              </div>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

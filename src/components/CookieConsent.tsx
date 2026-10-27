"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import {
  acceptAllPreferences,
  COOKIE_CATEGORIES,
  COOKIE_CONSENT_OPEN_EVENT,
  type CookiePreferences,
  DEFAULT_PREFERENCES,
  readConsent,
  rejectOptionalPreferences,
  writeConsent,
} from "@/lib/cookie-consent";

type PanelMode = "banner" | "preferences" | "hidden";

export function CookieConsent() {
  const titleId = useId();
  const [mode, setMode] = useState<PanelMode>("hidden");
  const [prefs, setPrefs] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const existing = readConsent();
    if (existing) {
      setPrefs(existing.preferences);
      setMode("hidden");
    } else {
      setMode("banner");
    }

    function onOpen() {
      const current = readConsent();
      setPrefs(current?.preferences ?? DEFAULT_PREFERENCES);
      setMode("preferences");
    }

    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, onOpen);
  }, []);

  function save(next: CookiePreferences) {
    const state = writeConsent(next);
    setPrefs(state.preferences);
    setMode("hidden");
  }

  function toggle(key: keyof Omit<CookiePreferences, "necessary">) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (!mounted || mode === "hidden") return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[80] p-3 xs:p-4 sm:p-5"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-febis-ink/35 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-febis-ink text-white shadow-[0_-12px_48px_rgba(26,18,16,0.45)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 55% 70% at 0% 100%, rgba(215,25,32,0.35), transparent 60%), radial-gradient(ellipse 45% 55% at 100% 0%, rgba(212,168,75,0.22), transparent 55%)",
          }}
          aria-hidden
        />

        {mode === "banner" ? (
          <div className="relative space-y-4 p-4 xs:p-5 sm:p-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-febis-amber">
                Cookies
              </p>
              <h2
                id={titleId}
                className="mt-1.5 font-display text-xl font-bold tracking-tight sm:text-2xl"
              >
                Votre vie privée sur FEBiS
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
                Nous utilisons des cookies nécessaires au fonctionnement du site
                et, avec votre accord, des cookies de préférences, de mesure
                d&apos;audience et marketing.{" "}
                <Link
                  href="/cookies"
                  className="font-semibold text-febis-amber underline-offset-2 hover:underline"
                >
                  En savoir plus
                </Link>
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                className="cta-premium !px-5 !py-2.5 text-sm"
                onClick={() => save(acceptAllPreferences())}
              >
                Tout accepter
              </button>
              <button
                type="button"
                className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
                onClick={() => save(rejectOptionalPreferences())}
              >
                Refuser le non essentiel
              </button>
              <button
                type="button"
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:text-white"
                onClick={() => setMode("preferences")}
              >
                Personnaliser
              </button>
            </div>
          </div>
        ) : (
          <div className="relative max-h-[min(78svh,640px)] overflow-y-auto p-4 xs:p-5 sm:p-6">
            <div className="mb-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-febis-amber">
                Préférences
              </p>
              <h2
                id={titleId}
                className="mt-1.5 font-display text-xl font-bold tracking-tight sm:text-2xl"
              >
                Gérer les cookies
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Activez uniquement les catégories utiles. Les cookies nécessaires
                restent toujours actifs. Détails dans notre{" "}
                <Link
                  href="/cookies"
                  className="font-semibold text-febis-amber underline-offset-2 hover:underline"
                >
                  politique cookies
                </Link>
                .
              </p>
            </div>

            <ul className="space-y-3">
              {COOKIE_CATEGORIES.map((category) => {
                const checked =
                  category.id === "necessary"
                    ? true
                    : prefs[category.id as keyof Omit<CookiePreferences, "necessary">];

                return (
                  <li
                    key={category.id}
                    className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5 sm:p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-white">{category.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-white/60">
                          {category.description}
                        </p>
                        <p className="mt-2 text-xs text-white/40">
                          Ex. {category.examples.join(" · ")}
                        </p>
                      </div>

                      {category.required ? (
                        <span className="shrink-0 rounded-full bg-febis-amber/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-febis-amber">
                          Requis
                        </span>
                      ) : (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={checked}
                          aria-label={`${category.title} : ${checked ? "activé" : "désactivé"}`}
                          onClick={() =>
                            toggle(
                              category.id as keyof Omit<CookiePreferences, "necessary">,
                            )
                          }
                          className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition ${
                            checked ? "bg-febis-red" : "bg-white/20"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                              checked ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                className="cta-premium !px-5 !py-2.5 text-sm"
                onClick={() => save(prefs)}
              >
                Enregistrer mes choix
              </button>
              <button
                type="button"
                className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/10"
                onClick={() => save(acceptAllPreferences())}
              >
                Tout accepter
              </button>
              <button
                type="button"
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:text-white"
                onClick={() => save(rejectOptionalPreferences())}
              >
                Tout refuser (hors nécessaires)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

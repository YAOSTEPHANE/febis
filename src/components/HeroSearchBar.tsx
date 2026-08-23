"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const DESTINATIONS = [
  { value: "", label: "Toutes les destinations" },
  { value: "Cocody", label: "Cocody, Abidjan" },
  { value: "Plateau", label: "Plateau, Abidjan" },
  { value: "Riviera", label: "Riviera, Abidjan" },
];

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysISO(base: string, days: number) {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function HeroSearchBar() {
  const router = useRouter();
  const minDate = useMemo(() => todayISO(), []);
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState(minDate);
  const [checkOut, setCheckOut] = useState(addDaysISO(minDate, 2));

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (checkOut <= checkIn) {
      setCheckOut(addDaysISO(checkIn, 1));
      return;
    }

    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    params.set("arrivee", checkIn);
    params.set("retour", checkOut);

    router.push(`/residences?${params.toString()}`);
  }

  return (
    <section
      id="recherche-sejour"
      className="hero-search relative z-20 -mt-8 w-full px-5 pb-1 md:-mt-10 md:px-8"
    >
      <form
        onSubmit={onSubmit}
        className="hero-search-panel mx-auto grid max-w-7xl gap-3 rounded-[1.35rem] border border-febis-ink/8 bg-white p-3 shadow-[0_28px_70px_rgba(26,18,16,0.14)] md:grid-cols-[1.2fr_1fr_1fr_auto] md:gap-0 md:p-2"
      >
        <label className="hero-search-field md:rounded-l-[1.1rem]">
          <span className="hero-search-label">Destination</span>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="hero-search-input"
            aria-label="Destination"
          >
            {DESTINATIONS.map((item) => (
              <option key={item.value || "all"} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="hero-search-field md:border-l md:border-febis-ink/8">
          <span className="hero-search-label">Date d&apos;arrivée</span>
          <input
            type="date"
            required
            min={minDate}
            value={checkIn}
            onChange={(e) => {
              const next = e.target.value;
              setCheckIn(next);
              if (checkOut <= next) setCheckOut(addDaysISO(next, 1));
            }}
            className="hero-search-input"
            aria-label="Date d'arrivée"
          />
        </label>

        <label className="hero-search-field md:border-l md:border-febis-ink/8">
          <span className="hero-search-label">Date de retour</span>
          <input
            type="date"
            required
            min={addDaysISO(checkIn, 1)}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="hero-search-input"
            aria-label="Date de retour"
          />
        </label>

        <div className="flex items-stretch p-1 md:pl-2">
          <button type="submit" className="cta-premium w-full !rounded-[1rem] md:min-w-[160px]">
            Rechercher
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path
                d="M20 20l-3.5-3.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </form>
    </section>
  );
}

"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AvailabilityCalendar } from "@/components/residences/AvailabilityCalendar";
import type { CalendarDay, DayStatus } from "@/lib/types";
import { formatXof, nightsBetween, type PublicLodging } from "@/lib/residences";

type Props = {
  lodging: PublicLodging;
  initialYear: number;
  initialMonth: number;
  initialDays: CalendarDay[];
};

export function BookingPanel({
  lodging,
  initialYear,
  initialMonth,
  initialDays,
}: Props) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [days, setDays] = useState(initialDays);
  const [loadingCal, setLoadingCal] = useState(false);
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const nights =
    checkIn && checkOut ? Math.max(0, nightsBetween(checkIn, checkOut)) : 0;
  const total = nights * lodging.pricePerNight;
  const deposit = Math.round((total * lodging.depositPercent) / 100);

  const loadCalendar = useCallback(
    async (y: number, m: number) => {
      setLoadingCal(true);
      try {
        const res = await fetch(
          `/api/residences/${lodging.slug}/calendar?year=${y}&month=${m}`,
        );
        const data = (await res.json()) as { days?: CalendarDay[] };
        if (res.ok && data.days) {
          setDays(data.days);
          setYear(y);
          setMonth(m);
        }
      } finally {
        setLoadingCal(false);
      }
    },
    [lodging.slug],
  );

  useEffect(() => {
    setDays(initialDays);
    setYear(initialYear);
    setMonth(initialMonth);
  }, [initialDays, initialYear, initialMonth]);

  function onSelectDate(date: string, dayStatus: DayStatus) {
    if (dayStatus !== "disponible") return;
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(date);
      setCheckOut(null);
      return;
    }
    if (date <= checkIn) {
      setCheckIn(date);
      setCheckOut(null);
      return;
    }
    setCheckOut(date);
  }

  const summary = useMemo(() => {
    if (!checkIn || !checkOut || nights < 1) {
      return "Sélectionnez une arrivée puis un départ sur le calendrier.";
    }
    return `${nights} nuit${nights > 1 ? "s" : ""} · ${formatXof(total)} · acompte ${formatXof(deposit)}`;
  }, [checkIn, checkOut, nights, total, deposit]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!checkIn || !checkOut || nights < 1) {
      setStatus("error");
      setMessage("Choisissez vos dates sur le calendrier.");
      return;
    }

    setStatus("loading");
    setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lodgingSlug: lodging.slug,
          guestName: data.get("guestName"),
          guestEmail: data.get("guestEmail"),
          guestPhone: data.get("guestPhone"),
          guests: Number(data.get("guests") || 1),
          checkIn,
          checkOut,
          message: data.get("message"),
          paymentChannel: data.get("paymentChannel") || null,
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Échec de la demande");

      setStatus("success");
      setMessage(
        "Demande enregistrée. L’équipe FEBiS confirmera la réservation puis l’acompte.",
      );
      form.reset();
      setCheckIn(null);
      setCheckOut(null);
      await loadCalendar(year, month);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Une erreur est survenue.",
      );
    }
  }

  const bookingDisabled = lodging.status === "maintenance";

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <div className={loadingCal ? "opacity-60 transition-opacity" : ""}>
        <AvailabilityCalendar
          year={year}
          month={month}
          days={days}
          selectedCheckIn={checkIn}
          selectedCheckOut={checkOut}
          onMonthChange={loadCalendar}
          onSelectDate={bookingDisabled ? undefined : onSelectDate}
        />
      </div>

      <form
        onSubmit={onSubmit}
        className="booking-panel relative overflow-hidden rounded-[1.5rem] border border-febis-ink/8 bg-white/75 p-6 shadow-[0_30px_80px_rgba(160,16,24,0.08)] backdrop-blur-xl md:p-7"
      >
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-febis-orange/20 blur-2xl"
          aria-hidden
        />

        <p className="text-sm font-bold uppercase tracking-[0.2em] text-febis-red">
          Demande de réservation
        </p>
        <h3 className="mt-2 font-display text-2xl font-bold text-febis-ink">
          Étape 1 — Demande
        </h3>
        <p className="mt-2 text-sm text-febis-ink/60">{summary}</p>

        {bookingDisabled ? (
          <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            Logement en maintenance — réservation temporairement indisponible.
          </p>
        ) : (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-febis-ink/80">
                Nom
                <input required name="guestName" className="field-premium mt-2" />
              </label>
              <label className="text-sm font-semibold text-febis-ink/80">
                Email
                <input
                  required
                  type="email"
                  name="guestEmail"
                  className="field-premium mt-2"
                />
              </label>
              <label className="text-sm font-semibold text-febis-ink/80">
                Téléphone
                <input
                  required
                  name="guestPhone"
                  className="field-premium mt-2"
                  placeholder="+225 …"
                />
              </label>
              <label className="text-sm font-semibold text-febis-ink/80">
                Voyageurs
                <input
                  required
                  type="number"
                  name="guests"
                  min={1}
                  max={lodging.capacity}
                  defaultValue={1}
                  className="field-premium mt-2"
                />
              </label>
            </div>

            <label className="mt-3 block text-sm font-semibold text-febis-ink/80">
              Canal d’acompte souhaité
              <select name="paymentChannel" className="field-premium mt-2" defaultValue="">
                <option value="">À définir</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="virement">Virement</option>
                <option value="especes">Espèces</option>
              </select>
            </label>

            <label className="mt-3 block text-sm font-semibold text-febis-ink/80">
              Message
              <textarea
                name="message"
                rows={3}
                className="field-premium mt-2 resize-y"
                placeholder="Besoins particuliers, heure d’arrivée…"
              />
            </label>

            {nights > 0 && (
              <div className="mt-4 rounded-xl bg-febis-mist/80 px-4 py-3 text-sm">
                <div className="flex justify-between font-semibold text-febis-ink">
                  <span>Total séjour</span>
                  <span>{formatXof(total)}</span>
                </div>
                <div className="mt-1 flex justify-between text-febis-ink/65">
                  <span>Acompte indicatif ({lodging.depositPercent}%)</span>
                  <span>{formatXof(deposit)}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="cta-premium mt-5 w-full disabled:opacity-70"
            >
              {status === "loading" ? "Envoi…" : "Envoyer la demande"}
            </button>
          </>
        )}

        {message && (
          <p
            className={
              status === "success"
                ? "mt-4 text-sm font-semibold text-emerald-700"
                : "mt-4 text-sm font-semibold text-febis-red"
            }
            role="status"
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { CalendarDay, DayStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function leadingBlanks(year: number, month: number) {
  const jsDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  return (jsDay + 6) % 7; // Monday-first
}

type Props = {
  year: number;
  month: number;
  days: CalendarDay[];
  selectedCheckIn?: string | null;
  selectedCheckOut?: string | null;
  onMonthChange: (year: number, month: number) => void;
  onSelectDate?: (date: string, status: DayStatus) => void;
};

export function AvailabilityCalendar({
  year,
  month,
  days,
  selectedCheckIn,
  selectedCheckOut,
  onMonthChange,
  onSelectDate,
}: Props) {
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  function shiftMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    onMonthChange(d.getFullYear(), d.getMonth() + 1);
  }

  function inRange(date: string) {
    if (!selectedCheckIn) return false;
    const end = selectedCheckOut ?? hoverDate;
    if (!end) return date === selectedCheckIn;
    const a = selectedCheckIn < end ? selectedCheckIn : end;
    const b = selectedCheckIn < end ? end : selectedCheckIn;
    return date >= a && date < b;
  }

  const blanks = leadingBlanks(year, month);

  return (
    <div className="calendar-panel">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          className="calendar-nav-btn"
          onClick={() => shiftMonth(-1)}
          aria-label="Mois précédent"
        >
          ←
        </button>
        <h3 className="font-display text-xl font-bold capitalize text-febis-ink">
          {monthLabel(year, month)}
        </h3>
        <button
          type="button"
          className="calendar-nav-btn"
          onClick={() => shiftMonth(1)}
          aria-label="Mois suivant"
        >
          →
        </button>
      </div>

      <div className="mb-4 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wider text-febis-ink/45">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: blanks }).map((_, i) => (
          <span key={`b-${i}`} />
        ))}
        {days.map((day) => {
          const dayNum = Number(day.date.slice(-2));
          const selected =
            day.date === selectedCheckIn || day.date === selectedCheckOut;
          const ranged = inRange(day.date);
          const disabled = day.status !== "disponible";

          return (
            <button
              key={day.date}
              type="button"
              disabled={disabled || !onSelectDate}
              title={`${day.date} — ${day.label}`}
              onMouseEnter={() => setHoverDate(day.date)}
              onMouseLeave={() => setHoverDate(null)}
              onClick={() => onSelectDate?.(day.date, day.status)}
              className={cn(
                "calendar-day",
                day.status === "disponible" && "is-available",
                day.status === "reserve" && "is-reserved",
                day.status === "maintenance" && "is-maintenance",
                selected && "is-selected",
                ranged && "is-range",
              )}
            >
              <span className="calendar-day-num">{dayNum}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold text-febis-ink/65">
        <span className="inline-flex items-center gap-2">
          <i className="legend-dot legend-available" /> Disponible
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="legend-dot legend-reserved" /> Réservé
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="legend-dot legend-maintenance" /> Maintenance
        </span>
      </div>
    </div>
  );
}

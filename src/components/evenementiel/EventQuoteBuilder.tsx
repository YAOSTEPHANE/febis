"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import {
  buildQuoteLine,
  daysBetween,
  equipmentCategoryLabel,
  equipmentStatusLabel,
  formatXof,
  type PublicEquipment,
} from "@/lib/evenementiel";
import { cn } from "@/lib/cn";

type QtyMap = Record<string, number>;

export function EventQuoteBuilder({
  equipment,
}: {
  equipment: PublicEquipment[];
}) {
  const [quantities, setQuantities] = useState<QtyMap>({});
  const [eventDate, setEventDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [quoteSummary, setQuoteSummary] = useState<{
    rentalTotal: number;
    depositTotal: number;
    id: string;
  } | null>(null);

  const selectedLines = useMemo(() => {
    if (!eventDate || !returnDate || returnDate <= eventDate) return [];
    const days = daysBetween(eventDate, returnDate);
    return equipment
      .filter((item) => (quantities[item.slug] ?? 0) > 0)
      .map((item) =>
        buildQuoteLine({
          equipment: item,
          quantity: quantities[item.slug] ?? 0,
          days,
        }),
      );
  }, [equipment, quantities, eventDate, returnDate]);

  const rentalTotal = selectedLines.reduce((s, l) => s + l.lineTotal, 0);
  const depositTotal = selectedLines.reduce((s, l) => s + l.lineDeposit, 0);

  function setQty(slug: string, value: number, max: number) {
    const next = Math.max(0, Math.min(max, value));
    setQuantities((prev) => ({ ...prev, [slug]: next }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    setQuoteSummary(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([slug, quantity]) => ({ slug, quantity }));

    try {
      const res = await fetch("/api/evenementiel/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: data.get("clientName"),
          clientEmail: data.get("clientEmail"),
          clientPhone: data.get("clientPhone"),
          eventDate,
          returnDate,
          message: data.get("message"),
          items,
        }),
      });
      const payload = (await res.json()) as {
        error?: string;
        quote?: { id: string; rentalTotal: number; depositTotal: number };
      };
      if (!res.ok) throw new Error(payload.error ?? "Échec du devis");

      setStatus("success");
      setMessage("Devis généré. L’équipe FEBiS vous recontacte pour confirmation.");
      if (payload.quote) {
        setQuoteSummary({
          id: payload.quote.id,
          rentalTotal: payload.quote.rentalTotal,
          depositTotal: payload.quote.depositTotal,
        });
      }
      setQuantities({});
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Une erreur est survenue.",
      );
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-4">
        {equipment.map((item) => {
          const disabled =
            item.status !== "disponible" || item.quantityAvailable < 1;
          const qty = quantities[item.slug] ?? 0;

          return (
            <article
              key={item.slug}
              className="flex flex-col gap-4 rounded-[1.25rem] border border-febis-ink/8 bg-white/70 p-4 backdrop-blur sm:flex-row"
            >
              <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-36">
                <Image
                  src={item.photo}
                  alt={item.name}
                  fill
                  sizes="144px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-febis-red">
                      {equipmentCategoryLabel(item.category)}
                    </p>
                    <h3 className="font-display text-xl font-bold text-febis-ink">
                      {item.name}
                    </h3>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
                      item.status === "disponible" && item.quantityAvailable > 0
                        ? "bg-emerald-500/15 text-emerald-800"
                        : item.status === "maintenance"
                          ? "bg-amber-500/15 text-amber-900"
                          : "bg-febis-red/12 text-febis-red-deep",
                    )}
                  >
                    {item.status === "disponible" && item.quantityAvailable > 0
                      ? `${item.quantityAvailable}/${item.quantityTotal} dispo`
                      : equipmentStatusLabel(item.status)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-febis-ink/60">{item.description}</p>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                  <div className="flex gap-5 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-febis-ink/45">
                        Prix / jour
                      </p>
                      <p className="font-bold text-febis-red">
                        {formatXof(item.pricePerDay)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-febis-ink/45">
                        Caution
                      </p>
                      <p className="font-bold text-febis-ink">
                        {formatXof(item.depositAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-febis-ink/45">
                        Pénalité
                      </p>
                      <p className="font-semibold text-febis-ink/80">
                        {formatXof(item.penaltyPerDamage)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={disabled || qty <= 0}
                      onClick={() => setQty(item.slug, qty - 1, item.quantityAvailable)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-febis-ink/15 disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-bold">{qty}</span>
                    <button
                      type="button"
                      disabled={disabled || qty >= item.quantityAvailable}
                      onClick={() => setQty(item.slug, qty + 1, item.quantityAvailable)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-febis-ink/15 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <form
        onSubmit={onSubmit}
        className="h-fit rounded-[1.5rem] border border-febis-ink/8 bg-white/80 p-6 shadow-[0_30px_80px_rgba(160,16,24,0.08)] backdrop-blur-xl lg:sticky lg:top-24"
      >
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-febis-red">
          Devis de location
        </p>
        <h3 className="mt-2 font-display text-2xl font-bold text-febis-ink">
          Générer un devis
        </h3>

        <div className="mt-5 grid gap-3">
          <label className="text-sm font-semibold text-febis-ink/80">
            Nom
            <input required name="clientName" className="field-premium mt-2" />
          </label>
          <label className="text-sm font-semibold text-febis-ink/80">
            Email
            <input
              required
              type="email"
              name="clientEmail"
              className="field-premium mt-2"
            />
          </label>
          <label className="text-sm font-semibold text-febis-ink/80">
            Téléphone
            <input required name="clientPhone" className="field-premium mt-2" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-febis-ink/80">
              Date événement
              <input
                required
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="field-premium mt-2"
              />
            </label>
            <label className="text-sm font-semibold text-febis-ink/80">
              Date retour
              <input
                required
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="field-premium mt-2"
              />
            </label>
          </div>
          <label className="text-sm font-semibold text-febis-ink/80">
            Message
            <textarea
              name="message"
              rows={3}
              className="field-premium mt-2 resize-y"
              placeholder="Lieu, type d’événement…"
            />
          </label>
        </div>

        <div className="mt-5 rounded-xl bg-febis-mist/80 px-4 py-3 text-sm">
          <div className="flex justify-between font-semibold text-febis-ink">
            <span>Location</span>
            <span>{formatXof(rentalTotal)}</span>
          </div>
          <div className="mt-1 flex justify-between text-febis-ink/65">
            <span>Cautions</span>
            <span>{formatXof(depositTotal)}</span>
          </div>
          <p className="mt-2 text-xs text-febis-ink/50">
            {selectedLines.length} article(s) sélectionné(s)
          </p>
        </div>

        <button
          type="submit"
          disabled={status === "loading" || selectedLines.length === 0}
          className="cta-premium mt-5 w-full disabled:opacity-60"
        >
          {status === "loading" ? "Génération…" : "Générer le devis"}
        </button>

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
            {quoteSummary
              ? ` · Total ${formatXof(quoteSummary.rentalTotal)} + caution ${formatXof(quoteSummary.depositTotal)}`
              : ""}
          </p>
        )}
      </form>
    </div>
  );
}

"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import {
  buildQuoteLine,
  daysBetween,
  EQUIPMENT_CATEGORIES,
  equipmentCategoryLabel,
  equipmentStatusLabel,
  formatXof,
  type PublicEquipment,
} from "@/lib/evenementiel";
import { paymentChannelLabel } from "@/lib/finance-shared";
import { cn } from "@/lib/cn";

type QtyMap = Record<string, number>;
type Step = 1 | 2 | 3;

const EVENT_TYPES = [
  "Mariage",
  "Anniversaire",
  "Gala / Soirée",
  "Conférence / Séminaire",
  "Baptême / Communion",
  "Lancement produit",
  "Autre",
] as const;

const DEPOSIT_CHANNELS = ["wave", "orange_money", "mtn_money"] as const;

const STEPS = [
  { id: 1 as const, label: "Matériel", hint: "Sélection" },
  { id: 2 as const, label: "Événement", hint: "Dates & lieu" },
  { id: 3 as const, label: "Coordonnées", hint: "Validation" },
];

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function EventQuoteBuilder({
  equipment,
}: {
  equipment: PublicEquipment[];
}) {
  const [step, setStep] = useState<Step>(1);
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [quantities, setQuantities] = useState<QtyMap>({});
  const [eventDate, setEventDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [eventType, setEventType] = useState<string>(EVENT_TYPES[0]);
  const [location, setLocation] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [note, setNote] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [paymentChannel, setPaymentChannel] =
    useState<(typeof DEPOSIT_CHANNELS)[number]>("wave");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [quoteSummary, setQuoteSummary] = useState<{
    rentalTotal: number;
    depositTotal: number;
    id: string;
    reference?: string;
  } | null>(null);

  const minDate = todayIso();
  const datesReady = Boolean(
    eventDate && returnDate && returnDate > eventDate,
  );
  const rentalDays = datesReady ? daysBetween(eventDate, returnDate) : 1;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return equipment.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        equipmentCategoryLabel(item.category).toLowerCase().includes(q)
      );
    });
  }, [equipment, category, query]);

  const selectedLines = useMemo(() => {
    return equipment
      .filter((item) => (quantities[item.slug] ?? 0) > 0)
      .map((item) =>
        buildQuoteLine({
          equipment: item,
          quantity: quantities[item.slug] ?? 0,
          days: rentalDays,
        }),
      );
  }, [equipment, quantities, rentalDays]);

  const selectedUnits = selectedLines.reduce((s, l) => s + l.quantity, 0);
  const rentalTotal = selectedLines.reduce((s, l) => s + l.lineTotal, 0);
  const depositTotal = selectedLines.reduce((s, l) => s + l.lineDeposit, 0);
  const grandTotal = rentalTotal + depositTotal;

  function setQty(slug: string, value: number, max: number) {
    const next = Math.max(0, Math.min(max, value));
    setQuantities((prev) => {
      if (next === 0) {
        const rest = { ...prev };
        delete rest[slug];
        return rest;
      }
      return { ...prev, [slug]: next };
    });
  }

  function resetForm() {
    setQuantities({});
    setEventDate("");
    setReturnDate("");
    setEventType(EVENT_TYPES[0]);
    setLocation("");
    setGuestCount("");
    setNote("");
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setPaymentChannel("wave");
    setStep(1);
    setQuery("");
    setCategory("all");
  }

  function goNext() {
    if (step === 1) {
      if (selectedLines.length === 0) {
        setStatus("error");
        setMessage("Ajoutez au moins un article au devis.");
        return;
      }
      setStatus("idle");
      setMessage("");
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!datesReady) {
        setStatus("error");
        setMessage(
          "Indiquez des dates valides (retour strictement après l’événement).",
        );
        return;
      }
      if (location.trim().length < 2) {
        setStatus("error");
        setMessage("Indiquez le lieu de l’événement.");
        return;
      }
      setStatus("idle");
      setMessage("");
      setStep(3);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== 3) {
      goNext();
      return;
    }

    setStatus("loading");
    setMessage("");
    setQuoteSummary(null);

    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([slug, quantity]) => ({ slug, quantity }));

    const guests = guestCount.trim()
      ? Number.parseInt(guestCount, 10)
      : undefined;

    try {
      const res = await fetch("/api/evenementiel/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientEmail,
          clientPhone,
          eventDate,
          returnDate,
          eventType,
          location: location.trim(),
          guestCount: guests,
          message: note.trim() || undefined,
          items,
        }),
      });
      const payload = (await res.json()) as {
        error?: string;
        quote?: {
          id: string;
          rentalTotal: number;
          depositTotal: number;
        };
      };
      if (!res.ok) throw new Error(payload.error ?? "Échec du devis");

      let payHint = "";
      let reference: string | undefined;
      if (payload.quote && payload.quote.depositTotal > 0) {
        try {
          const payRes = await fetch("/api/payments/initiate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceType: "evenementiel",
              sourceId: payload.quote.id,
              amount: payload.quote.depositTotal,
              channel: paymentChannel,
              title: `Caution événementiel · ${payload.quote.id.slice(0, 8)}`,
              clientName,
              clientEmail,
              clientPhone,
            }),
          });
          const payJson = (await payRes.json()) as {
            intent?: { reference: string };
            error?: string;
          };
          if (payRes.ok && payJson.intent) {
            reference = payJson.intent.reference;
            payHint = ` Intent caution ${reference} créé — confirmation FEBiS à suivre.`;
          }
        } catch {
          /* devis OK sans intent */
        }
      }

      setStatus("success");
      setMessage(
        `Devis envoyé. L’équipe FEBiS vous recontacte pour confirmation.${payHint}`,
      );
      if (payload.quote) {
        setQuoteSummary({
          id: payload.quote.id,
          rentalTotal: payload.quote.rentalTotal,
          depositTotal: payload.quote.depositTotal,
          reference,
        });
      }
      resetForm();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Une erreur est survenue.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <nav
        aria-label="Étapes du devis"
        className="glass-panel flex flex-wrap items-center gap-2 p-3 sm:gap-3 sm:p-4"
      >
        {STEPS.map((s, index) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <button
              key={s.id}
              type="button"
              disabled={s.id > step && selectedLines.length === 0}
              onClick={() => {
                if (s.id < step || (s.id === 2 && selectedLines.length > 0)) {
                  setStep(s.id);
                  setStatus("idle");
                  setMessage("");
                }
                if (s.id === 3 && selectedLines.length > 0 && datesReady) {
                  setStep(3);
                  setStatus("idle");
                  setMessage("");
                }
              }}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition sm:px-4",
                active && "bg-febis-red text-white shadow-[0_12px_28px_rgba(160,16,24,0.28)]",
                done && !active && "bg-febis-red/8 text-febis-red",
                !active && !done && "bg-white/70 text-febis-ink/55",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold",
                  active && "bg-white/20 text-white",
                  done && !active && "bg-febis-red text-white",
                  !active && !done && "bg-febis-ink/8 text-febis-ink/50",
                )}
              >
                {done ? "✓" : String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{s.label}</span>
                <span
                  className={cn(
                    "hidden text-[11px] sm:block",
                    active ? "text-white/75" : "text-febis-ink/45",
                  )}
                >
                  {s.hint}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <form
        onSubmit={onSubmit}
        className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]"
      >
        <div className="min-w-0 space-y-4">
          {step === 1 ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">Rechercher un article</span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher une chaise, sono, tente…"
                    className="field-premium w-full"
                  />
                </label>
                <p className="shrink-0 text-xs font-semibold text-febis-ink/45 sm:text-sm">
                  {filtered.length} article(s)
                </p>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setCategory("all")}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition",
                    category === "all"
                      ? "border-transparent bg-febis-red text-white"
                      : "border-febis-ink/10 bg-white/80 text-febis-ink/60 hover:border-febis-red/25",
                  )}
                >
                  Tout
                </button>
                {EQUIPMENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition",
                      category === cat
                        ? "border-transparent bg-febis-red text-white"
                        : "border-febis-ink/10 bg-white/80 text-febis-ink/60 hover:border-febis-red/25",
                    )}
                  >
                    {equipmentCategoryLabel(cat)}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filtered.length === 0 ? (
                  <div className="glass-panel px-5 py-10 text-center text-sm text-febis-ink/55">
                    Aucun article ne correspond à votre recherche.
                  </div>
                ) : (
                  filtered.map((item) => {
                    const disabled =
                      item.status !== "disponible" ||
                      item.quantityAvailable < 1;
                    const qty = quantities[item.slug] ?? 0;
                    const selected = qty > 0;

                    return (
                      <article
                        key={item.slug}
                        className={cn(
                          "glass-panel flex flex-col gap-4 p-4 transition sm:flex-row",
                          selected &&
                            "ring-1 ring-febis-red/25 shadow-[0_16px_40px_rgba(160,16,24,0.1)]",
                          disabled && "opacity-70",
                        )}
                      >
                        <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-36">
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
                                item.status === "disponible" &&
                                  item.quantityAvailable > 0
                                  ? "bg-emerald-500/15 text-emerald-800"
                                  : item.status === "maintenance"
                                    ? "bg-amber-500/15 text-amber-900"
                                    : "bg-febis-red/12 text-febis-red-deep",
                              )}
                            >
                              {item.status === "disponible" &&
                              item.quantityAvailable > 0
                                ? `${item.quantityAvailable}/${item.quantityTotal} dispo`
                                : equipmentStatusLabel(item.status)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-febis-ink/60">
                            {item.description}
                          </p>
                          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                            <div className="flex flex-wrap gap-4 text-sm sm:gap-5">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-febis-ink/45">
                                  Prix / jour
                                </p>
                                <p className="font-bold text-febis-red">
                                  {formatXof(item.pricePerDay)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-febis-ink/45">
                                  Caution
                                </p>
                                <p className="font-bold text-febis-ink">
                                  {formatXof(item.depositAmount)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-febis-ink/45">
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
                                aria-label={`Retirer ${item.name}`}
                                onClick={() =>
                                  setQty(
                                    item.slug,
                                    qty - 1,
                                    item.quantityAvailable,
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-febis-ink/15 transition hover:border-febis-red/30 disabled:opacity-40"
                              >
                                −
                              </button>
                              <span className="w-8 text-center font-bold tabular-nums">
                                {qty}
                              </span>
                              <button
                                type="button"
                                disabled={
                                  disabled || qty >= item.quantityAvailable
                                }
                                aria-label={`Ajouter ${item.name}`}
                                onClick={() =>
                                  setQty(
                                    item.slug,
                                    qty + 1,
                                    item.quantityAvailable,
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-febis-ink/15 transition hover:border-febis-red/30 disabled:opacity-40"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <div className="glass-panel space-y-4 p-5 sm:p-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-febis-red">
                  Détails événement
                </p>
                <h3 className="mt-1 font-display text-2xl font-bold text-febis-ink">
                  Quand et où ?
                </h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold text-febis-ink/80">
                  Date événement *
                  <input
                    required
                    type="date"
                    min={minDate}
                    value={eventDate}
                    onChange={(e) => {
                      const next = e.target.value;
                      setEventDate(next);
                      if (returnDate && returnDate <= next) {
                        setReturnDate("");
                      }
                    }}
                    className="field-premium mt-2"
                  />
                </label>
                <label className="text-sm font-semibold text-febis-ink/80">
                  Date retour *
                  <input
                    required
                    type="date"
                    min={eventDate || minDate}
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="field-premium mt-2"
                  />
                </label>
                <label className="text-sm font-semibold text-febis-ink/80">
                  Type d’événement
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="field-premium mt-2"
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-febis-ink/80">
                  Invités (approx.)
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    inputMode="numeric"
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    placeholder="ex. 150"
                    className="field-premium mt-2"
                  />
                </label>
              </div>

              <label className="block text-sm font-semibold text-febis-ink/80">
                Lieu *
                <input
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Abidjan, Cocody — Villa…"
                  className="field-premium mt-2"
                />
              </label>

              <label className="block text-sm font-semibold text-febis-ink/80">
                Précisions
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  className="field-premium mt-2 resize-y"
                  placeholder="Accès, horaires de montage, contraintes techniques…"
                />
              </label>

              {datesReady ? (
                <p className="rounded-xl bg-febis-mist/80 px-4 py-3 text-sm text-febis-ink/70">
                  Location calculée sur{" "}
                  <strong className="text-febis-ink">
                    {rentalDays} jour{rentalDays > 1 ? "s" : ""}
                  </strong>{" "}
                  ({eventDate} → {returnDate}).
                </p>
              ) : (
                <p className="rounded-xl bg-febis-orange/10 px-4 py-3 text-sm font-semibold text-febis-orange">
                  La date de retour doit être postérieure à la date
                  d’événement.
                </p>
              )}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="glass-panel space-y-4 p-5 sm:p-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-febis-red">
                  Vos coordonnées
                </p>
                <h3 className="mt-1 font-display text-2xl font-bold text-febis-ink">
                  Finaliser le devis
                </h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold text-febis-ink/80 sm:col-span-2">
                  Nom complet *
                  <input
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    autoComplete="name"
                    className="field-premium mt-2"
                  />
                </label>
                <label className="text-sm font-semibold text-febis-ink/80">
                  Email *
                  <input
                    required
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    autoComplete="email"
                    className="field-premium mt-2"
                  />
                </label>
                <label className="text-sm font-semibold text-febis-ink/80">
                  Téléphone *
                  <input
                    required
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="+225 …"
                    className="field-premium mt-2"
                  />
                </label>
              </div>

              {depositTotal > 0 ? (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-semibold text-febis-ink/80">
                    Canal pour la caution ({formatXof(depositTotal)})
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {DEPOSIT_CHANNELS.map((channel) => (
                      <label
                        key={channel}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
                          paymentChannel === channel
                            ? "border-febis-red/35 bg-febis-red/5 text-febis-red"
                            : "border-febis-ink/10 bg-white/80 text-febis-ink/70 hover:border-febis-red/20",
                        )}
                      >
                        <input
                          type="radio"
                          name="paymentChannel"
                          value={channel}
                          checked={paymentChannel === channel}
                          onChange={() => setPaymentChannel(channel)}
                          className="sr-only"
                        />
                        {paymentChannelLabel(channel)}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-febis-ink/45">
                    Un intent de paiement caution est créé à l’envoi ; FEBiS
                    confirme ensuite le règlement.
                  </p>
                </fieldset>
              ) : null}

              <div className="rounded-xl border border-febis-ink/8 bg-febis-mist/60 px-4 py-3 text-sm text-febis-ink/70">
                <p>
                  <span className="font-semibold text-febis-ink">Récap :</span>{" "}
                  {eventType}
                  {location ? ` · ${location}` : ""}
                  {guestCount ? ` · ~${guestCount} invités` : ""}
                </p>
                <p className="mt-1">
                  {eventDate} → {returnDate} · {rentalDays} j. ·{" "}
                  {selectedLines.length} article(s)
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="glass-panel p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full bg-febis-red/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-febis-red">
                Devis live
              </span>
              <span className="text-xs font-semibold text-febis-ink/45">
                Étape {step}/3
              </span>
            </div>
            <h3 className="font-display text-2xl font-bold text-febis-ink">
              Votre sélection
            </h3>

            {selectedLines.length === 0 ? (
              <p className="mt-4 text-sm text-febis-ink/50">
                Ajoutez du matériel pour construire le devis.
              </p>
            ) : (
              <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
                {selectedLines.map((line) => (
                  <li
                    key={line.equipmentSlug}
                    className="flex items-start justify-between gap-3 rounded-xl bg-febis-mist/70 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-febis-ink">
                        {line.equipmentName}
                      </p>
                      <p className="text-xs text-febis-ink/50">
                        {line.quantity} × {formatXof(line.unitPrice)} ×{" "}
                        {line.days} j.
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-febis-ink">
                        {formatXof(line.lineTotal)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setQty(line.equipmentSlug, 0, 0)}
                        className="text-[11px] font-bold text-febis-red hover:underline"
                      >
                        Retirer
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 space-y-1.5 border-t border-febis-ink/8 pt-4 text-sm">
              <div className="flex justify-between font-semibold text-febis-ink">
                <span>
                  Location
                  {selectedLines.length > 0 ? (
                    <span className="ml-1 font-normal text-febis-ink/45">
                      ({datesReady ? `${rentalDays} j.` : "1 j. estimé"})
                    </span>
                  ) : null}
                </span>
                <span>{formatXof(rentalTotal)}</span>
              </div>
              <div className="flex justify-between text-febis-ink/65">
                <span>Cautions</span>
                <span>{formatXof(depositTotal)}</span>
              </div>
              <div className="flex justify-between border-t border-febis-ink/8 pt-2 font-display text-lg font-bold text-febis-ink">
                <span>Total</span>
                <span className="text-febis-red">{formatXof(grandTotal)}</span>
              </div>
              <p className="pt-1 text-xs text-febis-ink/45">
                {selectedLines.length} article(s) · {selectedUnits} unité(s)
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setStep((s) => (s === 3 ? 2 : 1));
                    setStatus("idle");
                    setMessage("");
                  }}
                  className="rounded-full border border-febis-ink/12 bg-white/90 px-4 py-2.5 text-sm font-bold text-febis-ink transition hover:border-febis-ink/25"
                >
                  Retour
                </button>
              ) : null}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={
                    (step === 1 && selectedLines.length === 0) ||
                    (step === 2 && (!datesReady || location.trim().length < 2))
                  }
                  className="cta-premium w-full disabled:opacity-60"
                >
                  Continuer
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={
                    status === "loading" ||
                    selectedLines.length === 0 ||
                    !datesReady
                  }
                  className="cta-premium w-full disabled:opacity-60"
                >
                  {status === "loading" ? "Envoi du devis…" : "Envoyer le devis"}
                </button>
              )}
            </div>

            {message ? (
              <p
                className={
                  status === "success"
                    ? "status-banner is-success mt-4"
                    : status === "loading"
                      ? "status-banner is-loading mt-4"
                      : "status-banner is-error mt-4"
                }
                role="status"
              >
                {message}
              </p>
            ) : null}

            {quoteSummary && status === "success" ? (
              <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-950">
                <p className="font-bold">
                  Réf. {quoteSummary.id.slice(0, 10).toUpperCase()}
                </p>
                <p className="mt-1">
                  Location {formatXof(quoteSummary.rentalTotal)} + caution{" "}
                  {formatXof(quoteSummary.depositTotal)}
                </p>
                {quoteSummary.reference ? (
                  <p className="mt-1 text-xs opacity-80">
                    Caution : {quoteSummary.reference}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </aside>
      </form>
    </div>
  );
}

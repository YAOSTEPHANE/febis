"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  BTP_QUOTE_CATEGORIES,
  btpQuoteCategoryLabel,
  btpQuoteUnitLabel,
  buildHouseQuoteLines,
  defaultSelectedCodes,
  estimateCatalogQuantity,
  FINISH_LEVELS,
  finishLevelLabel,
  HOUSE_BUILD_CATALOG,
  sumQuoteLines,
  type FinishLevel,
} from "@/lib/btp-quote-catalog";
import { formatXof } from "@/lib/btp-shared";
import { cn } from "@/lib/cn";

type Step = 1 | 2 | 3;

const STEPS = [
  { id: 1 as const, label: "Maison", hint: "Programme" },
  { id: 2 as const, label: "Lots", hint: "Construction" },
  { id: 3 as const, label: "Contact", hint: "Envoi devis" },
];

export function BtpHouseQuoteBuilder() {
  const [step, setStep] = useState<Step>(1);
  const [surfaceM2, setSurfaceM2] = useState(120);
  const [floors, setFloors] = useState(1);
  const [rooms, setRooms] = useState(4);
  const [finishLevel, setFinishLevel] = useState<FinishLevel>("standard");
  const [includeExterior, setIncludeExterior] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(defaultSelectedCodes(true)),
  );
  const [qtyOverrides, setQtyOverrides] = useState<Record<string, number>>({});
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");

  const houseSpec = useMemo(
    () => ({
      surfaceM2,
      floors,
      rooms,
      finishLevel,
      includeExterior,
    }),
    [surfaceM2, floors, rooms, finishLevel, includeExterior],
  );

  const lines = useMemo(
    () =>
      buildHouseQuoteLines({
        spec: houseSpec,
        selectedCodes: Array.from(selected),
        quantityOverrides: qtyOverrides,
      }),
    [houseSpec, selected, qtyOverrides],
  );

  const total = sumQuoteLines(lines);
  const visibleCatalog = useMemo(() => {
    return HOUSE_BUILD_CATALOG.filter((item) => {
      if (item.exteriorOnly && !includeExterior) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [includeExterior, categoryFilter]);

  const linesByCategory = useMemo(() => {
    const map = new Map<string, typeof lines>();
    for (const line of lines) {
      const list = map.get(line.category) ?? [];
      list.push(line);
      map.set(line.category, list);
    }
    return map;
  }, [lines]);

  function toggleCode(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function selectAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const item of visibleCatalog) next.add(item.code);
      return next;
    });
  }

  function clearVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const item of visibleCatalog) next.delete(item.code);
      return next;
    });
  }

  function resetQuantities() {
    setQtyOverrides({});
  }

  function goNext() {
    if (step === 1) {
      if (surfaceM2 < 20) {
        setStatus("error");
        setMessage("Surface minimale : 20 m².");
        return;
      }
      setStatus("idle");
      setMessage("");
      setStep(2);
      return;
    }
    if (step === 2) {
      if (lines.length === 0) {
        setStatus("error");
        setMessage("Sélectionnez au moins un lot de construction.");
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
    setReference("");

    try {
      const res = await fetch("/api/btp/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientEmail: clientEmail || undefined,
          clientPhone,
          location,
          workType: "Construction maison",
          message: note.trim() || undefined,
          houseSpec,
          quoteLines: lines,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        project?: { reference: string; quoteAmount: number };
      };
      if (!res.ok) throw new Error(json.error ?? "Envoi impossible");

      setStatus("success");
      setReference(json.project?.reference ?? "");
      setMessage(
        `Devis chantier enregistré${
          json.project?.reference ? ` (${json.project.reference})` : ""
        }. Total estimatif ${formatXof(json.project?.quoteAmount ?? total)}. L’équipe BTP FEBiS vous recontacte.`,
      );
      setStep(1);
      setSelected(new Set(defaultSelectedCodes(true)));
      setQtyOverrides({});
      setClientName("");
      setClientPhone("");
      setClientEmail("");
      setLocation("");
      setNote("");
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
        aria-label="Étapes du devis chantier"
        className="glass-panel flex flex-wrap items-center gap-2 p-3 sm:gap-3 sm:p-4"
      >
        {STEPS.map((s, index) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (s.id <= step) {
                  setStep(s.id);
                  setStatus("idle");
                  setMessage("");
                }
              }}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition sm:px-4",
                active &&
                  "bg-febis-red text-white shadow-[0_12px_28px_rgba(160,16,24,0.28)]",
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
            <div className="glass-panel space-y-5 p-5 sm:p-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-febis-red">
                  Programme maison
                </p>
                <h3 className="mt-1 font-display text-2xl font-bold text-febis-ink">
                  Dimensions & niveau de finition
                </h3>
                <p className="mt-2 text-sm text-febis-ink/60">
                  Les quantités des lots (ciment, fer, carrelage, etc.) sont
                  estimées automatiquement, puis ajustables.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-sm font-semibold text-febis-ink/80">
                  Surface habitable (m²) *
                  <input
                    type="number"
                    min={20}
                    max={2000}
                    value={surfaceM2}
                    onChange={(e) =>
                      setSurfaceM2(Number(e.target.value) || 20)
                    }
                    className="field-premium mt-2"
                  />
                </label>
                <label className="text-sm font-semibold text-febis-ink/80">
                  Niveaux *
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={floors}
                    onChange={(e) => setFloors(Number(e.target.value) || 1)}
                    className="field-premium mt-2"
                  />
                </label>
                <label className="text-sm font-semibold text-febis-ink/80">
                  Pièces *
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={rooms}
                    onChange={(e) => setRooms(Number(e.target.value) || 1)}
                    className="field-premium mt-2"
                  />
                </label>
              </div>

              <fieldset>
                <legend className="text-sm font-semibold text-febis-ink/80">
                  Finition
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {FINISH_LEVELS.map((level) => (
                    <label
                      key={level}
                      className={cn(
                        "cursor-pointer rounded-xl border px-3 py-3 text-sm font-semibold transition",
                        finishLevel === level
                          ? "border-febis-red/35 bg-febis-red/5 text-febis-red"
                          : "border-febis-ink/10 bg-white/80 text-febis-ink/70 hover:border-febis-red/20",
                      )}
                    >
                      <input
                        type="radio"
                        name="finishLevel"
                        className="sr-only"
                        checked={finishLevel === level}
                        onChange={() => setFinishLevel(level)}
                      />
                      {finishLevelLabel(level)}
                      <span className="mt-1 block text-[11px] font-medium text-febis-ink/45">
                        {level === "standard"
                          ? "Matériaux courants"
                          : level === "confort"
                            ? "+25 % matériaux"
                            : "+55 % haut de gamme"}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="flex items-start gap-3 rounded-xl border border-febis-ink/10 bg-white/70 px-4 py-3 text-sm font-semibold text-febis-ink/80">
                <input
                  type="checkbox"
                  checked={includeExterior}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setIncludeExterior(next);
                    setSelected(new Set(defaultSelectedCodes(next)));
                    setQtyOverrides({});
                  }}
                  className="mt-0.5"
                />
                <span>
                  Inclure les lots extérieurs
                  <span className="mt-0.5 block text-xs font-medium text-febis-ink/45">
                    Clôture, portail, dallage, regard…
                  </span>
                </span>
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="glass-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-febis-red">
                    Lots de construction
                  </p>
                  <p className="mt-1 text-sm text-febis-ink/60">
                    {selected.size} sélectionné(s) · {lines.length} chiffré(s)
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={selectAllVisible}
                    className="rounded-full border border-febis-ink/12 bg-white/90 px-3 py-1.5 text-xs font-bold text-febis-ink"
                  >
                    Tout cocher
                  </button>
                  <button
                    type="button"
                    onClick={clearVisible}
                    className="rounded-full border border-febis-ink/12 bg-white/90 px-3 py-1.5 text-xs font-bold text-febis-ink"
                  >
                    Tout décocher
                  </button>
                  <button
                    type="button"
                    onClick={resetQuantities}
                    className="rounded-full border border-febis-ink/12 bg-white/90 px-3 py-1.5 text-xs font-bold text-febis-ink"
                  >
                    Reset quantités
                  </button>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition",
                    categoryFilter === "all"
                      ? "border-transparent bg-febis-red text-white"
                      : "border-febis-ink/10 bg-white/80 text-febis-ink/60",
                  )}
                >
                  Tous les lots
                </button>
                {BTP_QUOTE_CATEGORIES.filter(
                  (cat) => includeExterior || cat !== "exterieurs",
                ).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition",
                      categoryFilter === cat
                        ? "border-transparent bg-febis-red text-white"
                        : "border-febis-ink/10 bg-white/80 text-febis-ink/60",
                    )}
                  >
                    {btpQuoteCategoryLabel(cat)}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {visibleCatalog.map((item) => {
                  const checked = selected.has(item.code);
                  const estimated = estimateCatalogQuantity(item, houseSpec);
                  const qty = Object.prototype.hasOwnProperty.call(
                    qtyOverrides,
                    item.code,
                  )
                    ? (qtyOverrides[item.code] ?? 0)
                    : estimated;

                  return (
                    <article
                      key={item.code}
                      className={cn(
                        "glass-panel p-4 transition",
                        checked &&
                          "ring-1 ring-febis-red/25 shadow-[0_14px_36px_rgba(160,16,24,0.08)]",
                      )}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <label className="flex min-w-0 flex-1 cursor-pointer gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCode(item.code)}
                            className="mt-1"
                          />
                          <span className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-febis-red">
                              {btpQuoteCategoryLabel(item.category)} · {item.code}
                            </span>
                            <span className="mt-0.5 block font-display text-lg font-bold text-febis-ink">
                              {item.label}
                            </span>
                            <span className="mt-1 block text-sm text-febis-ink/55">
                              {item.description}
                            </span>
                            <span className="mt-2 block text-xs font-semibold text-febis-ink/45">
                              {formatXof(item.unitPrice)} /{" "}
                              {btpQuoteUnitLabel(item.unit)}
                              {finishLevel !== "standard"
                                ? ` · base standard (× finition ${finishLevelLabel(finishLevel).toLowerCase()})`
                                : ""}
                            </span>
                          </span>
                        </label>

                        <div className="flex shrink-0 items-center gap-2 sm:pt-1">
                          <button
                            type="button"
                            disabled={!checked || qty <= 0}
                            onClick={() =>
                              setQtyOverrides((prev) => ({
                                ...prev,
                                [item.code]: Math.max(0, qty - (item.unit === "u" || item.unit === "forfait" || item.unit === "sac" ? 1 : 0.5)),
                              }))
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-febis-ink/15 disabled:opacity-40"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            disabled={!checked}
                            min={0}
                            step={item.unit === "m2" || item.unit === "m3" || item.unit === "ml" ? 0.1 : 1}
                            value={checked ? qty : 0}
                            onChange={(e) =>
                              setQtyOverrides((prev) => ({
                                ...prev,
                                [item.code]: Math.max(
                                  0,
                                  Number(e.target.value) || 0,
                                ),
                              }))
                            }
                            className="field-premium w-24 !py-2 text-center text-sm"
                          />
                          <button
                            type="button"
                            disabled={!checked}
                            onClick={() =>
                              setQtyOverrides((prev) => ({
                                ...prev,
                                [item.code]:
                                  qty +
                                  (item.unit === "u" ||
                                  item.unit === "forfait" ||
                                  item.unit === "sac"
                                    ? 1
                                    : 0.5),
                              }))
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-febis-ink/15 disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="glass-panel space-y-4 p-5 sm:p-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-febis-red">
                  Coordonnées
                </p>
                <h3 className="mt-1 font-display text-2xl font-bold text-febis-ink">
                  Envoyer le devis chantier
                </h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold text-febis-ink/80 sm:col-span-2">
                  Nom complet *
                  <input
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
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
                    placeholder="+225 …"
                    className="field-premium mt-2"
                  />
                </label>
                <label className="text-sm font-semibold text-febis-ink/80">
                  Email
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="field-premium mt-2"
                  />
                </label>
                <label className="text-sm font-semibold text-febis-ink/80 sm:col-span-2">
                  Localisation du chantier *
                  <input
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Abidjan, Bingerville…"
                    className="field-premium mt-2"
                  />
                </label>
              </div>

              <label className="block text-sm font-semibold text-febis-ink/80">
                Précisions
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  className="field-premium mt-2 resize-y"
                  placeholder="Accès chantier, délais souhaités, contraintes…"
                />
              </label>

              <div className="rounded-xl border border-febis-ink/8 bg-febis-mist/60 px-4 py-3 text-sm text-febis-ink/70">
                <p>
                  <span className="font-semibold text-febis-ink">Maison :</span>{" "}
                  {surfaceM2} m² · {floors} niveau(x) · {rooms} pièce(s) ·{" "}
                  {finishLevelLabel(finishLevel)}
                  {includeExterior ? " · extérieurs inclus" : ""}
                </p>
                <p className="mt-1">
                  {lines.length} poste(s) · total estimatif{" "}
                  <strong className="text-febis-red">{formatXof(total)}</strong>
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
              Estimation chantier
            </h3>
            <p className="mt-1 text-sm text-febis-ink/55">
              Prix indicatifs XOF — confirmés après visite technique FEBiS.
            </p>

            {lines.length === 0 ? (
              <p className="mt-4 text-sm text-febis-ink/50">
                Aucun lot chiffré pour le moment.
              </p>
            ) : (
              <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
                {BTP_QUOTE_CATEGORIES.map((cat) => {
                  const catLines = linesByCategory.get(cat);
                  if (!catLines?.length) return null;
                  const sub = catLines.reduce((s, l) => s + l.lineTotal, 0);
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-febis-ink/45">
                        <span>{btpQuoteCategoryLabel(cat)}</span>
                        <span>{formatXof(sub)}</span>
                      </div>
                      <ul className="mt-1 space-y-1">
                        {catLines.map((line) => (
                          <li
                            key={line.code}
                            className="flex justify-between gap-2 text-sm text-febis-ink/75"
                          >
                            <span className="min-w-0 truncate">
                              {line.label}{" "}
                              <span className="text-febis-ink/40">
                                ({line.quantity} {btpQuoteUnitLabel(line.unit)})
                              </span>
                            </span>
                            <span className="shrink-0 font-semibold tabular-nums">
                              {formatXof(line.lineTotal)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-5 flex justify-between border-t border-febis-ink/8 pt-4 font-display text-lg font-bold text-febis-ink">
              <span>Total</span>
              <span className="text-febis-red">{formatXof(total)}</span>
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
                  className="rounded-full border border-febis-ink/12 bg-white/90 px-4 py-2.5 text-sm font-bold text-febis-ink"
                >
                  Retour
                </button>
              ) : null}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={step === 2 && lines.length === 0}
                  className="cta-premium w-full disabled:opacity-60"
                >
                  Continuer
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={status === "loading" || lines.length === 0}
                  className="cta-premium w-full disabled:opacity-60"
                >
                  {status === "loading"
                    ? "Envoi du devis…"
                    : "Envoyer le devis chantier"}
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

            {reference && status === "success" ? (
              <p className="mt-2 text-center text-xs font-bold text-emerald-800">
                Réf. {reference}
              </p>
            ) : null}
          </div>
        </aside>
      </form>
    </div>
  );
}

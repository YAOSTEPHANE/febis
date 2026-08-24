"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState, useTransition } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import {
  PAYMENT_CHANNELS,
  RESERVATION_STEPS,
  formatXof,
  paymentChannelLabel,
  stepLabel,
  type SerializedReservation,
} from "@/lib/residences-shared";
import { cn } from "@/lib/cn";

type LodgingOption = {
  slug: string;
  title: string;
  pricePerNight: number;
  status: string;
};

type Stats = {
  total: number;
  cancelled: number;
  demandes: number;
  enCours: number;
  revenue: number;
  deposits: number;
};

export function ReservationsAdminClient() {
  const [reservations, setReservations] = useState<SerializedReservation[]>([]);
  const [lodgings, setLodgings] = useState<LodgingOption[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [q, setQ] = useState("");
  const [step, setStep] = useState("all");
  const [lodgingSlug, setLodgingSlug] = useState("all");
  const [showCancelled, setShowCancelled] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (step !== "all") params.set("step", step);
      if (lodgingSlug !== "all") params.set("lodgingSlug", lodgingSlug);
      if (showCancelled) params.set("cancelled", "1");

      const [listRes, statsRes, lodRes] = await Promise.all([
        fetch(`/api/admin/reservations?${params}`),
        fetch("/api/admin/reservations?tab=stats"),
        fetch("/api/admin/reservations?tab=lodgings"),
      ]);
      const listJson = (await listRes.json()) as {
        reservations?: SerializedReservation[];
        error?: string;
      };
      const statsJson = (await statsRes.json()) as {
        stats?: Stats;
        error?: string;
      };
      const lodJson = (await lodRes.json()) as {
        lodgings?: LodgingOption[];
        error?: string;
      };
      if (!listRes.ok) throw new Error(listJson.error ?? "Erreur");
      if (!statsRes.ok) throw new Error(statsJson.error ?? "Erreur");
      if (!lodRes.ok) throw new Error(lodJson.error ?? "Erreur");
      setReservations(listJson.reservations ?? []);
      setStats(statsJson.stats ?? null);
      setLodgings(lodJson.lodgings ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }, [q, step, lodgingSlug, showCancelled]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        void load();
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [load]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lodgingSlug: data.get("lodgingSlug"),
          guestName: data.get("guestName"),
          guestEmail: data.get("guestEmail"),
          guestPhone: data.get("guestPhone"),
          checkIn: data.get("checkIn"),
          checkOut: data.get("checkOut"),
          guests: data.get("guests"),
          paymentChannel: data.get("paymentChannel") || null,
          step: data.get("step") || "demande",
          message: data.get("message"),
        }),
      });
      const json = (await res.json()) as {
        reservation?: SerializedReservation;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Création impossible");
      event.currentTarget.reset();
      await load();
      if (json.reservation?.id) {
        window.location.href = `/admin/dashboard/reservations/${json.reservation.id}`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Réservations résidences"
        description="Pipeline CDC : demande → réservation → acompte → check-in → check-out → état des lieux."
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-4 py-3 text-sm font-semibold text-febis-red">
          {error}
        </p>
      ) : null}

      {stats ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Actives", String(stats.total)],
            ["Demandes", String(stats.demandes)],
            ["En cours", String(stats.enCours)],
            ["CA confirmé", formatXof(stats.revenue)],
          ].map(([label, value]) => (
            <div key={label} className="admin-panel admin-panel-premium p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-febis-gold-deep">
                {label}
              </p>
              <p className="mt-2 font-display text-2xl font-extrabold text-febis-ink">
                {value}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-4">
          <div className="admin-panel admin-panel-premium p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
              Filtres
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Client, email, logement…"
                className="field-premium sm:col-span-2"
              />
              <select
                value={step}
                onChange={(e) => setStep(e.target.value)}
                className="field-premium"
              >
                <option value="all">Toutes les étapes</option>
                {RESERVATION_STEPS.map((s) => (
                  <option key={s} value={s}>
                    {stepLabel(s)}
                  </option>
                ))}
              </select>
              <select
                value={lodgingSlug}
                onChange={(e) => setLodgingSlug(e.target.value)}
                className="field-premium"
              >
                <option value="all">Tous les logements</option>
                {lodgings.map((l) => (
                  <option key={l.slug} value={l.slug}>
                    {l.title}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
                <input
                  type="checkbox"
                  checked={showCancelled}
                  onChange={(e) => setShowCancelled(e.target.checked)}
                />
                Inclure les annulées
              </label>
            </div>
          </div>

          <div className="admin-panel overflow-hidden">
            <div className="border-b border-febis-ink/8 px-5 py-3 text-sm font-semibold text-febis-ink/70">
              {pending ? "Chargement…" : `${reservations.length} réservation(s)`}
            </div>
            <div className="divide-y divide-febis-ink/8">
              {reservations.map((r) => (
                <Link
                  key={r.id}
                  href={`/admin/dashboard/reservations/${r.id}`}
                  className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 transition hover:bg-febis-cream/40"
                >
                  <div>
                    <p className="font-display text-lg font-bold text-febis-ink">
                      {r.guestName}
                      {r.cancelled ? (
                        <span className="ml-2 text-xs font-bold uppercase text-febis-ink/40">
                          annulée
                        </span>
                      ) : null}
                    </p>
                    <p className="text-sm text-febis-ink/55">
                      {r.lodgingTitle} · {r.checkIn} → {r.checkOut} ({r.nights}{" "}
                      n.)
                    </p>
                    <p className="mt-1 text-xs text-febis-ink/40">
                      {r.guestEmail} · {r.guestPhone}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                        r.step === "demande"
                          ? "bg-febis-orange/15 text-febis-orange"
                          : "bg-febis-red/10 text-febis-red",
                      )}
                    >
                      {stepLabel(r.step)}
                    </span>
                    <p className="mt-2 font-bold text-febis-ink">
                      {formatXof(r.totalAmount)}
                    </p>
                  </div>
                </Link>
              ))}
              {!pending && reservations.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-febis-ink/50">
                  Aucune réservation — créez-en une à droite ou via le site.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <form
          onSubmit={onCreate}
          className="admin-panel admin-panel-premium h-fit space-y-3 p-5"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
            Nouvelle réservation
          </p>
          <select name="lodgingSlug" required className="field-premium" defaultValue="">
            <option value="" disabled>
              Logement
            </option>
            {lodgings.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.title} · {formatXof(l.pricePerNight)}/nuit
              </option>
            ))}
          </select>
          <input name="guestName" required placeholder="Nom client" className="field-premium" />
          <input
            name="guestEmail"
            required
            type="email"
            placeholder="Email"
            className="field-premium"
          />
          <input name="guestPhone" required placeholder="Téléphone" className="field-premium" />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold">
              Arrivée
              <input name="checkIn" required type="date" className="field-premium mt-1" />
            </label>
            <label className="text-xs font-semibold">
              Départ
              <input name="checkOut" required type="date" className="field-premium mt-1" />
            </label>
          </div>
          <input
            name="guests"
            type="number"
            min={1}
            max={20}
            defaultValue={2}
            placeholder="Voyageurs"
            className="field-premium"
          />
          <select name="step" className="field-premium" defaultValue="demande">
            {RESERVATION_STEPS.map((s) => (
              <option key={s} value={s}>
                Démarrer à : {stepLabel(s)}
              </option>
            ))}
          </select>
          <select name="paymentChannel" className="field-premium" defaultValue="">
            <option value="">Canal paiement (opt.)</option>
            {PAYMENT_CHANNELS.map((c) => (
              <option key={c} value={c}>
                {paymentChannelLabel(c)}
              </option>
            ))}
          </select>
          <textarea name="message" rows={2} placeholder="Message" className="field-premium" />
          <button
            type="submit"
            disabled={creating}
            className="cta-premium w-full justify-center disabled:opacity-60"
          >
            {creating ? "Création…" : "Créer la réservation"}
          </button>
          <Link
            href="/admin/dashboard/residences"
            className="block text-center text-xs font-bold text-febis-red hover:underline"
          >
            Gérer les logements →
          </Link>
        </form>
      </div>
    </>
  );
}

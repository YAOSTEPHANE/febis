"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState, useTransition } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import { AdminFormOverlay } from "@/components/admin/AdminFormOverlay";
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

type FormState = {
  lodgingSlug: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  paymentChannel: string;
  step: string;
  message: string;
};

const emptyForm = (): FormState => ({
  lodgingSlug: "",
  guestName: "",
  guestEmail: "",
  guestPhone: "",
  checkIn: "",
  checkOut: "",
  guests: "2",
  paymentChannel: "",
  step: "demande",
  message: "",
});

function reservationToForm(r: SerializedReservation): FormState {
  return {
    lodgingSlug: r.lodgingSlug,
    guestName: r.guestName,
    guestEmail: r.guestEmail,
    guestPhone: r.guestPhone,
    checkIn: r.checkIn.slice(0, 10),
    checkOut: r.checkOut.slice(0, 10),
    guests: String(r.guests),
    paymentChannel: r.paymentChannel ?? "",
    step: r.step,
    message: r.message ?? "",
  };
}

export function ReservationsAdminClient() {
  const [reservations, setReservations] = useState<SerializedReservation[]>([]);
  const [lodgings, setLodgings] = useState<LodgingOption[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [q, setQ] = useState("");
  const [step, setStep] = useState("all");
  const [lodgingSlug, setLodgingSlug] = useState("all");
  const [showCancelled, setShowCancelled] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
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

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    setFormOpen(true);
  }

  function openEdit(r: SerializedReservation) {
    setEditingId(r.id);
    setForm(reservationToForm(r));
    setError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      lodgingSlug: form.lodgingSlug,
      guestName: form.guestName,
      guestEmail: form.guestEmail,
      guestPhone: form.guestPhone,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      guests: form.guests,
      paymentChannel: form.paymentChannel || null,
      step: form.step,
      message: form.message,
    };
    try {
      const res = await fetch(
        editingId
          ? `/api/admin/reservations/${editingId}`
          : "/api/admin/reservations",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = (await res.json()) as {
        reservation?: SerializedReservation;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Enregistrement impossible");
      closeForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function onCancelReservation(r: SerializedReservation) {
    if (!window.confirm(`Annuler la réservation de ${r.guestName} ?`)) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/reservations/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelled: true }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Annulation impossible");
      closeForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  const editing = editingId
    ? reservations.find((r) => r.id === editingId)
    : null;

  return (
    <>
      <AdminPageHeader
        title="Réservations résidences"
        description="Pipeline CDC : demande → réservation → acompte → check-in → check-out → état des lieux."
        actions={
          <button type="button" onClick={openCreate} className="cta-premium">
            + Nouvelle réservation
          </button>
        }
      />

      {error && !formOpen ? (
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

      <div className="admin-panel admin-panel-premium mb-4 p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
          Filtres
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        <p className="mt-2 text-sm text-febis-ink/45">
          {pending ? "Chargement…" : `${reservations.length} réservation(s)`}
        </p>
      </div>

      <div className="admin-panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-febis-mist/80 text-[11px] uppercase tracking-wider text-febis-ink/55">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Séjour</th>
              <th className="px-4 py-3">Étape</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-febis-ink/8">
            {reservations.map((r) => (
              <tr
                key={r.id}
                className={cn(r.cancelled && "opacity-50", "hover:bg-white/60")}
              >
                <td className="px-4 py-3">
                  <p className="font-semibold text-febis-ink">
                    {r.guestName}
                    {r.cancelled ? (
                      <span className="ml-2 text-[10px] font-bold uppercase text-febis-ink/40">
                        annulée
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-febis-ink/45">
                    {r.guestEmail} · {r.guestPhone}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-febis-ink">{r.lodgingTitle}</p>
                  <p className="text-xs text-febis-ink/45">
                    {r.checkIn} → {r.checkOut} ({r.nights} n.)
                  </p>
                </td>
                <td className="px-4 py-3">
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
                </td>
                <td className="px-4 py-3 font-bold text-febis-ink">
                  {formatXof(r.totalAmount)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
                      className="rounded-full border border-febis-ink/15 px-3 py-1.5 text-xs font-bold"
                    >
                      Modifier
                    </button>
                    <Link
                      href={`/admin/dashboard/reservations/${r.id}`}
                      className="rounded-full border border-febis-gold-deep/30 px-3 py-1.5 text-xs font-bold text-febis-gold-deep"
                    >
                      Pipeline
                    </Link>
                    {!r.cancelled ? (
                      <button
                        type="button"
                        onClick={() => void onCancelReservation(r)}
                        className="rounded-full border border-febis-red/25 px-3 py-1.5 text-xs font-bold text-febis-red"
                      >
                        Annuler
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {!pending && reservations.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-febis-ink/50"
                >
                  Aucune réservation —{" "}
                  <button
                    type="button"
                    onClick={openCreate}
                    className="font-bold text-febis-gold-deep underline"
                  >
                    en créer une
                  </button>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-center text-xs text-febis-ink/45">
        <Link
          href="/admin/dashboard/residences"
          className="font-bold text-febis-red hover:underline"
        >
          Gérer les logements →
        </Link>
      </p>

      <AdminFormOverlay
        open={formOpen}
        title={
          editingId ? "Modifier la réservation" : "Nouvelle réservation"
        }
        subtitle={
          editing
            ? `${editing.lodgingTitle} · ${editing.guestName}`
            : "Création manuelle admin"
        }
        onClose={closeForm}
        footer={
          <>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-full border border-febis-ink/15 px-4 py-2.5 text-sm font-bold"
            >
              Fermer
            </button>
            {editing && !editing.cancelled ? (
              <button
                type="button"
                onClick={() => void onCancelReservation(editing)}
                className="rounded-full border border-febis-red/25 px-4 py-2.5 text-sm font-bold text-febis-red"
              >
                Annuler
              </button>
            ) : null}
            {editingId ? (
              <Link
                href={`/admin/dashboard/reservations/${editingId}`}
                className="rounded-full border border-febis-gold-deep/30 px-4 py-2.5 text-sm font-bold text-febis-gold-deep"
              >
                Ouvrir le pipeline
              </Link>
            ) : null}
            <button
              type="submit"
              form="resa-form"
              disabled={saving}
              className="cta-premium ml-auto disabled:opacity-60"
            >
              {saving
                ? "Enregistrement…"
                : editingId
                  ? "Enregistrer"
                  : "Créer la réservation"}
            </button>
          </>
        }
      >
        {error && formOpen ? (
          <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-3 py-2 text-sm font-semibold text-febis-red">
            {error}
          </p>
        ) : null}
        <form id="resa-form" onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <select
            required
            value={form.lodgingSlug}
            onChange={(e) =>
              setForm((f) => ({ ...f, lodgingSlug: e.target.value }))
            }
            className="field-premium sm:col-span-2"
            disabled={Boolean(editingId)}
          >
            <option value="" disabled>
              Logement
            </option>
            {lodgings.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.title} · {formatXof(l.pricePerNight)}/nuit
              </option>
            ))}
          </select>
          <input
            required
            value={form.guestName}
            onChange={(e) =>
              setForm((f) => ({ ...f, guestName: e.target.value }))
            }
            placeholder="Nom client"
            className="field-premium sm:col-span-2"
          />
          <input
            required
            type="email"
            value={form.guestEmail}
            onChange={(e) =>
              setForm((f) => ({ ...f, guestEmail: e.target.value }))
            }
            placeholder="Email"
            className="field-premium"
          />
          <input
            required
            value={form.guestPhone}
            onChange={(e) =>
              setForm((f) => ({ ...f, guestPhone: e.target.value }))
            }
            placeholder="Téléphone"
            className="field-premium"
          />
          <label className="text-xs font-semibold">
            Arrivée
            <input
              required
              type="date"
              value={form.checkIn}
              onChange={(e) =>
                setForm((f) => ({ ...f, checkIn: e.target.value }))
              }
              className="field-premium mt-1"
            />
          </label>
          <label className="text-xs font-semibold">
            Départ
            <input
              required
              type="date"
              value={form.checkOut}
              onChange={(e) =>
                setForm((f) => ({ ...f, checkOut: e.target.value }))
              }
              className="field-premium mt-1"
            />
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={form.guests}
            onChange={(e) => setForm((f) => ({ ...f, guests: e.target.value }))}
            placeholder="Voyageurs"
            className="field-premium"
          />
          <select
            value={form.step}
            onChange={(e) => setForm((f) => ({ ...f, step: e.target.value }))}
            className="field-premium"
          >
            {RESERVATION_STEPS.map((s) => (
              <option key={s} value={s}>
                {stepLabel(s)}
              </option>
            ))}
          </select>
          <select
            value={form.paymentChannel}
            onChange={(e) =>
              setForm((f) => ({ ...f, paymentChannel: e.target.value }))
            }
            className="field-premium sm:col-span-2"
          >
            <option value="">Canal paiement (opt.)</option>
            {PAYMENT_CHANNELS.filter((c) => c !== "mobile_money").map((c) => (
              <option key={c} value={c}>
                {paymentChannelLabel(c)}
              </option>
            ))}
          </select>
          <textarea
            rows={2}
            value={form.message}
            onChange={(e) =>
              setForm((f) => ({ ...f, message: e.target.value }))
            }
            placeholder="Message"
            className="field-premium sm:col-span-2"
          />
        </form>
      </AdminFormOverlay>
    </>
  );
}

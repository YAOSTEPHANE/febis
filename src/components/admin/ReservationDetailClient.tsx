"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminPageHeader, AdminSaveButton } from "@/components/admin/AdminForms";
import {
  PAYMENT_CHANNELS,
  RESERVATION_STEPS,
  formatXof,
  paymentChannelLabel,
  stepLabel,
  type SerializedReservation,
} from "@/lib/residences-shared";
import { cn } from "@/lib/cn";

export function ReservationDetailClient() {
  const params = useParams<{ id: string }>();
  const [reservation, setReservation] = useState<SerializedReservation | null>(
    null,
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/reservations/${params.id}`);
      const json = (await res.json()) as {
        reservation?: SerializedReservation;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Introuvable");
      setReservation(json.reservation ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/reservations/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        reservation?: SerializedReservation;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      setReservation(json.reservation ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function onSaveNotes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await patch({
      inventoryNotes: data.get("inventoryNotes"),
      message: data.get("message"),
      guests: data.get("guests"),
      paymentChannel: data.get("paymentChannel") || null,
    });
  }

  if (loading) {
    return <p className="text-sm text-febis-ink/55">Chargement…</p>;
  }

  if (!reservation) {
    return (
      <div>
        <p className="text-sm font-semibold text-febis-red">
          {error || "Réservation introuvable"}
        </p>
        <Link
          href="/admin/dashboard/reservations"
          className="mt-4 inline-block text-sm font-bold text-febis-red hover:underline"
        >
          ← Retour
        </Link>
      </div>
    );
  }

  const currentIndex = RESERVATION_STEPS.indexOf(reservation.step);

  return (
    <>
      <AdminPageHeader
        title={reservation.guestName}
        description={`${reservation.lodgingTitle} · ${reservation.checkIn} → ${reservation.checkOut}`}
      />
      <Link
        href="/admin/dashboard/reservations"
        className="mb-5 inline-block text-sm font-bold text-febis-red hover:underline"
      >
        ← Liste des réservations
      </Link>

      {error ? (
        <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-4 py-3 text-sm font-semibold text-febis-red">
          {error}
        </p>
      ) : null}

      {reservation.cancelled ? (
        <p className="mb-4 rounded-xl border border-febis-ink/15 bg-febis-ink/5 px-4 py-3 text-sm font-semibold text-febis-ink/70">
          Cette réservation est annulée — les dates sont libérées.
        </p>
      ) : null}

      <div className="mb-6 admin-panel admin-panel-premium p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
          Pipeline CDC
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {RESERVATION_STEPS.map((s, index) => {
            const done = index <= currentIndex && !reservation.cancelled;
            const active = s === reservation.step && !reservation.cancelled;
            return (
              <button
                key={s}
                type="button"
                disabled={saving || reservation.cancelled}
                onClick={() => void patch({ step: s })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition",
                  active
                    ? "border-febis-red bg-febis-red text-white"
                    : done
                      ? "border-emerald-600/30 bg-emerald-50 text-emerald-800"
                      : "border-febis-ink/15 bg-white text-febis-ink/55",
                )}
              >
                {index + 1}. {stepLabel(s)}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-febis-ink/55">
          Cliquez une étape pour avancer le dossier. La confirmation « Réservation
          » bloque le calendrier.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="admin-panel space-y-3 p-5">
          <p className="text-sm font-bold text-febis-ink">Séjour</p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-febis-ink/50">Logement</dt>
              <dd className="font-semibold text-right">
                <Link
                  href={`/residences/${reservation.lodgingSlug}`}
                  className="text-febis-red hover:underline"
                  target="_blank"
                >
                  {reservation.lodgingTitle}
                </Link>
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-febis-ink/50">Nuits</dt>
              <dd className="font-semibold">{reservation.nights}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-febis-ink/50">Total</dt>
              <dd className="font-bold text-febis-red">
                {formatXof(reservation.totalAmount)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-febis-ink/50">Acompte</dt>
              <dd className="font-semibold">
                {formatXof(reservation.depositAmount)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-febis-ink/50">Étape</dt>
              <dd className="font-semibold">{stepLabel(reservation.step)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-febis-ink/50">Paiement</dt>
              <dd className="font-semibold">
                {paymentChannelLabel(reservation.paymentChannel)}
              </dd>
            </div>
          </dl>
          <p className="pt-2 text-xs text-febis-ink/40">
            Créée le{" "}
            {new Date(reservation.createdAt).toLocaleString("fr-FR")}
          </p>
        </div>

        <form
          onSubmit={onSaveNotes}
          className="admin-panel admin-panel-premium space-y-3 p-5"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
            Détails & état des lieux
          </p>
          <label className="block text-sm font-semibold">
            Voyageurs
            <input
              name="guests"
              type="number"
              min={1}
              max={20}
              defaultValue={reservation.guests}
              className="field-premium mt-1.5"
            />
          </label>
          <label className="block text-sm font-semibold">
            Canal de paiement
            <select
              name="paymentChannel"
              defaultValue={reservation.paymentChannel ?? ""}
              className="field-premium mt-1.5"
            >
              <option value="">—</option>
              {PAYMENT_CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {paymentChannelLabel(c)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Message client
            <textarea
              name="message"
              rows={2}
              defaultValue={reservation.message}
              className="field-premium mt-1.5"
            />
          </label>
          <label className="block text-sm font-semibold">
            Notes état des lieux / inventaire
            <textarea
              name="inventoryNotes"
              rows={4}
              defaultValue={reservation.inventoryNotes}
              placeholder="Dégradations, caution, observations…"
              className="field-premium mt-1.5"
            />
          </label>
          <AdminSaveButton saving={saving} />
        </form>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {!reservation.cancelled ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              if (window.confirm("Annuler cette réservation et libérer les dates ?")) {
                void patch({ cancelled: true });
              }
            }}
            className="rounded-full border border-febis-red/30 px-4 py-2 text-sm font-bold text-febis-red"
          >
            Annuler la réservation
          </button>
        ) : (
          <button
            type="button"
            disabled={saving}
            onClick={() => void patch({ cancelled: false })}
            className="rounded-full border border-febis-ink/15 px-4 py-2 text-sm font-bold"
          >
            Réactiver
          </button>
        )}
        <Link
          href={`/admin/dashboard/facturation`}
          className="rounded-full border border-febis-ink/15 px-4 py-2 text-sm font-bold text-febis-ink/70"
        >
          Facturer ce séjour
        </Link>
      </div>
    </>
  );
}

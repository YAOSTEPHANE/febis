"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminPageHeader, AdminSaveButton } from "@/components/admin/AdminForms";
import {
  CANCELLATION_POLICY_PUBLIC,
  DEFAULT_INVENTORY_CHECKLIST,
  PAYMENT_CHANNELS,
  RESERVATION_STEPS,
  computeCancellationRefund,
  formatXof,
  paymentChannelLabel,
  stepLabel,
  type InventoryChecklistItem,
  type SerializedReservation,
} from "@/lib/residences-shared";
import { cn } from "@/lib/cn";

export function ReservationDetailClient() {
  const params = useParams<{ id: string }>();
  const [reservation, setReservation] = useState<SerializedReservation | null>(
    null,
  );
  const [checklist, setChecklist] = useState<InventoryChecklistItem[]>([]);
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
      const next = json.reservation ?? null;
      setReservation(next);
      setChecklist(
        next?.inventoryChecklist?.length
          ? next.inventoryChecklist
          : DEFAULT_INVENTORY_CHECKLIST.map((item) => ({ ...item })),
      );
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
      inventoryChecklist: checklist,
      message: data.get("message"),
      guests: data.get("guests"),
      paymentChannel: data.get("paymentChannel") || null,
    });
  }

  async function confirmDepositPayment() {
    if (!reservation) return;
    const channel = reservation.paymentChannel || "wave";
    setSaving(true);
    setError("");
    try {
      const intentRes = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: "reservation",
          sourceId: reservation.id,
          amount: reservation.depositAmount,
          channel,
          title: `Acompte · ${reservation.lodgingTitle}`,
          clientName: reservation.guestName,
          clientEmail: reservation.guestEmail,
          clientPhone: reservation.guestPhone,
        }),
      });
      const intentJson = (await intentRes.json()) as {
        error?: string;
        intent?: { id: string };
      };
      if (!intentRes.ok || !intentJson.intent) {
        throw new Error(intentJson.error ?? "Intent impossible");
      }
      const conf = await fetch("/api/admin/paiements/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intentId: intentJson.intent.id }),
      });
      const confJson = (await conf.json()) as { error?: string };
      if (!conf.ok) throw new Error(confJson.error ?? "Confirmation impossible");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
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
        <div className="mb-4 rounded-xl border border-febis-ink/15 bg-febis-ink/5 px-4 py-3 text-sm text-febis-ink/70">
          <p className="font-semibold">
            Réservation annulée — les dates sont libérées.
          </p>
          {reservation.cancellationRefund ? (
            <p className="mt-1 text-xs">
              {reservation.cancellationRefund.policyLabel} · Remboursement{" "}
              {formatXof(reservation.cancellationRefund.refundAmount)}
              {reservation.cancellationRefund.adminFee
                ? ` (frais ${formatXof(reservation.cancellationRefund.adminFee)})`
                : ""}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mb-4 rounded-xl border border-febis-amber/25 bg-febis-amber/10 px-4 py-3 text-xs text-febis-ink/70">
          <p className="font-bold uppercase tracking-wider text-febis-gold-deep">
            Politique d’annulation
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {CANCELLATION_POLICY_PUBLIC.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="mt-2 font-semibold">
            Si annulation maintenant :{" "}
            {(() => {
              const preview = computeCancellationRefund({
                checkIn: reservation.checkIn,
                depositAmount: reservation.depositAmount,
              });
              return `${preview.policyLabel} → ${formatXof(preview.refundAmount)}`;
            })()}
          </p>
        </div>
      )}

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
              {PAYMENT_CHANNELS.filter((c) => c !== "mobile_money").map((c) => (
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
          <div>
            <p className="text-sm font-semibold">Checklist état des lieux</p>
            <ul className="mt-2 space-y-2">
              {checklist.map((item, index) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-febis-ink/10 bg-white/70 px-3 py-2"
                >
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={item.ok}
                      onChange={(e) => {
                        setChecklist((prev) =>
                          prev.map((row, i) =>
                            i === index ? { ...row, ok: e.target.checked } : row,
                          ),
                        );
                      }}
                    />
                    {item.label}
                  </label>
                  <input
                    value={item.note}
                    onChange={(e) => {
                      setChecklist((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, note: e.target.value } : row,
                        ),
                      );
                    }}
                    placeholder="Observation…"
                    className="field-premium mt-1.5 text-xs"
                  />
                </li>
              ))}
            </ul>
          </div>
          <label className="block text-sm font-semibold">
            Notes état des lieux / inventaire
            <textarea
              name="inventoryNotes"
              rows={3}
              defaultValue={reservation.inventoryNotes}
              placeholder="Dégradations, caution, observations…"
              className="field-premium mt-1.5"
            />
          </label>
          <AdminSaveButton saving={saving} />
        </form>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {!reservation.cancelled && reservation.step === "demande" ? (
          <button
            type="button"
            disabled={saving || reservation.depositAmount < 1}
            onClick={() => void confirmDepositPayment()}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            Confirmer acompte ({formatXof(reservation.depositAmount)})
          </button>
        ) : null}
        {!reservation.cancelled ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              const preview = computeCancellationRefund({
                checkIn: reservation.checkIn,
                depositAmount: reservation.depositAmount,
              });
              if (
                window.confirm(
                  `Annuler et libérer les dates ?\n${preview.policyLabel}\nRemboursement estimé : ${formatXof(preview.refundAmount)}`,
                )
              ) {
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
            className="admin-btn-ghost"
          >
            Réactiver
          </button>
        )}
        <Link
          href={`/admin/dashboard/facturation`}
          className="admin-btn-ghost"
        >
          Facturer ce séjour
        </Link>
      </div>
    </>
  );
}

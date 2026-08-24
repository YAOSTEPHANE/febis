"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState, useTransition } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import {
  ACTIVITIES,
  PAYMENT_CHANNELS,
  activityLabel,
  formatXof,
  paymentChannelLabel,
  paymentDirectionLabel,
  paymentStatusLabel,
  type SerializedPayment,
  type SerializedUnpaid,
} from "@/lib/finance-shared";

export function PaiementsAdminClient() {
  const [payments, setPayments] = useState<SerializedPayment[]>([]);
  const [unpaid, setUnpaid] = useState<SerializedUnpaid[]>([]);
  const [channel, setChannel] = useState("all");
  const [activity, setActivity] = useState("all");
  const [direction, setDirection] = useState("all");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams();
      if (channel !== "all") params.set("channel", channel);
      if (activity !== "all") params.set("activity", activity);
      if (direction !== "all") params.set("direction", direction);
      const res = await fetch(`/api/admin/paiements?${params}`);
      const json = (await res.json()) as {
        payments?: SerializedPayment[];
        unpaid?: SerializedUnpaid[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setPayments(json.payments ?? []);
      setUnpaid(json.unpaid ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }, [channel, activity, direction]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        void load();
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [load]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/admin/paiements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.get("title"),
          amount: data.get("amount"),
          channel: data.get("channel"),
          activity: data.get("activity"),
          direction: data.get("direction"),
          clientName: data.get("clientName"),
          invoiceId: data.get("invoiceId") || undefined,
          reference: data.get("reference"),
          notes: data.get("notes"),
          markInvoicePaid: data.get("markInvoicePaid") === "on",
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Paiements"
        description="Mobile Money, virement, espèces — encaissements, décaissements et rattachement aux factures."
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <Link
          href="/admin/dashboard/finance"
          className="rounded-full border border-febis-ink/15 px-4 py-2 text-sm font-bold"
        >
          ← Tableau Finance
        </Link>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-4 py-3 text-sm font-semibold text-febis-red">
          {error}
        </p>
      ) : null}

      <div className="mb-4 admin-panel admin-panel-premium p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="field-premium"
          >
            <option value="all">Tous canaux</option>
            {PAYMENT_CHANNELS.map((c) => (
              <option key={c} value={c}>
                {paymentChannelLabel(c)}
              </option>
            ))}
          </select>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="field-premium"
          >
            <option value="all">Toutes activités</option>
            <option value="general">Général</option>
            {ACTIVITIES.map((a) => (
              <option key={a} value={a}>
                {activityLabel(a)}
              </option>
            ))}
          </select>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="field-premium"
          >
            <option value="all">Entrants & sortants</option>
            <option value="entrant">Entrants</option>
            <option value="sortant">Sortants</option>
          </select>
        </div>
        <p className="mt-2 text-xs text-febis-ink/45">
          {pending ? "Actualisation…" : `${payments.length} paiement(s)`}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="admin-panel overflow-hidden">
          <div className="border-b border-febis-ink/8 px-5 py-3 text-sm font-semibold">
            Historique
          </div>
          <div className="divide-y divide-febis-ink/8">
            {payments.map((p) => (
              <div key={p.id} className="px-5 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-febis-ink">{p.title}</p>
                    <p className="text-xs text-febis-ink/50">
                      {paymentChannelLabel(p.channel)} ·{" "}
                      {paymentDirectionLabel(p.direction)} ·{" "}
                      {activityLabel(p.activity)} · {paymentStatusLabel(p.status)}
                    </p>
                    {p.clientName || p.invoiceNumber ? (
                      <p className="mt-1 text-xs text-febis-ink/45">
                        {[p.clientName, p.invoiceNumber, p.reference]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  <p
                    className={
                      p.direction === "entrant"
                        ? "font-bold text-emerald-700"
                        : "font-bold text-febis-red"
                    }
                  >
                    {p.direction === "entrant" ? "+" : "−"}
                    {formatXof(p.amount)}
                  </p>
                </div>
              </div>
            ))}
            {payments.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-febis-ink/45">
                Aucun paiement enregistré.
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <form
            onSubmit={onSubmit}
            className="admin-panel admin-panel-premium space-y-3 p-5"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
              Enregistrer un paiement
            </p>
            <input name="title" required placeholder="Libellé *" className="field-premium" />
            <input
              name="amount"
              required
              type="number"
              min={0}
              placeholder="Montant XOF *"
              className="field-premium"
            />
            <select name="channel" required className="field-premium" defaultValue="mobile_money">
              {PAYMENT_CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {paymentChannelLabel(c)}
                </option>
              ))}
            </select>
            <select name="direction" className="field-premium" defaultValue="entrant">
              <option value="entrant">Entrant</option>
              <option value="sortant">Sortant</option>
            </select>
            <select name="activity" className="field-premium" defaultValue="general">
              <option value="general">Général</option>
              {ACTIVITIES.map((a) => (
                <option key={a} value={a}>
                  {activityLabel(a)}
                </option>
              ))}
            </select>
            <input name="clientName" placeholder="Client" className="field-premium" />
            <select name="invoiceId" className="field-premium" defaultValue="">
              <option value="">Facture liée (optionnel)</option>
              {unpaid.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.number} · {u.clientName} · {formatXof(u.amount)}
                </option>
              ))}
            </select>
            <input
              name="reference"
              placeholder="Réf. / ID Wave / n° virement"
              className="field-premium"
            />
            <textarea name="notes" rows={2} placeholder="Notes" className="field-premium" />
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="markInvoicePaid" defaultChecked />
              Marquer la facture comme payée
            </label>
            <button
              type="submit"
              disabled={saving}
              className="cta-premium w-full justify-center disabled:opacity-60"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </form>

          <div className="admin-panel overflow-hidden">
            <div className="border-b border-febis-ink/8 px-4 py-3 text-sm font-semibold">
              Factures à encaisser ({unpaid.length})
            </div>
            <div className="divide-y divide-febis-ink/8">
              {unpaid.slice(0, 10).map((u) => (
                <div key={u.id} className="px-4 py-2.5 text-sm">
                  <p className="font-semibold">
                    {u.number} · {formatXof(u.amount)}
                  </p>
                  <p className="text-xs text-febis-ink/50">
                    {u.clientName} · {activityLabel(u.activity)} · {u.ageDays} j
                  </p>
                </div>
              ))}
              {unpaid.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-febis-ink/45">
                  Aucun impayé.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

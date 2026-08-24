"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import {
  ACTIVITIES,
  EXPENSE_CATEGORIES,
  PAYMENT_CHANNELS,
  activityLabel,
  expenseCategoryLabel,
  formatXof,
  paymentChannelLabel,
  type FinanceDashboard,
  type SerializedExpense,
} from "@/lib/finance-shared";

export function FinanceAdminClient() {
  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null);
  const [expenses, setExpenses] = useState<SerializedExpense[]>([]);
  const [expenseActivity, setExpenseActivity] = useState("all");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const expParams = new URLSearchParams({ tab: "expenses" });
      if (expenseActivity !== "all") {
        expParams.set("activity", expenseActivity);
      }
      const [dashRes, expRes] = await Promise.all([
        fetch("/api/admin/finance"),
        fetch(`/api/admin/finance?${expParams}`),
      ]);
      const dashJson = (await dashRes.json()) as {
        dashboard?: FinanceDashboard;
        error?: string;
      };
      const expJson = (await expRes.json()) as {
        expenses?: SerializedExpense[];
        error?: string;
      };
      if (!dashRes.ok) throw new Error(dashJson.error ?? "Erreur");
      if (!expRes.ok) throw new Error(expJson.error ?? "Erreur");
      setDashboard(dashJson.dashboard ?? null);
      setExpenses(expJson.expenses ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }, [expenseActivity]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/admin/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity: data.get("activity"),
          category: data.get("category"),
          title: data.get("title"),
          amount: data.get("amount"),
          paymentChannel: data.get("paymentChannel") || undefined,
          reference: data.get("reference"),
          notes: data.get("notes"),
          spentAt: data.get("spentAt"),
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

  async function encaisser(invoiceId: string, amount: number, title: string) {
    setPayingId(invoiceId);
    setError("");
    try {
      const res = await fetch("/api/admin/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pay",
          invoiceId,
          amount,
          title: `Encaissement · ${title}`,
          channel: "mobile_money",
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setPayingId(null);
    }
  }

  const totals = dashboard?.totals;

  return (
    <>
      <AdminPageHeader
        title="Finance"
        description="CDC §4.7 — revenus & dépenses par activité, canaux de paiement, état des impayés."
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <Link href="/admin/dashboard/paiements" className="cta-premium text-sm">
          Gérer les paiements →
        </Link>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-4 py-3 text-sm font-semibold text-febis-red">
          {error}
        </p>
      ) : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Revenus", formatXof(totals?.revenue ?? 0)],
          ["Dépenses", formatXof(totals?.expenses ?? 0)],
          ["Net", formatXof(totals?.net ?? 0)],
          [
            "Impayés",
            `${formatXof(totals?.unpaid ?? 0)} (${totals?.unpaidCount ?? 0})`,
          ],
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

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="admin-panel overflow-hidden">
          <div className="border-b border-febis-ink/8 px-5 py-3 text-sm font-semibold">
            Revenus / dépenses par activité
          </div>
          <div className="divide-y divide-febis-ink/8">
            {(dashboard?.byActivity ?? []).map((row) => (
              <div key={row.activity} className="px-5 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-febis-ink">{row.label}</span>
                  <strong className="text-febis-red">{formatXof(row.net)}</strong>
                </div>
                <p className="mt-1 text-xs text-febis-ink/50">
                  Revenus {formatXof(row.revenue)} · Dépenses{" "}
                  {formatXof(row.expenses)}
                  {row.unpaid > 0 ? ` · Impayés ${formatXof(row.unpaid)}` : ""}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-febis-ink/10">
                  <div
                    className="h-full rounded-full bg-febis-gold-deep"
                    style={{
                      width: `${Math.min(
                        100,
                        row.revenue + row.expenses > 0
                          ? (row.revenue / (row.revenue + row.expenses)) * 100
                          : 0,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel overflow-hidden">
          <div className="border-b border-febis-ink/8 px-5 py-3 text-sm font-semibold">
            Paiements multi-canaux
          </div>
          <div className="divide-y divide-febis-ink/8">
            {(dashboard?.byChannel ?? []).map((row) => (
              <div
                key={row.channel}
                className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold">{row.label}</p>
                  <p className="text-xs text-febis-ink/45">{row.count} opérations</p>
                </div>
                <span className="text-febis-ink/60">
                  <span className="text-emerald-700">+{formatXof(row.inbound)}</span>
                  {" / "}
                  <span className="text-febis-red">−{formatXof(row.outbound)}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-febis-ink/8 px-5 py-3 text-xs text-febis-ink/50">
            Entrants {formatXof(totals?.paymentsIn ?? 0)} · Sortants{" "}
            {formatXof(totals?.paymentsOut ?? 0)}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <div className="admin-panel overflow-hidden">
            <div className="border-b border-febis-ink/8 px-5 py-3 text-sm font-semibold">
              État des impayés
            </div>
            <div className="divide-y divide-febis-ink/8">
              {(dashboard?.unpaid ?? []).map((row) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                >
                  <div>
                    <p className="font-semibold text-febis-ink">
                      {row.number} · {row.clientName}
                    </p>
                    <p className="text-xs text-febis-ink/50">
                      {activityLabel(row.activity)} · {row.title} · {row.ageDays}{" "}
                      j
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-febis-red">
                      {formatXof(row.amount)}
                    </span>
                    <button
                      type="button"
                      disabled={payingId === row.id}
                      onClick={() =>
                        void encaisser(row.id, row.amount, row.number)
                      }
                      className="rounded-full bg-febis-gold-deep px-3 py-1 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {payingId === row.id ? "…" : "Encaisser"}
                    </button>
                  </div>
                </div>
              ))}
              {(dashboard?.unpaid ?? []).length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-febis-ink/45">
                  Aucun impayé — les factures « émises » non payées apparaissent
                  ici.
                </p>
              ) : null}
            </div>
          </div>

          <div className="admin-panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-febis-ink/8 px-5 py-3">
              <p className="text-sm font-semibold">Dépenses</p>
              <select
                value={expenseActivity}
                onChange={(e) => setExpenseActivity(e.target.value)}
                className="field-premium max-w-[160px] py-1.5 text-xs"
              >
                <option value="all">Toutes activités</option>
                {ACTIVITIES.map((a) => (
                  <option key={a} value={a}>
                    {activityLabel(a)}
                  </option>
                ))}
              </select>
            </div>
            <div className="divide-y divide-febis-ink/8">
              {expenses.slice(0, 15).map((e) => (
                <div
                  key={e.id}
                  className="flex justify-between gap-3 px-5 py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold">{e.title}</p>
                    <p className="text-xs text-febis-ink/50">
                      {activityLabel(e.activity)} ·{" "}
                      {expenseCategoryLabel(e.category)}
                      {e.paymentChannel
                        ? ` · ${paymentChannelLabel(e.paymentChannel)}`
                        : ""}
                    </p>
                  </div>
                  <span className="font-bold text-febis-ink">
                    {formatXof(e.amount)}
                  </span>
                </div>
              ))}
              {expenses.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-febis-ink/45">
                  Aucune dépense.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <form
          onSubmit={onExpense}
          className="admin-panel admin-panel-premium h-fit space-y-3 p-5"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
            Nouvelle dépense
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
          <select name="activity" required className="field-premium" defaultValue="residences">
            {ACTIVITIES.map((a) => (
              <option key={a} value={a}>
                {activityLabel(a)}
              </option>
            ))}
          </select>
          <select name="category" required className="field-premium" defaultValue="autres">
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {expenseCategoryLabel(c)}
              </option>
            ))}
          </select>
          <select name="paymentChannel" className="field-premium" defaultValue="">
            <option value="">Canal (optionnel)</option>
            {PAYMENT_CHANNELS.map((c) => (
              <option key={c} value={c}>
                {paymentChannelLabel(c)}
              </option>
            ))}
          </select>
          <input name="reference" placeholder="Référence" className="field-premium" />
          <input name="spentAt" type="date" className="field-premium" />
          <textarea name="notes" rows={2} placeholder="Notes" className="field-premium" />
          <button
            type="submit"
            disabled={saving}
            className="cta-premium w-full justify-center disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : "Enregistrer la dépense"}
          </button>
        </form>
      </div>
    </>
  );
}

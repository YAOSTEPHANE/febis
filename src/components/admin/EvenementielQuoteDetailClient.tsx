"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import {
  QUOTE_STATUSES,
  formatXof,
  movementTypeLabel,
  quoteStatusLabel,
  type SerializedEventQuote,
  type SerializedMovement,
} from "@/lib/evenementiel-shared";
import { cn } from "@/lib/cn";

export function EvenementielQuoteDetailClient() {
  const params = useParams<{ id: string }>();
  const [quote, setQuote] = useState<SerializedEventQuote | null>(null);
  const [movements, setMovements] = useState<SerializedMovement[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/evenementiel/${params.id}`);
      const json = (await res.json()) as {
        quote?: SerializedEventQuote;
        movements?: SerializedMovement[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Introuvable");
      setQuote(json.quote ?? null);
      setMovements(json.movements ?? []);
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

  async function setStatus(status: string) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/evenementiel/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = (await res.json()) as {
        quote?: SerializedEventQuote;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      setQuote(json.quote ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function onBulkSortie() {
    if (!quote) return;
    setMoving(true);
    setError("");
    try {
      for (const line of quote.lines) {
        const res = await fetch("/api/admin/evenementiel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "movement",
            equipmentSlug: line.equipmentSlug,
            type: "sortie",
            quantity: line.quantity,
            quoteId: quote.id,
            note: `Sortie devis ${quote.eventDate}`,
          }),
        });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Sortie impossible");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setMoving(false);
    }
  }

  async function onReturnLine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quote) return;
    setMoving(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/admin/evenementiel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "movement",
          equipmentSlug: data.get("equipmentSlug"),
          type: "retour",
          quantity: data.get("quantity"),
          quoteId: quote.id,
          damageReported: data.get("damageReported") === "on",
          penaltyAmount: data.get("penaltyAmount") || undefined,
          note: data.get("note"),
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Retour impossible");
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setMoving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-febis-ink/50">Chargement…</p>;
  }

  if (!quote) {
    return (
      <>
        <AdminPageHeader title="Devis événementiel" description="Introuvable." />
        {error ? (
          <p className="text-sm font-semibold text-febis-red">{error}</p>
        ) : null}
        <Link href="/admin/dashboard/evenementiel" className="cta-premium mt-4 inline-flex">
          ← Retour
        </Link>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title={`Devis · ${quote.clientName}`}
        description={`${quote.eventDate} → ${quote.returnDate} · ${quote.clientEmail}`}
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <Link
          href="/admin/dashboard/evenementiel"
          className="rounded-full border border-febis-ink/15 px-4 py-2 text-sm font-bold"
        >
          ← Événementiel
        </Link>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-4 py-3 text-sm font-semibold text-febis-red">
          {error}
        </p>
      ) : null}

      <div className="mb-6 admin-panel admin-panel-premium p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
          Statut devis
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUOTE_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={saving}
              onClick={() => void setStatus(s)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-bold transition",
                quote.status === s
                  ? "bg-febis-gold-deep text-white"
                  : "bg-febis-mist text-febis-ink/55",
              )}
            >
              {quoteStatusLabel(s)}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
          <p>
            <span className="text-febis-ink/45">Location</span>
            <br />
            <strong className="text-febis-red">{formatXof(quote.rentalTotal)}</strong>
          </p>
          <p>
            <span className="text-febis-ink/45">Caution</span>
            <br />
            <strong>{formatXof(quote.depositTotal)}</strong>
          </p>
          <p>
            <span className="text-febis-ink/45">Téléphone</span>
            <br />
            <strong>{quote.clientPhone}</strong>
          </p>
        </div>
        {quote.message ? (
          <p className="mt-3 text-sm text-febis-ink/70">{quote.message}</p>
        ) : null}
        {quote.status === "accepte" ? (
          <button
            type="button"
            disabled={moving}
            onClick={() => void onBulkSortie()}
            className="cta-premium mt-4 text-sm disabled:opacity-60"
          >
            {moving ? "Sortie…" : "Sortie de tout le matériel"}
          </button>
        ) : null}
      </div>

      <div className="mb-6 admin-panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-febis-mist/80 text-xs uppercase tracking-wider text-febis-ink/55">
            <tr>
              <th className="px-4 py-3">Article</th>
              <th className="px-4 py-3">Qté</th>
              <th className="px-4 py-3">Jours</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Caution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-febis-ink/8">
            {quote.lines.map((line) => (
              <tr key={`${line.equipmentSlug}-${line.quantity}`}>
                <td className="px-4 py-3 font-semibold">{line.equipmentName}</td>
                <td className="px-4 py-3">{line.quantity}</td>
                <td className="px-4 py-3">{line.days}</td>
                <td className="px-4 py-3">{formatXof(line.lineTotal)}</td>
                <td className="px-4 py-3">{formatXof(line.lineDeposit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={onReturnLine}
          className="admin-panel admin-panel-premium space-y-3 p-5"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
            Retour + dommages
          </p>
          <select name="equipmentSlug" required className="field-premium" defaultValue="">
            <option value="" disabled>
              Article *
            </option>
            {quote.lines.map((line) => (
              <option key={line.equipmentSlug} value={line.equipmentSlug}>
                {line.equipmentName} (qté devis {line.quantity})
              </option>
            ))}
          </select>
          <input
            name="quantity"
            type="number"
            min={1}
            defaultValue={1}
            required
            className="field-premium"
          />
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="damageReported" />
            Dommage signalé
          </label>
          <input
            name="penaltyAmount"
            type="number"
            min={0}
            placeholder="Pénalité (auto si vide)"
            className="field-premium"
          />
          <textarea name="note" rows={2} placeholder="Note" className="field-premium" />
          <button
            type="submit"
            disabled={moving}
            className="cta-premium w-full disabled:opacity-60"
          >
            {moving ? "Enregistrement…" : "Enregistrer le retour"}
          </button>
        </form>

        <div className="admin-panel overflow-hidden">
          <div className="border-b border-febis-ink/8 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
            Mouvements liés
          </div>
          <ul className="divide-y divide-febis-ink/8">
            {movements.map((m) => (
              <li key={m.id} className="px-4 py-3 text-sm">
                <p className="font-semibold">
                  {movementTypeLabel(m.type)} · {m.equipmentName} × {m.quantity}
                </p>
                <p className="text-xs text-febis-ink/45">
                  {m.damageReported
                    ? `Dommage · ${formatXof(m.penaltyAmount)} · `
                    : ""}
                  {new Date(m.createdAt).toLocaleString("fr-FR")}
                </p>
              </li>
            ))}
            {movements.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-febis-ink/45">
                Aucun mouvement pour ce devis.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </>
  );
}

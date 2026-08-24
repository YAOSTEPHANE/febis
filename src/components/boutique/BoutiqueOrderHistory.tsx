"use client";

import { FormEvent, useState } from "react";
import {
  formatXof,
  orderStatusLabel,
  variantLabel,
  type SerializedShopOrder,
} from "@/lib/boutique-shared";
import { cn } from "@/lib/cn";

export function BoutiqueOrderHistory({
  initialEmail = "",
}: {
  initialEmail?: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [orders, setOrders] = useState<SerializedShopOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const res = await fetch(
        `/api/boutique/ventes?email=${encodeURIComponent(email.trim())}`,
      );
      const json = (await res.json()) as {
        orders?: SerializedShopOrder[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setOrders(json.orders ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form
        onSubmit={onSearch}
        className="mb-8 flex flex-col gap-3 rounded-2xl border border-febis-ink/10 bg-white/80 p-5 sm:flex-row sm:items-end"
      >
        <label className="block flex-1 text-sm font-semibold text-febis-ink/80">
          Email de commande
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.ci"
            className="mt-1.5 w-full rounded-xl border border-febis-ink/12 bg-white px-3 py-2.5 text-sm outline-none ring-febis-red/30 focus:ring-2"
          />
        </label>
        <button type="submit" disabled={loading} className="cta-premium">
          {loading ? "Recherche…" : "Voir l’historique"}
        </button>
      </form>

      {error ? (
        <p className="mb-4 text-sm font-semibold text-febis-red">{error}</p>
      ) : null}

      {searched && !loading && orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-febis-ink/15 bg-white/50 px-6 py-10 text-center text-febis-ink/55">
          Aucune commande pour cet email.
        </p>
      ) : null}

      <div className="space-y-4">
        {orders.map((order) => (
          <article
            key={order.id}
            className="rounded-2xl border border-febis-ink/10 bg-white/85 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl font-bold text-febis-ink">
                  {order.orderNumber}
                </p>
                <p className="text-sm text-febis-ink/55">
                  {new Date(order.createdAt).toLocaleString("fr-FR")}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                    order.status === "annulee"
                      ? "bg-febis-ink/10 text-febis-ink/60"
                      : "bg-febis-red/10 text-febis-red",
                  )}
                >
                  {orderStatusLabel(order.status)}
                </span>
                <p className="mt-2 font-display text-lg font-extrabold text-febis-red">
                  {formatXof(order.totalAmount)}
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 border-t border-febis-ink/8 pt-4 text-sm text-febis-ink/70">
              {order.lines.map((line) => (
                <li key={`${order.id}-${line.sku}`}>
                  {line.quantity}× {line.productName} ({variantLabel(line)}) —{" "}
                  {formatXof(line.lineTotal)}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}

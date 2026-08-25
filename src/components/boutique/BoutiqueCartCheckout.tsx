"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useBoutiqueCart } from "@/components/boutique/BoutiqueCartProvider";
import {
  cartLineTotal,
  formatXof,
  orderStatusLabel,
  variantLabel,
  type SerializedShopOrder,
} from "@/lib/boutique-shared";
import { paymentChannelLabel } from "@/lib/finance-shared";
import { cn } from "@/lib/cn";

type PaymentMethodOption = {
  id: string;
  label: string;
  merchantName?: string;
  merchantPhone?: string;
  instructions?: string;
};

export function BoutiqueCartCheckout() {
  const { items, total, setQuantity, removeItem, clear, ready } =
    useBoutiqueCart();
  const [step, setStep] = useState<"panier" | "coordonnees" | "confirme">("panier");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<SerializedShopOrder | null>(null);
  const [mobileMethods, setMobileMethods] = useState<PaymentMethodOption[]>([]);
  const [otherChannels, setOtherChannels] = useState<PaymentMethodOption[]>([]);
  const [paymentChannel, setPaymentChannel] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/payment-methods");
        const json = (await res.json()) as {
          methods?: PaymentMethodOption[];
          otherChannels?: PaymentMethodOption[];
        };
        if (!res.ok) return;
        const methods = json.methods ?? [];
        setMobileMethods(methods);
        setOtherChannels(json.otherChannels ?? []);
        if (methods[0]) setPaymentChannel(methods[0].id);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const selectedMethod = useMemo(() => {
    return (
      mobileMethods.find((m) => m.id === paymentChannel) ??
      otherChannels.find((m) => m.id === paymentChannel) ??
      null
    );
  }, [mobileMethods, otherChannels, paymentChannel]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);

    try {
      const res = await fetch("/api/boutique/commandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: data.get("clientName"),
          clientEmail: data.get("clientEmail"),
          clientPhone: data.get("clientPhone"),
          deliveryAddress: data.get("deliveryAddress"),
          message: data.get("message"),
          paymentChannel: paymentChannel || undefined,
          items: items.map((item) => ({
            slug: item.slug,
            sku: item.sku,
            quantity: item.quantity,
          })),
        }),
      });
      const json = (await res.json()) as {
        order?: SerializedShopOrder;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Commande impossible");
      setOrder(json.order ?? null);
      clear();
      setStep("confirme");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setPending(false);
    }
  }

  if (!ready) {
    return (
      <p className="text-sm text-febis-ink/55">Chargement du panier…</p>
    );
  }

  if (step === "confirme" && order) {
    const channelLabel = order.paymentChannel
      ? paymentChannelLabel(order.paymentChannel)
      : null;
    const mobileHint =
      mobileMethods.find((m) => m.id === order.paymentChannel) ?? null;

    return (
      <div className="rounded-2xl border border-febis-ink/10 bg-white/85 p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-febis-orange">
          Commande confirmée
        </p>
        <h2 className="mt-2 font-display text-3xl font-extrabold text-febis-ink">
          Merci {order.clientName}
        </h2>
        <p className="mt-3 text-febis-ink/65">
          Votre commande <strong>{order.orderNumber}</strong> est enregistrée (
          {orderStatusLabel(order.status)}). Total{" "}
          <strong>{formatXof(order.totalAmount)}</strong>.
        </p>
        {channelLabel ? (
          <p className="mt-2 text-sm font-semibold text-febis-ink">
            Paiement prévu : {channelLabel}
          </p>
        ) : null}
        {mobileHint ? (
          <div className="mt-4 rounded-xl border border-febis-orange/25 bg-febis-orange/8 px-4 py-3 text-sm text-febis-ink/80">
            <p className="font-bold">
              {mobileHint.label}
              {mobileHint.merchantPhone ? ` · ${mobileHint.merchantPhone}` : ""}
            </p>
            {mobileHint.instructions ? (
              <p className="mt-2 leading-relaxed">{mobileHint.instructions}</p>
            ) : null}
          </div>
        ) : null}
        <ul className="mt-6 space-y-2 text-sm text-febis-ink/70">
          {order.lines.map((line) => (
            <li key={`${line.sku}-${line.productSlug}`}>
              {line.quantity}× {line.productName} ({variantLabel(line)}) —{" "}
              {formatXof(line.lineTotal)}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/boutique" className="cta-premium">
            Continuer vos achats
          </Link>
          <Link
            href={`/boutique/commandes?email=${encodeURIComponent(order.clientEmail)}`}
            className="inline-flex items-center rounded-full border border-febis-ink/15 bg-white px-5 py-2.5 text-sm font-bold"
          >
            Voir mon historique
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-febis-ink/15 bg-white/60 px-6 py-14 text-center">
        <p className="font-display text-2xl font-bold text-febis-ink">
          Votre panier est vide
        </p>
        <p className="mt-2 text-febis-ink/55">
          Parcourez le catalogue pour ajouter des articles.
        </p>
        <Link href="/boutique" className="cta-premium mt-6 inline-flex">
          Voir la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
      <div className="space-y-4">
        {items.map((item) => (
          <article
            key={`${item.slug}-${item.sku}`}
            className="flex gap-4 rounded-2xl border border-febis-ink/10 bg-white/80 p-4"
          >
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
              <Image
                src={item.photo}
                alt={item.productName}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/boutique/${item.slug}`}
                    className="font-display text-lg font-bold text-febis-ink hover:text-febis-red"
                  >
                    {item.productName}
                  </Link>
                  <p className="text-sm text-febis-ink/55">
                    {variantLabel(item)} · {item.sku}
                  </p>
                </div>
                <p className="font-bold text-febis-red">
                  {formatXof(cartLineTotal(item))}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="text-xs font-semibold text-febis-ink/60">
                  Qté
                  <input
                    type="number"
                    min={1}
                    max={item.maxStock}
                    value={item.quantity}
                    onChange={(e) =>
                      setQuantity(
                        item.slug,
                        item.sku,
                        Number.parseInt(e.target.value || "1", 10) || 1,
                      )
                    }
                    className="ml-2 w-16 rounded-lg border border-febis-ink/12 px-2 py-1 text-sm"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeItem(item.slug, item.sku)}
                  className="text-xs font-bold text-febis-red hover:underline"
                >
                  Retirer
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="h-fit rounded-2xl border border-febis-ink/10 bg-white/85 p-6 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-febis-orange">
          Tunnel de commande
        </p>
        <div className="mt-3 flex gap-2 text-xs font-bold uppercase tracking-wide">
          <span
            className={cn(
              step === "panier" ? "text-febis-red" : "text-febis-ink/40",
            )}
          >
            1. Panier
          </span>
          <span className="text-febis-ink/25">→</span>
          <span
            className={cn(
              step === "coordonnees" ? "text-febis-red" : "text-febis-ink/40",
            )}
          >
            2. Coordonnées
          </span>
        </div>

        <p className="mt-5 font-display text-2xl font-extrabold text-febis-ink">
          Total {formatXof(total)}
        </p>
        <p className="mt-1 text-sm text-febis-ink/55">
          {items.length} ligne{items.length > 1 ? "s" : ""} · TVA non applicable
          (XOF)
        </p>

        {step === "panier" ? (
          <button
            type="button"
            onClick={() => setStep("coordonnees")}
            className="cta-premium mt-6 w-full justify-center"
          >
            Continuer
          </button>
        ) : (
          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <Field name="clientName" label="Nom complet" required />
            <Field name="clientEmail" label="Email" type="email" required />
            <Field name="clientPhone" label="Téléphone" required />
            <label className="block text-sm font-semibold text-febis-ink/80">
              Adresse de livraison
              <textarea
                name="deliveryAddress"
                required
                rows={3}
                className="mt-1.5 w-full rounded-xl border border-febis-ink/12 bg-white px-3 py-2.5 text-sm outline-none ring-febis-red/30 focus:ring-2"
              />
            </label>
            <label className="block text-sm font-semibold text-febis-ink/80">
              Moyen de paiement
              <select
                value={paymentChannel}
                onChange={(e) => setPaymentChannel(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-febis-ink/12 bg-white px-3 py-2.5 text-sm outline-none ring-febis-red/30 focus:ring-2"
              >
                {mobileMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
                {otherChannels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            {selectedMethod && "merchantPhone" in selectedMethod && selectedMethod.merchantPhone ? (
              <div className="rounded-xl border border-febis-orange/20 bg-febis-orange/8 px-3 py-2.5 text-xs text-febis-ink/75">
                <p className="font-bold text-febis-ink">
                  {selectedMethod.label} · {selectedMethod.merchantPhone}
                </p>
                {selectedMethod.instructions ? (
                  <p className="mt-1 leading-relaxed">{selectedMethod.instructions}</p>
                ) : null}
              </div>
            ) : null}
            <label className="block text-sm font-semibold text-febis-ink/80">
              Message (optionnel)
              <textarea
                name="message"
                rows={2}
                className="mt-1.5 w-full rounded-xl border border-febis-ink/12 bg-white px-3 py-2.5 text-sm outline-none ring-febis-red/30 focus:ring-2"
              />
            </label>
            {error ? (
              <p className="text-sm font-semibold text-febis-red">{error}</p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStep("panier")}
                className="rounded-full border border-febis-ink/15 px-4 py-2 text-sm font-bold"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={pending}
                className="cta-premium flex-1 justify-center disabled:opacity-60"
              >
                {pending ? "Envoi…" : "Valider la commande"}
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-febis-ink/80">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1.5 w-full rounded-xl border border-febis-ink/12 bg-white px-3 py-2.5 text-sm outline-none ring-febis-red/30 focus:ring-2"
      />
    </label>
  );
}

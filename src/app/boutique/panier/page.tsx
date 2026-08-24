import type { Metadata } from "next";
import Link from "next/link";
import { BoutiqueCartCheckout } from "@/components/boutique/BoutiqueCartCheckout";

export const metadata: Metadata = {
  title: "Panier — Boutique FEBiS",
  description: "Tunnel de commande FEBiS : panier, coordonnées, validation.",
};

export default function BoutiquePanierPage() {
  return (
    <section className="pt-24 pb-16 md:pb-24">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Link
          href="/boutique"
          className="text-sm font-bold text-febis-red hover:underline"
        >
          ← Continuer vos achats
        </Link>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-febis-ink md:text-4xl">
          Panier & commande
        </h1>
        <p className="mt-2 max-w-xl text-febis-ink/60">
          Vérifiez vos articles, renseignez vos coordonnées, validez — le stock
          est réservé à la confirmation.
        </p>
        <div className="mt-10">
          <BoutiqueCartCheckout />
        </div>
      </div>
    </section>
  );
}

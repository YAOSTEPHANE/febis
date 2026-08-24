import type { Metadata } from "next";
import Link from "next/link";
import { BoutiqueOrderHistory } from "@/components/boutique/BoutiqueOrderHistory";

export const metadata: Metadata = {
  title: "Mes commandes — Boutique FEBiS",
  description: "Historique des commandes boutique FEBiS par email.",
};

type Props = { searchParams: Promise<{ email?: string }> };

export default async function BoutiqueCommandesPage({ searchParams }: Props) {
  const { email } = await searchParams;

  return (
    <section className="pt-24 pb-16 md:pb-24">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <Link
          href="/boutique"
          className="text-sm font-bold text-febis-red hover:underline"
        >
          ← Boutique
        </Link>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-febis-ink md:text-4xl">
          Historique des ventes
        </h1>
        <p className="mt-2 text-febis-ink/60">
          Retrouvez vos commandes avec l’email utilisé lors du paiement.
        </p>
        <div className="mt-8">
          <BoutiqueOrderHistory initialEmail={email ?? ""} />
        </div>
      </div>
    </section>
  );
}

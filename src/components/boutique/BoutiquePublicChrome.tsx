"use client";

import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { useBoutiqueCart } from "@/components/boutique/BoutiqueCartProvider";

export function BoutiquePublicChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const { count, ready } = useBoutiqueCart();

  return (
    <>
      <PublicHeader />
      <div className="pointer-events-none fixed bottom-5 right-5 z-40 md:bottom-8 md:right-8">
        <Link
          href="/boutique/panier"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-febis-ink px-4 py-3 text-sm font-bold text-white shadow-lg shadow-black/25 transition hover:bg-febis-red"
        >
          Panier
          <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-febis-red px-1.5 py-0.5 text-xs">
            {ready ? count : "…"}
          </span>
        </Link>
      </div>
      <main>{children}</main>
      <Footer />
    </>
  );
}

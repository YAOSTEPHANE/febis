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
      <div className="pointer-events-none fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-40 md:bottom-8 md:right-8">
        <Link
          href="/boutique/panier"
          className="pointer-events-auto inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 bg-febis-ink/92 px-4 py-3 text-sm font-bold text-white shadow-[0_18px_40px_rgba(26,18,16,0.35)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-febis-red focus-ring-premium xs:gap-2.5 xs:px-5 xs:py-3.5"
        >
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
            aria-hidden
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6h15l-1.5 9h-12z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="20" r="1.5" fill="currentColor" />
              <circle cx="17" cy="20" r="1.5" fill="currentColor" />
              <path d="M6 6L5 3H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          Panier
          <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-febis-red px-1.5 py-0.5 text-xs shadow-sm">
            {ready ? count : "…"}
          </span>
        </Link>
      </div>
      <main>{children}</main>
      <Footer />
    </>
  );
}

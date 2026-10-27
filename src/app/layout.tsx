import type { Metadata } from "next";
import { CookieConsent } from "@/components/CookieConsent";
import "./globals.css";

function siteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      return new URL(raw);
    } catch {
      /* fall through */
    }
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: "FEBiS — Résidences, BTP, Événementiel & Boutique",
  description:
    "Plateforme digitale FEBiS en Côte d'Ivoire : résidences meublées, BTP, événementiel et boutique — gestion unifiée.",
  openGraph: {
    title: "FEBiS — Écosystème multi-activités",
    description:
      "Résidences, BTP, événementiel et boutique centralisés sur une plateforme unique.",
    images: ["/logo-febis.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="site-atmosphere min-h-full font-sans text-foreground">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}

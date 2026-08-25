import type { Metadata } from "next";
import { Figtree, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

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
      className={`${outfit.variable} ${figtree.variable} h-full antialiased`}
    >
      <body className="site-atmosphere min-h-full font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}

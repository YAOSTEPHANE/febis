import type { Metadata } from "next";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { Contact } from "@/components/Contact";

export const metadata: Metadata = {
  title: "Contact — FEBiS",
  description:
    "Contactez FEBiS en Côte d’Ivoire : résidences, BTP, événementiel et boutique.",
};

export default function ContactPage() {
  return (
    <>
      <PublicHeader />
      <main className="pt-20">
        <Contact />
      </main>
      <Footer />
    </>
  );
}

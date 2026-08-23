import Link from "next/link";
import { getDb } from "@/lib/mongodb";
import {
  AdminModulesGrid,
  SeedHomepageButton,
} from "@/components/admin/AdminDashboardClient";
import { AdminPageHeader } from "@/components/admin/AdminForms";

export default async function AdminDashboardPage() {
  let contactsCount = 0;
  let lodgingsCount = 0;
  let equipmentCount = 0;
  let blogCount = 0;
  let testimonialsCount = 0;
  let travauxCount = 0;

  try {
    const db = await getDb();
    [
      contactsCount,
      lodgingsCount,
      equipmentCount,
      blogCount,
      testimonialsCount,
      travauxCount,
    ] = await Promise.all([
      db.collection("contacts").countDocuments(),
      db.collection("lodgings").countDocuments(),
      db.collection("equipment").countDocuments(),
      db.collection("blogPosts").countDocuments(),
      db.collection("testimonials").countDocuments(),
      db.collection("travaux").countDocuments(),
    ]);
  } catch {
    // Mongo indisponible
  }

  const cards = [
    { label: "Contacts", value: contactsCount },
    { label: "Logements", value: lodgingsCount },
    { label: "Matériel event", value: equipmentCount },
    { label: "Articles blog", value: blogCount },
    { label: "Témoignages", value: testimonialsCount },
    { label: "Travaux", value: travauxCount },
  ];

  return (
    <>
      <AdminPageHeader
        title="Vue d’ensemble"
        description="Pilotez tous les blocs de la page d’accueil FEBiS depuis cet espace."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-febis-ink/8 bg-white/70 p-5"
          >
            <p className="text-sm font-semibold text-febis-ink/55">{card.label}</p>
            <p className="mt-2 font-display text-3xl font-extrabold text-febis-red">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-10">
        <SeedHomepageButton />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-febis-ink">
          Modules accueil
        </h2>
        <Link href="/" className="text-sm font-semibold text-febis-red">
          Prévisualiser →
        </Link>
      </div>
      <AdminModulesGrid />
    </>
  );
}

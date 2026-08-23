import Link from "next/link";
import { getDb } from "@/lib/mongodb";
import {
  AdminModulesGrid,
  AdminStatsGrid,
  SeedHomepageButton,
  type DashboardStat,
} from "@/components/admin/AdminDashboardClient";
import { AdminPageHeader } from "@/components/admin/AdminForms";

export default async function AdminDashboardPage() {
  let contactsCount = 0;
  let lodgingsCount = 0;
  let equipmentCount = 0;
  let blogCount = 0;
  let testimonialsCount = 0;
  let travauxCount = 0;
  let dbOk = true;

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
    dbOk = false;
  }

  const stats: DashboardStat[] = [
    {
      label: "Contacts",
      value: contactsCount,
      href: "/admin/dashboard/contacts",
      hint: "Messages reçus depuis la vitrine",
      group: "inbox",
    },
    {
      label: "Logements",
      value: lodgingsCount,
      href: "/admin/dashboard/residences",
      hint: "Résidences en base",
      group: "activites",
    },
    {
      label: "Matériel event",
      value: equipmentCount,
      href: "/admin/dashboard/evenementiel",
      hint: "Catalogue événementiel",
      group: "activites",
    },
    {
      label: "Articles blog",
      value: blogCount,
      href: "/admin/dashboard/blog",
      hint: "Contenus éditoriaux",
      group: "vitrine",
    },
    {
      label: "Témoignages",
      value: testimonialsCount,
      href: "/admin/dashboard/temoignages",
      hint: "Avis clients publiables",
      group: "vitrine",
    },
    {
      label: "Travaux",
      value: travauxCount,
      href: "/admin/dashboard/travaux",
      hint: "Réalisations BTP & events",
      group: "activites",
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Vue d’ensemble"
        description="Pilotez tous les blocs de la page d’accueil FEBiS et suivez l’activité des modules."
        actions={
          <Link
            href="/"
            target="_blank"
            className="inline-flex rounded-full border border-febis-ink/12 bg-white/80 px-4 py-2 text-sm font-semibold text-febis-ink transition hover:border-febis-red/35 hover:text-febis-red"
          >
            Prévisualiser le site ↗
          </Link>
        }
      />

      {!dbOk && (
        <div className="mb-6 rounded-xl border border-amber-500/25 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          MongoDB indisponible — les compteurs affichent 0. Vérifiez{" "}
          <code className="rounded bg-white/80 px-1">MONGODB_URI</code>.
        </div>
      )}

      <section className="mb-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-febis-ink">
            Indicateurs
          </h2>
          <p className="text-xs text-febis-ink/45">Cliquez pour ouvrir le module</p>
        </div>
        <AdminStatsGrid stats={stats} />
      </section>

      <section className="mb-10">
        <SeedHomepageButton />
      </section>

      <section>
        <div className="mb-4">
          <h2 className="font-display text-xl font-bold text-febis-ink">
            Modules
          </h2>
          <p className="mt-1 text-sm text-febis-ink/50">
            Accès rapide aux éditeurs de contenu et catalogues.
          </p>
        </div>
        <AdminModulesGrid />
      </section>
    </>
  );
}

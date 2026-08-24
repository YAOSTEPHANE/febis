import { getDb } from "@/lib/mongodb";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  AdminModulesGrid,
  AdminStatsGrid,
  DashboardCommandHero,
  DashboardInboxPreview,
  DashboardQuickActions,
  SeedHomepageButton,
  type DashboardContact,
  type DashboardStat,
} from "@/components/admin/AdminDashboardClient";

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();

  let contactsCount = 0;
  let lodgingsCount = 0;
  let equipmentCount = 0;
  let blogCount = 0;
  let testimonialsCount = 0;
  let travauxCount = 0;
  let dbOk = true;
  let recentContacts: DashboardContact[] = [];

  try {
    const db = await getDb();
    const [
      contacts,
      lodgings,
      equipment,
      blog,
      testimonials,
      travaux,
      latestContacts,
    ] = await Promise.all([
      db.collection("contacts").countDocuments(),
      db.collection("lodgings").countDocuments(),
      db.collection("equipment").countDocuments(),
      db.collection("blogPosts").countDocuments(),
      db.collection("testimonials").countDocuments(),
      db.collection("travaux").countDocuments(),
      db
        .collection("contacts")
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),
    ]);

    contactsCount = contacts;
    lodgingsCount = lodgings;
    equipmentCount = equipment;
    blogCount = blog;
    testimonialsCount = testimonials;
    travauxCount = travaux;

    recentContacts = latestContacts.map((doc) => ({
      id: String(doc._id),
      name: String(doc.name ?? "Sans nom"),
      email: String(doc.email ?? ""),
      activity: String(doc.activity ?? ""),
      createdAt: doc.createdAt
        ? new Date(doc.createdAt as string | Date).toISOString()
        : "",
    }));
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
      mark: "CO",
    },
    {
      label: "Logements",
      value: lodgingsCount,
      href: "/admin/dashboard/residences",
      hint: "Résidences en catalogue",
      group: "activites",
      mark: "RÉ",
    },
    {
      label: "Matériel event",
      value: equipmentCount,
      href: "/admin/dashboard/evenementiel",
      hint: "Articles événementiels",
      group: "activites",
      mark: "ÉV",
    },
    {
      label: "Articles blog",
      value: blogCount,
      href: "/admin/dashboard/blog",
      hint: "Contenus éditoriaux",
      group: "vitrine",
      mark: "BL",
    },
    {
      label: "Témoignages",
      value: testimonialsCount,
      href: "/admin/dashboard/temoignages",
      hint: "Avis clients publiables",
      group: "vitrine",
      mark: "TÉ",
    },
    {
      label: "Travaux",
      value: travauxCount,
      href: "/admin/dashboard/travaux",
      hint: "Réalisations BTP & events",
      group: "activites",
      mark: "TR",
    },
  ];

  const totalSignals =
    contactsCount +
    lodgingsCount +
    equipmentCount +
    blogCount +
    testimonialsCount +
    travauxCount;

  return (
    <>
      <DashboardCommandHero
        operatorName={session.name}
        dbOk={dbOk}
        totalSignals={totalSignals}
      />

      {!dbOk && (
        <div className="mb-6 rounded-xl border border-amber-500/25 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          MongoDB indisponible — les compteurs affichent 0. Vérifiez{" "}
          <code className="rounded bg-white/80 px-1">MONGODB_URI</code>.
        </div>
      )}

      <section className="mb-9">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-febis-ink">
              Indicateurs clés
            </h2>
            <p className="text-sm text-febis-ink/45">
              Vue temps réel des modules opérationnels
            </p>
          </div>
        </div>
        <AdminStatsGrid stats={stats} />
      </section>

      <section className="mb-9">
        <div className="mb-3">
          <h2 className="font-display text-xl font-bold text-febis-ink">
            Actions rapides
          </h2>
          <p className="text-sm text-febis-ink/45">
            Accès direct aux tâches les plus fréquentes
          </p>
        </div>
        <DashboardQuickActions />
      </section>

      <section className="mb-10 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <DashboardInboxPreview contacts={recentContacts} />
        <SeedHomepageButton />
      </section>

      <section>
        <div className="mb-4">
          <h2 className="font-display text-xl font-bold text-febis-ink">
            Modules
          </h2>
          <p className="mt-1 text-sm text-febis-ink/50">
            Édition vitrine, catalogues et demandes — organisés par domaine.
          </p>
        </div>
        <AdminModulesGrid />
      </section>
    </>
  );
}

import { getDb } from "@/lib/mongodb";
import { requireAdminSession } from "@/lib/admin-auth";
import { roleLabel } from "@/lib/auth";
import { permissionsFor } from "@/lib/rbac-shared";
import { getDirectionMetrics } from "@/lib/direction-metrics";
import { getRhOverview } from "@/lib/rh";
import { formatXof } from "@/lib/crm-shared";
import { getDashboardChartData } from "@/lib/dashboard-charts";
import type { DashboardChartData } from "@/lib/dashboard-charts-shared";
import {
  AdminDashboardShell,
  type DashboardContact,
  type DashboardDomainStat,
  type DashboardPilotKpi,
} from "@/components/admin/AdminDashboardClient";

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();
  const permissions = permissionsFor(session.role);

  let dbOk = true;
  let contactsCount = 0;
  let lodgingsCount = 0;
  let equipmentCount = 0;
  let productsCount = 0;
  let reservationsCount = 0;
  let clientsCount = 0;
  let employeesCount = 0;
  let blogCount = 0;
  let recentContacts: DashboardContact[] = [];

  let pilot: DashboardPilotKpi[] = [
    {
      label: "Chiffre d’affaires",
      value: formatXof(0),
      hint: "Factures payées + encaissements",
      href: "/admin/dashboard/direction",
    },
    {
      label: "Occupation",
      value: "0 %",
      hint: "Résidences",
      href: "/admin/dashboard/residences",
    },
    {
      label: "Stock dispo",
      value: "100 %",
      hint: "Événementiel & boutique",
      href: "/admin/dashboard/evenementiel",
    },
    {
      label: "Projets ouverts",
      value: "0",
      hint: "CRM + BTP",
      href: "/admin/dashboard/btp",
    },
  ];

  let unpaidCount = 0;
  let unpaidLabel = formatXof(0);
  let leavesPending = 0;
  let lowStockCount = 0;
  let generatedAt = new Date().toISOString();
  let charts: DashboardChartData = {
    caByActivity: [],
    revenueVsExpenses: [],
    paymentsByChannel: [],
    monthlyTrend: [],
    gauges: { occupancy: 0, stock: 100 },
  };

  try {
    const db = await getDb();
    const [metrics, rh, counts, latestContacts, chartData] = await Promise.all([
      getDirectionMetrics(),
      getRhOverview(),
      Promise.all([
        db.collection("contacts").countDocuments(),
        db.collection("lodgings").countDocuments(),
        db.collection("equipment").countDocuments(),
        db.collection("products").countDocuments(),
        db
          .collection("reservations")
          .countDocuments({ cancelled: { $ne: true } }),
        db.collection("clients").countDocuments(),
        db.collection("employees").countDocuments(),
        db.collection("blogPosts").countDocuments(),
      ]),
      db
        .collection("contacts")
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),
      getDashboardChartData(),
    ]);

    const [
      contacts,
      lodgings,
      equipment,
      products,
      reservations,
      clients,
      employees,
      blog,
    ] = counts;

    contactsCount = contacts;
    lodgingsCount = lodgings;
    equipmentCount = equipment;
    productsCount = products;
    reservationsCount = reservations;
    clientsCount = clients;
    employeesCount = employees;
    blogCount = blog;

    pilot = [
      {
        label: "Chiffre d’affaires",
        value: metrics.caLabel,
        hint: "Factures payées + encaissements",
        href: "/admin/dashboard/direction",
      },
      {
        label: "Occupation",
        value: metrics.occupancyLabel,
        hint: `${metrics.activeReservations} séjour(s) en cours`,
        href: "/admin/dashboard/residences",
      },
      {
        label: "Stock dispo",
        value: metrics.stockLabel,
        hint:
          metrics.lowStockCount > 0
            ? `${metrics.lowStockCount} alerte(s)`
            : "Niveaux OK",
        href: "/admin/dashboard/evenementiel",
      },
      {
        label: "Projets ouverts",
        value: String(metrics.projectsOpen),
        hint: `${metrics.btpOpen} chantier(s) BTP`,
        href: "/admin/dashboard/btp",
      },
    ];

    unpaidCount = metrics.unpaidCount;
    unpaidLabel = formatXof(metrics.unpaid);
    leavesPending = rh.leavesPending;
    lowStockCount = metrics.lowStockCount;
    generatedAt = metrics.generatedAt;
    charts = chartData;

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

  const activityStats: DashboardDomainStat[] = [
    {
      label: "Logements",
      value: lodgingsCount,
      href: "/admin/dashboard/residences",
      hint: "Catalogue résidences",
      mark: "RÉ",
    },
    {
      label: "Réservations",
      value: reservationsCount,
      href: "/admin/dashboard/reservations",
      hint: "Demandes & séjours",
      mark: "RV",
    },
    {
      label: "Matériel event",
      value: equipmentCount,
      href: "/admin/dashboard/evenementiel",
      hint: "Parc événementiel",
      mark: "ÉV",
    },
    {
      label: "Produits boutique",
      value: productsCount,
      href: "/admin/dashboard/boutique",
      hint: "Catalogue & stock",
      mark: "BQ",
    },
  ];

  const transverseStats: DashboardDomainStat[] = [
    {
      label: "Clients CRM",
      value: clientsCount,
      href: "/admin/dashboard/crm",
      hint: "Base unique partagée",
      mark: "CRM",
    },
    {
      label: "Employés RH",
      value: employeesCount,
      href: "/admin/dashboard/rh",
      hint: "Dossiers numériques",
      mark: "RH",
    },
    {
      label: "Articles blog",
      value: blogCount,
      href: "/admin/dashboard/blog",
      hint: "Aussi dans Contenu",
      mark: "BL",
    },
    {
      label: "Messages",
      value: contactsCount,
      href: "/admin/dashboard/contacts",
      hint: "Inbox vitrine",
      mark: "CO",
    },
  ];

  return (
    <AdminDashboardShell
      operatorName={session.name}
      roleLabel={roleLabel(session.role)}
      dbOk={dbOk}
      generatedAt={generatedAt}
      pilot={pilot}
      activityStats={activityStats}
      transverseStats={transverseStats}
      contacts={recentContacts}
      unpaidCount={unpaidCount}
      unpaidLabel={unpaidLabel}
      leavesPending={leavesPending}
      lowStockCount={lowStockCount}
      contactsCount={contactsCount}
      permissions={permissions}
      charts={charts}
    />
  );
}

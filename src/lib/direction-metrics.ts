import "server-only";
import type { Db } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { formatXof } from "@/lib/crm-shared";
import type {
  InvoiceDoc,
  LodgingDoc,
  EquipmentDoc,
  ProjectDoc,
  PaymentDoc,
  ProductDoc,
  ReservationDoc,
} from "@/lib/types";
import { ACTIVITIES } from "@/lib/types";

export { formatXof };

async function tryDb(): Promise<Db | null> {
  try {
    return await getDb();
  } catch {
    return null;
  }
}

export type DirectionMetrics = {
  ca: number;
  caLabel: string;
  occupancyRate: number;
  occupancyLabel: string;
  stockRate: number;
  stockLabel: string;
  lowStockCount: number;
  projectsOpen: number;
  projectsLabel: string;
  unpaid: number;
  unpaidCount: number;
  activeReservations: number;
  btpOpen: number;
  caByActivity: Array<{ activity: string; label: string; amount: number }>;
  generatedAt: string;
};

const ACTIVITY_LABELS: Record<string, string> = {
  residences: "Résidences",
  btp: "BTP",
  evenementiel: "Événementiel",
  boutique: "Boutique",
  general: "Général",
};

export async function getDirectionMetrics(): Promise<DirectionMetrics> {
  const empty: DirectionMetrics = {
    ca: 0,
    caLabel: formatXof(0),
    occupancyRate: 0,
    occupancyLabel: "0 %",
    stockRate: 100,
    stockLabel: "100 %",
    lowStockCount: 0,
    projectsOpen: 0,
    projectsLabel: "0 projet",
    unpaid: 0,
    unpaidCount: 0,
    activeReservations: 0,
    btpOpen: 0,
    caByActivity: ACTIVITIES.map((a) => ({
      activity: a,
      label: ACTIVITY_LABELS[a] ?? a,
      amount: 0,
    })),
    generatedAt: new Date().toISOString(),
  };

  const db = await tryDb();
  if (!db) return empty;

  const today = new Date().toISOString().slice(0, 10);

  const [
    invoices,
    payments,
    lodgings,
    equipment,
    products,
    projects,
    btpProjects,
    reservations,
  ] = await Promise.all([
    db.collection<InvoiceDoc>("invoices").find({}).limit(3000).toArray(),
    db
      .collection<PaymentDoc>("payments")
      .find({ status: "confirme", direction: "entrant" })
      .limit(3000)
      .toArray(),
    db.collection<LodgingDoc>("lodgings").find({}).limit(500).toArray(),
    db.collection<EquipmentDoc>("equipment").find({}).limit(500).toArray(),
    db.collection<ProductDoc>("products").find({}).limit(500).toArray(),
    db
      .collection<ProjectDoc>("projects")
      .find({ status: { $in: ["ouvert", "en_cours"] } })
      .limit(500)
      .toArray(),
    db
      .collection("btpProjects")
      .find({
        cancelled: { $ne: true },
        step: { $nin: ["livre", "annule"] },
      })
      .limit(500)
      .toArray(),
    db
      .collection<ReservationDoc>("reservations")
      .find({
        cancelled: { $ne: true },
        checkIn: { $lte: today },
        checkOut: { $gt: today },
      })
      .limit(500)
      .toArray(),
  ]);

  const caByActivityMap = Object.fromEntries(
    ACTIVITIES.map((a) => [a, 0]),
  ) as Record<string, number>;

  let ca = 0;
  for (const inv of invoices) {
    if (inv.status === "payee") {
      ca += inv.amount;
      if (inv.activity !== "general") {
        caByActivityMap[inv.activity] =
          (caByActivityMap[inv.activity] ?? 0) + inv.amount;
      }
    }
  }

  for (const pay of payments) {
    if (!pay.invoiceId) {
      ca += pay.amount;
      if (pay.activity !== "general") {
        caByActivityMap[pay.activity] =
          (caByActivityMap[pay.activity] ?? 0) + pay.amount;
      }
    }
  }

  let unpaid = 0;
  let unpaidCount = 0;
  for (const inv of invoices) {
    if (inv.status === "emise") {
      unpaid += inv.amount;
      unpaidCount += 1;
    }
  }

  const occupiedSlugs = new Set(
    reservations.map((r) => r.lodgingSlug).filter(Boolean),
  );
  const totalLodgings = lodgings.length || 1;
  const occupiedByStatus = lodgings.filter(
    (l) =>
      l.status === "reserve" ||
      l.status === "maintenance" ||
      occupiedSlugs.has(l.slug),
  ).length;
  const occupancyRate = Math.min(
    100,
    Math.round((occupiedByStatus / totalLodgings) * 100),
  );

  let stockTotal = 0;
  let stockAvailable = 0;
  let lowStockCount = 0;

  for (const item of equipment) {
    stockTotal += item.quantityTotal;
    stockAvailable += item.quantityAvailable;
    if (
      item.quantityTotal > 0 &&
      item.quantityAvailable / item.quantityTotal <= 0.2
    ) {
      lowStockCount += 1;
    }
  }

  for (const product of products) {
    const variants = product.variants ?? [];
    const stock = variants.reduce((sum, v) => sum + Number(v.stock ?? 0), 0);
    const capacity = Math.max(stock, variants.length || 1);
    stockTotal += capacity;
    stockAvailable += stock;
    if (stock <= 2) lowStockCount += 1;
  }

  const stockRate =
    stockTotal > 0 ? Math.round((stockAvailable / stockTotal) * 100) : 100;

  const btpOpen = btpProjects.length;
  const projectsOpen = projects.length + btpOpen;

  return {
    ca,
    caLabel: formatXof(ca),
    occupancyRate,
    occupancyLabel: `${occupancyRate} %`,
    stockRate,
    stockLabel: `${stockRate} %`,
    lowStockCount,
    projectsOpen,
    projectsLabel: `${projectsOpen} projet${projectsOpen > 1 ? "s" : ""}`,
    unpaid,
    unpaidCount,
    activeReservations: reservations.length,
    btpOpen,
    caByActivity: ACTIVITIES.map((a) => ({
      activity: a,
      label: ACTIVITY_LABELS[a] ?? a,
      amount: caByActivityMap[a] ?? 0,
    })),
    generatedAt: new Date().toISOString(),
  };
}

import type { Db } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { formatXof } from "@/lib/crm-shared";
import type {
  ExpenseDoc,
  InvoiceDoc,
  LodgingDoc,
  EquipmentDoc,
  ProjectDoc,
  PaymentDoc,
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
    caByActivity: ACTIVITIES.map((a) => ({
      activity: a,
      label: ACTIVITY_LABELS[a] ?? a,
      amount: 0,
    })),
    generatedAt: new Date().toISOString(),
  };

  const db = await tryDb();
  if (!db) return empty;

  const [invoices, payments, lodgings, equipment, projects, expenses] =
    await Promise.all([
      db.collection<InvoiceDoc>("invoices").find({}).limit(3000).toArray(),
      db
        .collection<PaymentDoc>("payments")
        .find({ status: "confirme", direction: "entrant" })
        .limit(3000)
        .toArray(),
      db.collection<LodgingDoc>("lodgings").find({}).limit(500).toArray(),
      db.collection<EquipmentDoc>("equipment").find({}).limit(500).toArray(),
      db
        .collection<ProjectDoc>("projects")
        .find({ status: { $in: ["ouvert", "en_cours"] } })
        .limit(500)
        .toArray(),
      db.collection<ExpenseDoc>("expenses").find({}).limit(1).toArray(),
    ]);

  void expenses;

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

  // Complète avec paiements confirmés non déjà comptés via factures payées
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

  const totalLodgings = lodgings.length || 1;
  const occupied = lodgings.filter(
    (l) => l.status === "reserve" || l.status === "maintenance",
  ).length;
  const occupancyRate = Math.round((occupied / totalLodgings) * 100);

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
  const stockRate =
    stockTotal > 0
      ? Math.round((stockAvailable / stockTotal) * 100)
      : 100;

  const projectsOpen = projects.length;

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
    caByActivity: ACTIVITIES.map((a) => ({
      activity: a,
      label: ACTIVITY_LABELS[a] ?? a,
      amount: caByActivityMap[a] ?? 0,
    })),
    generatedAt: new Date().toISOString(),
  };
}

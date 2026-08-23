import type {
  EquipmentCategory,
  EquipmentDoc,
  EquipmentStatus,
  EventQuoteLine,
  QuoteStatus,
} from "@/lib/types";
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_STATUSES,
  QUOTE_STATUSES,
} from "@/lib/types";
import { formatXof } from "@/lib/residences";

export { formatXof };

export function equipmentStatusLabel(status: EquipmentStatus): string {
  switch (status) {
    case "disponible":
      return "Disponible";
    case "loue":
      return "En location";
    case "maintenance":
      return "Maintenance";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function equipmentCategoryLabel(category: EquipmentCategory): string {
  switch (category) {
    case "mobilier":
      return "Mobilier";
    case "sonorisation":
      return "Sonorisation";
    case "eclairage":
      return "Éclairage";
    case "decoration":
      return "Décoration";
    case "vaisselle":
      return "Vaisselle";
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}

export function quoteStatusLabel(status: QuoteStatus): string {
  switch (status) {
    case "brouillon":
      return "Brouillon";
    case "envoye":
      return "Envoyé";
    case "accepte":
      return "Accepté";
    case "refuse":
      return "Refusé";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function isEquipmentCategory(
  value: string,
): value is EquipmentCategory {
  return (EQUIPMENT_CATEGORIES as readonly string[]).includes(value);
}

export function isEquipmentStatus(value: string): value is EquipmentStatus {
  return (EQUIPMENT_STATUSES as readonly string[]).includes(value);
}

export function isQuoteStatus(value: string): value is QuoteStatus {
  return (QUOTE_STATUSES as readonly string[]).includes(value);
}

export function daysBetween(start: string, end: string): number {
  const a = new Date(`${start}T12:00:00`).getTime();
  const b = new Date(`${end}T12:00:00`).getTime();
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

export function serializeEquipment(
  doc: EquipmentDoc & { _id?: { toString(): string } },
) {
  return {
    id: doc._id?.toString?.() ?? "",
    name: doc.name,
    slug: doc.slug,
    category: doc.category,
    description: doc.description,
    photo: doc.photo,
    pricePerDay: doc.pricePerDay,
    depositAmount: doc.depositAmount,
    currency: doc.currency,
    quantityTotal: doc.quantityTotal,
    quantityAvailable: doc.quantityAvailable,
    status: doc.status,
    penaltyPerDamage: doc.penaltyPerDamage,
  };
}

export type PublicEquipment = ReturnType<typeof serializeEquipment>;

export function buildQuoteLine(input: {
  equipment: PublicEquipment;
  quantity: number;
  days: number;
}): EventQuoteLine {
  const quantity = Math.max(1, input.quantity);
  const days = Math.max(1, input.days);
  const lineTotal = quantity * days * input.equipment.pricePerDay;
  const lineDeposit = quantity * input.equipment.depositAmount;

  return {
    equipmentSlug: input.equipment.slug,
    equipmentName: input.equipment.name,
    quantity,
    days,
    unitPrice: input.equipment.pricePerDay,
    depositUnit: input.equipment.depositAmount,
    lineTotal,
    lineDeposit,
  };
}

export const FALLBACK_EQUIPMENT: PublicEquipment[] = [
  {
    id: "eq-1",
    name: "Chaises Chiavari or",
    slug: "chaises-chiavari-or",
    category: "mobilier",
    description: "Lot de chaises premium pour cérémonies et réceptions.",
    photo: "/images/event-materiel.jpg",
    pricePerDay: 1500,
    depositAmount: 5000,
    currency: "XOF",
    quantityTotal: 200,
    quantityAvailable: 168,
    status: "disponible",
    penaltyPerDamage: 12000,
  },
  {
    id: "eq-2",
    name: "Sono pack 1000W",
    slug: "sono-pack-1000w",
    category: "sonorisation",
    description: "Système amplifié avec micros HF pour soirées et conférences.",
    photo: "/images/pole-eventiel.jpg",
    pricePerDay: 45000,
    depositAmount: 150000,
    currency: "XOF",
    quantityTotal: 8,
    quantityAvailable: 5,
    status: "disponible",
    penaltyPerDamage: 80000,
  },
  {
    id: "eq-3",
    name: "Projecteurs LED ambiance",
    slug: "projecteurs-led-ambiance",
    category: "eclairage",
    description: "Éclairage scénique RGB pilotable pour mise en lumière.",
    photo: "/images/event-materiel.jpg",
    pricePerDay: 18000,
    depositAmount: 40000,
    currency: "XOF",
    quantityTotal: 24,
    quantityAvailable: 0,
    status: "loue",
    penaltyPerDamage: 35000,
  },
  {
    id: "eq-4",
    name: "Arche florale premium",
    slug: "arche-florale-premium",
    category: "decoration",
    description: "Structure décorative pour entrées et photo booth.",
    photo: "/images/pole-eventiel.jpg",
    pricePerDay: 75000,
    depositAmount: 100000,
    currency: "XOF",
    quantityTotal: 4,
    quantityAvailable: 2,
    status: "disponible",
    penaltyPerDamage: 90000,
  },
  {
    id: "eq-5",
    name: "Service vaisselle cristal",
    slug: "vaisselle-cristal",
    category: "vaisselle",
    description: "Assiettes, verres et couverts pour 50 convives.",
    photo: "/images/event-materiel.jpg",
    pricePerDay: 35000,
    depositAmount: 80000,
    currency: "XOF",
    quantityTotal: 12,
    quantityAvailable: 9,
    status: "disponible",
    penaltyPerDamage: 25000,
  },
  {
    id: "eq-6",
    name: "Tente stretch 10x15",
    slug: "tente-stretch-10x15",
    category: "mobilier",
    description: "Couverture événementielle élégante pour extérieur.",
    photo: "/images/pole-eventiel.jpg",
    pricePerDay: 120000,
    depositAmount: 250000,
    currency: "XOF",
    quantityTotal: 3,
    quantityAvailable: 1,
    status: "maintenance",
    penaltyPerDamage: 200000,
  },
];

export const EVENT_PROCESS = [
  {
    title: "Catalogue live",
    text: "Disponibilité temps réel : disponible, loué, maintenance.",
  },
  {
    title: "Prix & cautions",
    text: "Tarif journalier et caution définis article par article.",
  },
  {
    title: "Devis de location",
    text: "Génération automatique du devis avec totaux location + caution.",
  },
  {
    title: "Sorties / retours",
    text: "Suivi des mouvements de matériel pour chaque événement.",
  },
  {
    title: "Dommages & pénalités",
    text: "Enregistrement des dégâts et application des pénalités associées.",
  },
] as const;

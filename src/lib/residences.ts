import type {
  CalendarDay,
  DayStatus,
  LodgingCategory,
  LodgingDoc,
  LodgingStatus,
  ReservationStep,
} from "@/lib/types";
import { LODGING_CATEGORIES, RESERVATION_STEPS } from "@/lib/types";

export function formatXof(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const start = parseDateKey(checkIn).getTime();
  const end = parseDateKey(checkOut).getTime();
  const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return nights;
}

export function eachDateKey(from: string, toExclusive: string): string[] {
  const keys: string[] = [];
  const cursor = parseDateKey(from);
  const end = parseDateKey(toExclusive);
  while (cursor < end) {
    keys.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

export function statusLabel(status: DayStatus | LodgingStatus): string {
  switch (status) {
    case "disponible":
      return "Disponible";
    case "reserve":
      return "Réservé";
    case "maintenance":
      return "Maintenance";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function stepLabel(step: ReservationStep): string {
  switch (step) {
    case "demande":
      return "Demande";
    case "reservation":
      return "Réservation";
    case "acompte":
      return "Acompte";
    case "check_in":
      return "Check-in";
    case "check_out":
      return "Check-out";
    case "etat_des_lieux":
      return "État des lieux";
    default: {
      const _exhaustive: never = step;
      return _exhaustive;
    }
  }
}

export function categoryLabel(category: LodgingCategory): string {
  switch (category) {
    case "appartement":
      return "Appartement";
    case "studio":
      return "Studio";
    case "villa":
      return "Villa";
    case "suite":
      return "Suite";
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}

export function isLodgingCategory(value: string): value is LodgingCategory {
  return (LODGING_CATEGORIES as readonly string[]).includes(value);
}

export function stepIndex(step: ReservationStep): number {
  return RESERVATION_STEPS.indexOf(step);
}

export function buildCalendarDays(options: {
  month: Date;
  lodgingStatus: LodgingStatus;
  reservedRanges: Array<{ checkIn: string; checkOut: string }>;
}): CalendarDay[] {
  const year = options.month.getFullYear();
  const monthIndex = options.month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const reserved = new Set<string>();

  for (const range of options.reservedRanges) {
    for (const key of eachDateKey(range.checkIn, range.checkOut)) {
      reserved.add(key);
    }
  }

  const days: CalendarDay[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day);
    const key = toDateKey(date);
    let status: DayStatus = "disponible";

    if (options.lodgingStatus === "maintenance") {
      status = "maintenance";
    } else if (reserved.has(key)) {
      status = "reserve";
    }

    days.push({
      date: key,
      status,
      label: statusLabel(status),
    });
  }

  return days;
}

export function serializeLodging(doc: LodgingDoc & { _id?: { toString(): string } }) {
  return {
    id: doc._id?.toString?.() ?? "",
    title: doc.title,
    slug: doc.slug,
    description: doc.description,
    longDescription: doc.longDescription ?? doc.description,
    photos: doc.photos,
    pricePerNight: doc.pricePerNight,
    depositPercent: doc.depositPercent ?? 30,
    currency: doc.currency,
    status: doc.status,
    capacity: doc.capacity,
    bedrooms: doc.bedrooms ?? 1,
    bathrooms: doc.bathrooms ?? 1,
    location: doc.location,
    neighborhood: doc.neighborhood ?? doc.location,
    category: doc.category ?? "appartement",
    amenities: doc.amenities,
    highlights: doc.highlights ?? [],
  };
}

export type PublicLodging = ReturnType<typeof serializeLodging>;

/** Données de démonstration si MongoDB est indisponible */
export const FALLBACK_LODGINGS: PublicLodging[] = [
  {
    id: "fallback-1",
    title: "Résidence Cocody Premium",
    slug: "cocody-premium",
    description:
      "Appartement meublé haut de gamme à Cocody — idéal court et moyen séjour.",
    longDescription:
      "Un écrin contemporain au cœur de Cocody : volumes généreux, matériaux nobles et services d’accueil FEBiS. Parfait pour dirigeants, familles et séjours d’affaires exigeants.",
    photos: [
      "/images/pole-residences.jpg",
      "/images/residence-bedroom.jpg",
      "/images/residence-terrace.jpg",
    ],
    pricePerNight: 45000,
    depositPercent: 30,
    currency: "XOF",
    status: "disponible",
    capacity: 4,
    bedrooms: 2,
    bathrooms: 2,
    location: "Cocody, Abidjan",
    neighborhood: "Cocody",
    category: "appartement",
    amenities: ["Wi-Fi", "Climatisation", "Cuisine équipée", "Parking", "Linge"],
    highlights: ["Vue jardin", "Check-in flexible", "Conciergerie"],
  },
  {
    id: "fallback-2",
    title: "Studio Plateau Affaires",
    slug: "plateau-affaires",
    description:
      "Studio fonctionnel au Plateau pour déplacements professionnels.",
    longDescription:
      "Studio design face aux axes du Plateau : connexion fibre, coin bureau et lit premium. Une base discrète et efficace pour vos missions en ville.",
    photos: [
      "/images/residence-bedroom.jpg",
      "/images/pole-residences.jpg",
      "/images/residence-terrace.jpg",
    ],
    pricePerNight: 28000,
    depositPercent: 30,
    currency: "XOF",
    status: "disponible",
    capacity: 2,
    bedrooms: 1,
    bathrooms: 1,
    location: "Plateau, Abidjan",
    neighborhood: "Plateau",
    category: "studio",
    amenities: ["Wi-Fi", "Climatisation", "Bureau", "Smart TV"],
    highlights: ["Centre-ville", "Idéal business"],
  },
  {
    id: "fallback-3",
    title: "Villa Riviera Famille",
    slug: "riviera-famille",
    description:
      "Villa spacieuse à Riviera pour familles et séjours prolongés.",
    longDescription:
      "Villa familiale avec jardin et générateur : l’équilibre parfait entre intimité et confort premium pour les longues escales à Riviera.",
    photos: [
      "/images/residence-terrace.jpg",
      "/images/pole-residences.jpg",
      "/images/residence-bedroom.jpg",
    ],
    pricePerNight: 85000,
    depositPercent: 40,
    currency: "XOF",
    status: "maintenance",
    capacity: 8,
    bedrooms: 4,
    bathrooms: 3,
    location: "Riviera, Abidjan",
    neighborhood: "Riviera",
    category: "villa",
    amenities: ["Wi-Fi", "Jardin", "Générateur", "Sécurité", "Cuisine"],
    highlights: ["Grand salon", "Espace enfants"],
  },
  {
    id: "fallback-4",
    title: "Suite Executive Marcory",
    slug: "suite-marcory",
    description:
      "Suite premium à Marcory pour séjours business avec salon privé.",
    longDescription:
      "Suite exécutive avec salon séparé, dressing et service conciergerie — conçue pour les séjours professionnels exigeants.",
    photos: [
      "/images/residence-bedroom.jpg",
      "/images/residence-terrace.jpg",
      "/images/pole-residences.jpg",
    ],
    pricePerNight: 62000,
    depositPercent: 35,
    currency: "XOF",
    status: "disponible",
    capacity: 3,
    bedrooms: 1,
    bathrooms: 1,
    location: "Marcory, Abidjan",
    neighborhood: "Marcory",
    category: "suite",
    amenities: ["Wi-Fi", "Climatisation", "Salon", "Parking", "Service"],
    highlights: ["Salon privé", "Idéal cadres"],
  },
];

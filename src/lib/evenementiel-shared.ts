import type {
  EquipmentCategory,
  EquipmentStatus,
  EventQuoteLine,
  MovementType,
  QuoteStatus,
} from "@/lib/types";
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_STATUSES,
  MOVEMENT_TYPES,
  QUOTE_STATUSES,
} from "@/lib/types";
import { formatXof } from "@/lib/crm-shared";

export {
  formatXof,
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_STATUSES,
  QUOTE_STATUSES,
  MOVEMENT_TYPES,
};
export type {
  EquipmentCategory,
  EquipmentStatus,
  EventQuoteLine,
  MovementType,
  QuoteStatus,
};

export type SerializedEquipment = {
  id: string;
  name: string;
  slug: string;
  category: EquipmentCategory;
  description: string;
  photo: string;
  pricePerDay: number;
  depositAmount: number;
  currency: "XOF";
  quantityTotal: number;
  quantityAvailable: number;
  status: EquipmentStatus;
  penaltyPerDamage: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SerializedEventQuote = {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventDate: string;
  returnDate: string;
  message: string;
  lines: EventQuoteLine[];
  rentalTotal: number;
  depositTotal: number;
  currency: "XOF";
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
};

export type SerializedMovement = {
  id: string;
  quoteId: string | null;
  equipmentSlug: string;
  equipmentName: string;
  type: MovementType;
  quantity: number;
  note: string;
  damageReported: boolean;
  penaltyAmount: number;
  createdAt: string;
};

export function equipmentStatusLabel(status: EquipmentStatus | string): string {
  switch (status) {
    case "disponible":
      return "Disponible";
    case "loue":
      return "En location";
    case "maintenance":
      return "Maintenance";
    default:
      return status;
  }
}

export function equipmentCategoryLabel(
  category: EquipmentCategory | string,
): string {
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
    default:
      return category;
  }
}

export function quoteStatusLabel(status: QuoteStatus | string): string {
  switch (status) {
    case "brouillon":
      return "Brouillon";
    case "envoye":
      return "Envoyé";
    case "accepte":
      return "Accepté";
    case "refuse":
      return "Refusé";
    default:
      return status;
  }
}

export function movementTypeLabel(type: MovementType | string): string {
  switch (type) {
    case "sortie":
      return "Sortie";
    case "retour":
      return "Retour";
    default:
      return type;
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

export function isMovementType(value: string): value is MovementType {
  return (MOVEMENT_TYPES as readonly string[]).includes(value);
}

export function slugifyEquipment(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

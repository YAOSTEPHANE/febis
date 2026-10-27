import type {
  LodgingCategory,
  LodgingStatus,
  PaymentChannel,
  ReservationStep,
} from "@/lib/types";
import {
  LODGING_CATEGORIES,
  LODGING_STATUSES,
  PAYMENT_CHANNELS,
  RESERVATION_STEPS,
} from "@/lib/types";
import { formatXof } from "@/lib/crm-shared";

export {
  formatXof,
  LODGING_CATEGORIES,
  LODGING_STATUSES,
  PAYMENT_CHANNELS,
  RESERVATION_STEPS,
};

export type InventoryChecklistItem = {
  id: string;
  label: string;
  ok: boolean;
  note: string;
};

export type CancellationRefund = {
  refundPercent: number;
  refundAmount: number;
  adminFee: number;
  hoursBeforeCheckIn: number;
  policyLabel: string;
};

export type SerializedReservation = {
  id: string;
  lodgingId: string;
  lodgingSlug: string;
  lodgingTitle: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalAmount: number;
  depositAmount: number;
  currency: "XOF";
  step: ReservationStep;
  message: string;
  paymentChannel: PaymentChannel | null;
  inventoryNotes: string;
  inventoryChecklist: InventoryChecklistItem[];
  cancelled: boolean;
  cancellationRefund: CancellationRefund | null;
  createdAt: string;
  updatedAt: string;
};

/** Politique CDC figée : ≥48h 100 %, 24–48h 50 %, &lt;24h 0 % ; frais 5 000 si partiel. */
export const CANCELLATION_ADMIN_FEE = 5000;

export function computeCancellationRefund(input: {
  checkIn: string;
  depositAmount: number;
  now?: Date;
}): CancellationRefund {
  const now = input.now ?? new Date();
  const checkInMs = new Date(`${input.checkIn}T12:00:00`).getTime();
  const hoursBeforeCheckIn = Math.max(
    0,
    (checkInMs - now.getTime()) / (1000 * 60 * 60),
  );

  let refundPercent = 0;
  let policyLabel = "Moins de 24 h — aucun remboursement";
  if (hoursBeforeCheckIn >= 48) {
    refundPercent = 100;
    policyLabel = "≥ 48 h — remboursement 100 % de l’acompte";
  } else if (hoursBeforeCheckIn >= 24) {
    refundPercent = 50;
    policyLabel = "24–48 h — remboursement 50 % de l’acompte";
  }

  const raw = Math.round((input.depositAmount * refundPercent) / 100);
  const adminFee =
    refundPercent > 0 && refundPercent < 100 ? CANCELLATION_ADMIN_FEE : 0;
  const refundAmount = Math.max(0, raw - adminFee);

  return {
    refundPercent,
    refundAmount,
    adminFee,
    hoursBeforeCheckIn: Math.round(hoursBeforeCheckIn * 10) / 10,
    policyLabel,
  };
}

export const DEFAULT_INVENTORY_CHECKLIST: InventoryChecklistItem[] = [
  { id: "cles", label: "Clés / badges", ok: true, note: "" },
  { id: "salon", label: "Salon / mobilier", ok: true, note: "" },
  { id: "cuisine", label: "Cuisine / électroménager", ok: true, note: "" },
  { id: "chambres", label: "Chambres / literie", ok: true, note: "" },
  { id: "sdb", label: "Salle de bain", ok: true, note: "" },
  { id: "electromenager", label: "TV / Wi-Fi / clim", ok: true, note: "" },
];

export const CANCELLATION_POLICY_PUBLIC = [
  "Annulation ≥ 48 h avant l’arrivée : remboursement intégral de l’acompte.",
  "Annulation entre 24 h et 48 h : remboursement de 50 % de l’acompte (frais admin 5 000 FCFA).",
  "Annulation moins de 24 h avant l’arrivée : aucun remboursement.",
];

export function statusLabel(status: LodgingStatus | "reserve" | string): string {
  switch (status) {
    case "disponible":
      return "Disponible";
    case "reserve":
      return "Réservé";
    case "maintenance":
      return "Maintenance";
    default:
      return status;
  }
}

export function stepLabel(step: ReservationStep | string): string {
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
    default:
      return step;
  }
}

export function categoryLabel(category: LodgingCategory | string): string {
  switch (category) {
    case "appartement":
      return "Appartement";
    case "studio":
      return "Studio";
    case "villa":
      return "Villa";
    case "suite":
      return "Suite";
    default:
      return category;
  }
}

export function paymentChannelLabel(channel: string | null | undefined): string {
  switch (channel) {
    case "wave":
      return "Wave CI";
    case "orange_money":
      return "Orange Money";
    case "mtn_money":
      return "MTN Money";
    case "mobile_money":
      return "Mobile Money";
    case "virement":
      return "Virement";
    case "especes":
      return "Espèces";
    default:
      return channel || "—";
  }
}

export function isReservationStep(value: string): value is ReservationStep {
  return (RESERVATION_STEPS as readonly string[]).includes(value);
}

export function isLodgingStatus(value: string): value is LodgingStatus {
  return (LODGING_STATUSES as readonly string[]).includes(value);
}

export function isLodgingCategory(value: string): value is LodgingCategory {
  return (LODGING_CATEGORIES as readonly string[]).includes(value);
}

export function slugifyLodgingTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

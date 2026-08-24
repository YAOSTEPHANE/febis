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
  cancelled: boolean;
  createdAt: string;
  updatedAt: string;
};

export function statusLabel(status: DayStatusLike): string {
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

type DayStatusLike = LodgingStatus | "reserve";

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

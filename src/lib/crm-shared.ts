import type { ClientStatus } from "@/lib/types";

export type SerializedClient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  tags: string[];
  modules: string[];
  status: ClientStatus;
  interactionsCount: number;
  lastInteractionAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SerializedInteraction = {
  id: string;
  type: string;
  activity: string;
  title: string;
  message: string;
  refType?: string;
  refId?: string;
  at: string;
};

export type SerializedInvoice = {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  activity: string;
  title: string;
  amount: number;
  currency: "XOF";
  status: string;
  sourceType?: string;
  sourceId?: string;
  createdAt: string;
};

export type SerializedProject = {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  activity: string;
  status: string;
  amount: number | null;
  currency: "XOF";
  sourceType?: string;
  sourceId?: string;
  createdAt: string;
  updatedAt: string;
};

export function interactionTypeLabel(type: string) {
  switch (type) {
    case "contact_form":
      return "Contact vitrine";
    case "reservation_demande":
      return "Réservation";
    case "event_quote":
      return "Devis event";
    case "shop_order":
      return "Commande boutique";
    case "note":
      return "Note";
    case "appel":
      return "Appel";
    case "email":
      return "Email";
    case "facture":
      return "Facture";
    case "projet":
      return "Projet";
    default:
      return type;
  }
}

export function activityLabel(activity: string) {
  switch (activity) {
    case "residences":
      return "Résidences";
    case "btp":
      return "BTP";
    case "evenementiel":
      return "Événementiel";
    case "boutique":
      return "Boutique";
    case "general":
      return "Général";
    default:
      return activity;
  }
}

export function formatXof(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount);
}

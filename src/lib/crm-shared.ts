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
  /** Lien admin vers le document métier source */
  href?: string | null;
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
  href?: string | null;
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
  href?: string | null;
};

export type CrmStats = {
  total: number;
  prospects: number;
  actifs: number;
  inactifs: number;
  withInteractions: number;
  linkedInvoices: number;
  linkedProjects: number;
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

export function clientStatusLabel(status: string) {
  switch (status) {
    case "prospect":
      return "Prospect";
    case "actif":
      return "Actif";
    case "inactif":
      return "Inactif";
    default:
      return status;
  }
}

export function invoiceStatusLabel(status: string) {
  switch (status) {
    case "brouillon":
      return "Brouillon";
    case "emise":
      return "Émise";
    case "payee":
      return "Payée";
    case "annulee":
      return "Annulée";
    default:
      return status;
  }
}

export function projectStatusLabel(status: string) {
  switch (status) {
    case "ouvert":
      return "Ouvert";
    case "en_cours":
      return "En cours";
    case "termine":
      return "Terminé";
    case "annule":
      return "Annulé";
    default:
      return status;
  }
}

export function formatXof(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Deep-link admin vers la source d’une interaction / projet / facture */
export function crmSourceHref(
  refType?: string | null,
  refId?: string | null,
  sourceType?: string | null,
): string | null {
  const id = refId?.trim();
  if (!id) return null;

  const kind = refType || sourceType || "";
  switch (kind) {
    case "reservation":
      return `/admin/dashboard/reservations/${id}`;
    case "event_quote":
      return `/admin/dashboard/evenementiel/${id}`;
    case "shop_order":
      return `/admin/dashboard/boutique/${id}`;
    case "btp":
      return `/admin/dashboard/btp/${id}`;
    case "project":
      if (sourceType === "btp") return `/admin/dashboard/btp/${id}`;
      if (sourceType === "reservation")
        return `/admin/dashboard/reservations/${id}`;
      if (sourceType === "event_quote")
        return `/admin/dashboard/evenementiel/${id}`;
      if (sourceType === "shop_order")
        return `/admin/dashboard/boutique/${id}`;
      return null;
    case "invoice":
    case "contact":
      return null;
    default:
      if (sourceType === "btp") return `/admin/dashboard/btp/${id}`;
      if (sourceType === "reservation")
        return `/admin/dashboard/reservations/${id}`;
      if (sourceType === "event_quote")
        return `/admin/dashboard/evenementiel/${id}`;
      if (sourceType === "shop_order")
        return `/admin/dashboard/boutique/${id}`;
      return null;
  }
}

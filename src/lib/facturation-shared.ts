import type { BillingDocType } from "@/lib/types";
import { BILLING_DOC_TYPES } from "@/lib/types";
import { activityLabel, formatXof } from "@/lib/crm-shared";

export { BILLING_DOC_TYPES, activityLabel, formatXof };

export function billingTypeLabel(type: string) {
  switch (type) {
    case "devis":
      return "Devis";
    case "facture":
      return "Facture";
    case "recu":
      return "Reçu";
    case "contrat":
      return "Contrat";
    case "rapport":
      return "Rapport";
    default:
      return type;
  }
}

export function isBillingDocType(value: string): value is BillingDocType {
  return (BILLING_DOC_TYPES as readonly string[]).includes(value);
}

export type SerializedBillingDoc = {
  id: string;
  type: BillingDocType;
  number: string;
  title: string;
  activity: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: "XOF";
  notes: string;
  sourceType: string;
  sourceId: string;
  createdAt: string;
};

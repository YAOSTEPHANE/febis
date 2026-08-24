import type { BtpStep } from "@/lib/types";
import { BTP_STEPS } from "@/lib/types";
import { formatXof } from "@/lib/crm-shared";

export { formatXof, BTP_STEPS };
export type { BtpStep };

export type SerializedBtpProject = {
  id: string;
  reference: string;
  title: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany: string;
  location: string;
  description: string;
  step: BtpStep;
  quoteAmount: number;
  contractAmount: number;
  progressPercent: number;
  currency: "XOF";
  startDate: string;
  expectedEndDate: string;
  deliveredAt: string | null;
  notes: string;
  cancelled: boolean;
  crmClientId: string | null;
  crmProjectId: string | null;
  createdAt: string;
  updatedAt: string;
};

export function btpStepLabel(step: BtpStep | string): string {
  switch (step) {
    case "prospect":
      return "Prospect";
    case "devis":
      return "Devis";
    case "contrat":
      return "Contrat";
    case "chantier":
      return "Chantier";
    case "avancement":
      return "Avancement";
    case "livraison":
      return "Livraison";
    default:
      return step;
  }
}

export function isBtpStep(value: string): value is BtpStep {
  return (BTP_STEPS as readonly string[]).includes(value);
}

/** Index d’étape pour barre de progression visuelle */
export function btpStepIndex(step: BtpStep): number {
  return BTP_STEPS.indexOf(step);
}

export function defaultProgressForStep(step: BtpStep): number {
  switch (step) {
    case "prospect":
      return 5;
    case "devis":
      return 15;
    case "contrat":
      return 25;
    case "chantier":
      return 40;
    case "avancement":
      return 70;
    case "livraison":
      return 100;
    default: {
      const _exhaustive: never = step;
      return _exhaustive;
    }
  }
}

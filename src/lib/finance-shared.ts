import type {
  Activity,
  ExpenseCategory,
  PaymentChannel,
  PaymentDirection,
  PaymentStatus,
} from "@/lib/types";
import {
  ACTIVITIES,
  EXPENSE_CATEGORIES,
  PAYMENT_CHANNELS,
  PAYMENT_DIRECTIONS,
  PAYMENT_STATUSES,
} from "@/lib/types";
import { activityLabel, formatXof } from "@/lib/crm-shared";

export {
  ACTIVITIES,
  EXPENSE_CATEGORIES,
  PAYMENT_CHANNELS,
  PAYMENT_DIRECTIONS,
  PAYMENT_STATUSES,
  activityLabel,
  formatXof,
};

export function paymentChannelLabel(channel: string) {
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
      return channel;
  }
}

export function expenseCategoryLabel(category: string) {
  switch (category) {
    case "achats":
      return "Achats";
    case "salaires":
      return "Salaires";
    case "maintenance":
      return "Maintenance";
    case "logistique":
      return "Logistique";
    case "marketing":
      return "Marketing";
    case "loyers":
      return "Loyers";
    case "autres":
      return "Autres";
    default:
      return category;
  }
}

export function paymentStatusLabel(status: string) {
  switch (status) {
    case "en_attente":
      return "En attente";
    case "confirme":
      return "Confirmé";
    case "echec":
      return "Échec";
    case "annule":
      return "Annulé";
    default:
      return status;
  }
}

export function paymentDirectionLabel(direction: string) {
  switch (direction) {
    case "entrant":
      return "Entrant";
    case "sortant":
      return "Sortant";
    default:
      return direction;
  }
}

export type ActivityMoneyRow = {
  activity: Activity;
  label: string;
  revenue: number;
  expenses: number;
  net: number;
  unpaid: number;
};

export type ChannelMoneyRow = {
  channel: PaymentChannel;
  label: string;
  inbound: number;
  outbound: number;
  count: number;
};

export type SerializedExpense = {
  id: string;
  activity: Activity;
  category: ExpenseCategory;
  title: string;
  amount: number;
  paymentChannel: string;
  reference: string;
  notes: string;
  spentAt: string;
  createdAt: string;
};

export type SerializedPayment = {
  id: string;
  activity: string;
  channel: PaymentChannel;
  direction: PaymentDirection;
  amount: number;
  status: PaymentStatus;
  title: string;
  reference: string;
  clientName: string;
  invoiceId: string;
  invoiceNumber: string;
  paidAt: string;
  createdAt: string;
};

export type SerializedUnpaid = {
  id: string;
  number: string;
  clientName: string;
  activity: string;
  title: string;
  amount: number;
  status: string;
  createdAt: string;
  ageDays: number;
};

export type FinanceDashboard = {
  totals: {
    revenue: number;
    expenses: number;
    net: number;
    unpaid: number;
    unpaidCount: number;
    paymentsIn: number;
    paymentsOut: number;
  };
  byActivity: ActivityMoneyRow[];
  byChannel: ChannelMoneyRow[];
  unpaid: SerializedUnpaid[];
  recentPayments: SerializedPayment[];
  recentExpenses: SerializedExpense[];
};

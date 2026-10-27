export const PAYMENT_SOURCE_TYPES = [
  "reservation",
  "boutique",
  "evenementiel",
  "btp",
] as const;

export type PaymentSourceType = (typeof PAYMENT_SOURCE_TYPES)[number];

export const PAYMENT_INTENT_STATUSES = [
  "pending",
  "confirmed",
  "failed",
  "cancelled",
] as const;

export type PaymentIntentStatus = (typeof PAYMENT_INTENT_STATUSES)[number];

export type SerializedPaymentIntent = {
  id: string;
  reference: string;
  sourceType: PaymentSourceType;
  sourceId: string;
  activity: string;
  amount: number;
  currency: "XOF";
  channel: string;
  status: PaymentIntentStatus;
  title: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  instructions: string;
  merchantPhone: string;
  merchantName: string;
  mode: "manual" | "api";
  providerStatus: string;
  checkoutUrl: string;
  paymentId: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string;
};

export function isPaymentSourceType(value: string): value is PaymentSourceType {
  return (PAYMENT_SOURCE_TYPES as readonly string[]).includes(value);
}

export function isPaymentIntentStatus(
  value: string,
): value is PaymentIntentStatus {
  return (PAYMENT_INTENT_STATUSES as readonly string[]).includes(value);
}

export function paymentIntentStatusLabel(status: PaymentIntentStatus | string) {
  switch (status) {
    case "pending":
      return "En attente";
    case "confirmed":
      return "Confirmé";
    case "failed":
      return "Échec";
    case "cancelled":
      return "Annulé";
    default:
      return status;
  }
}

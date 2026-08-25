import type { MobileMoneyProvider, PaymentChannel } from "@/lib/types";
import type { MobileMoneyMethodConfig } from "@/lib/payment-settings-shared";

export type PaymentIntentMode = "manual" | "api";

export type InitiatePaymentInput = {
  provider: MobileMoneyProvider;
  amount: number;
  currency: "XOF";
  reference?: string;
  customerPhone?: string;
  customerName?: string;
  description?: string;
};

export type PaymentIntentResult = {
  provider: MobileMoneyProvider;
  mode: PaymentIntentMode;
  status: "pending_manual" | "initiated" | "unavailable";
  merchantPhone?: string;
  merchantName?: string;
  instructions: string;
  externalId?: string;
  checkoutUrl?: string;
  message: string;
};

export type PaymentProviderAdapter = {
  id: MobileMoneyProvider;
  initiate: (
    input: InitiatePaymentInput,
    config: MobileMoneyMethodConfig,
  ) => Promise<PaymentIntentResult>;
};

export function isPaymentChannel(value: string): value is PaymentChannel {
  return (
    value === "wave" ||
    value === "orange_money" ||
    value === "mtn_money" ||
    value === "mobile_money" ||
    value === "virement" ||
    value === "especes"
  );
}

import type {
  InitiatePaymentInput,
  PaymentProviderAdapter,
} from "@/lib/payment-providers/types";
import type { MobileMoneyMethodConfig } from "@/lib/payment-settings-shared";
import { paymentChannelLabel } from "@/lib/finance-shared";

function manualResult(
  input: InitiatePaymentInput,
  config: MobileMoneyMethodConfig,
) {
  const label = paymentChannelLabel(input.provider);
  return {
    provider: input.provider,
    mode: "manual" as const,
    status: config.enabled
      ? ("pending_manual" as const)
      : ("unavailable" as const),
    merchantName: config.merchantName,
    merchantPhone: config.merchantPhone,
    instructions: config.instructions,
    message: config.enabled
      ? `Paiement ${label} en mode manuel — utilisez le numéro marchand FEBiS.`
      : `${label} est désactivé.`,
  };
}

export const mtnMoneyProvider: PaymentProviderAdapter = {
  id: "mtn_money",
  async initiate(input: InitiatePaymentInput, config: MobileMoneyMethodConfig) {
    return manualResult(input, config);
  },
};

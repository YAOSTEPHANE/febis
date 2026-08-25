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

/**
 * Stub Orange Money CI.
 * Plus tard : ORANGE_MONEY_CLIENT_ID / ORANGE_MONEY_CLIENT_SECRET + webhooks.
 */
export const orangeMoneyProvider: PaymentProviderAdapter = {
  id: "orange_money",
  async initiate(input: InitiatePaymentInput, config: MobileMoneyMethodConfig) {
    if (
      process.env.ORANGE_MONEY_CLIENT_ID &&
      process.env.ORANGE_MONEY_CLIENT_SECRET
    ) {
      return {
        ...manualResult(input, config),
        message:
          "Identifiants Orange Money détectés — branchez l’API Orange Money Web Payment ici.",
      };
    }
    return manualResult(input, config);
  },
};

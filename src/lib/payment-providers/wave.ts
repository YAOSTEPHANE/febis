import type {
  InitiatePaymentInput,
  PaymentIntentResult,
  PaymentProviderAdapter,
} from "@/lib/payment-providers/types";
import type { MobileMoneyMethodConfig } from "@/lib/payment-settings-shared";
import { paymentChannelLabel } from "@/lib/finance-shared";

function manualResult(
  input: InitiatePaymentInput,
  config: MobileMoneyMethodConfig,
): PaymentIntentResult {
  const label = paymentChannelLabel(input.provider);
  return {
    provider: input.provider,
    mode: "manual",
    status: config.enabled ? "pending_manual" : "unavailable",
    merchantName: config.merchantName,
    merchantPhone: config.merchantPhone,
    instructions: config.instructions,
    message: config.enabled
      ? `Paiement ${label} en mode manuel — utilisez le numéro marchand FEBiS.`
      : `${label} est désactivé.`,
  };
}

/**
 * Stub Wave CI.
 * Plus tard : brancher WAVE_API_KEY / WAVE_WEBHOOK_SECRET pour initiate + webhook.
 */
export const waveProvider: PaymentProviderAdapter = {
  id: "wave",
  async initiate(input, config) {
    if (process.env.WAVE_API_KEY) {
      // Placeholder pour future intégration API Wave.
      // Ne pas appeler le réseau tant que le contrat API n'est pas branché.
      return {
        ...manualResult(input, config),
        message:
          "WAVE_API_KEY détectée — branchez l’appel API Wave ici (Checkout / Payment Intent).",
      };
    }
    return manualResult(input, config);
  },
};

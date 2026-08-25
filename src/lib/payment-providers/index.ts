import type { MobileMoneyProvider } from "@/lib/types";
import { isMobileMoneyProvider } from "@/lib/types";
import { getPaymentMethodsSettings } from "@/lib/payment-settings";
import { waveProvider } from "@/lib/payment-providers/wave";
import { orangeMoneyProvider } from "@/lib/payment-providers/orange-money";
import { mtnMoneyProvider } from "@/lib/payment-providers/mtn-money";
import type {
  InitiatePaymentInput,
  PaymentIntentResult,
  PaymentProviderAdapter,
} from "@/lib/payment-providers/types";

const REGISTRY: Record<MobileMoneyProvider, PaymentProviderAdapter> = {
  wave: waveProvider,
  orange_money: orangeMoneyProvider,
  mtn_money: mtnMoneyProvider,
};

export function getProvider(
  id: MobileMoneyProvider,
): PaymentProviderAdapter {
  return REGISTRY[id];
}

export async function initiateMobileMoneyPayment(
  input: Omit<InitiatePaymentInput, "provider"> & { provider: string },
): Promise<PaymentIntentResult> {
  if (!isMobileMoneyProvider(input.provider)) {
    return {
      provider: "wave",
      mode: "manual",
      status: "unavailable",
      instructions: "",
      message: "Moyen de paiement Mobile Money invalide.",
    };
  }

  const settings = await getPaymentMethodsSettings();
  const config = settings.methods[input.provider];
  const adapter = getProvider(input.provider);
  return adapter.initiate(
    {
      provider: input.provider,
      amount: input.amount,
      currency: input.currency,
      reference: input.reference,
      customerPhone: input.customerPhone,
      customerName: input.customerName,
      description: input.description,
    },
    config,
  );
}

export type { InitiatePaymentInput, PaymentIntentResult };
export { isPaymentChannel } from "@/lib/payment-providers/types";

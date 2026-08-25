import type { MobileMoneyProvider } from "@/lib/types";
import { MOBILE_MONEY_PROVIDERS } from "@/lib/types";
import { paymentChannelLabel } from "@/lib/finance-shared";

export type MobileMoneyMethodConfig = {
  enabled: boolean;
  merchantName: string;
  merchantPhone: string;
  instructions: string;
};

export type PaymentMethodsSettings = {
  methods: Record<MobileMoneyProvider, MobileMoneyMethodConfig>;
};

const DEFAULT_METHOD = (
  provider: MobileMoneyProvider,
): MobileMoneyMethodConfig => {
  const label = paymentChannelLabel(provider);
  const phones: Record<MobileMoneyProvider, string> = {
    wave: "+225 07 00 00 00 01",
    orange_money: "+225 07 00 00 00 02",
    mtn_money: "+225 05 00 00 00 03",
  };
  return {
    enabled: provider === "wave" || provider === "orange_money",
    merchantName: "FEBiS",
    merchantPhone: phones[provider],
    instructions: `Envoyez le montant via ${label} au numéro marchand FEBiS, puis conservez la référence de transaction.`,
  };
};

export const PAYMENT_METHODS_DEFAULTS: PaymentMethodsSettings = {
  methods: {
    wave: DEFAULT_METHOD("wave"),
    orange_money: DEFAULT_METHOD("orange_money"),
    mtn_money: DEFAULT_METHOD("mtn_money"),
  },
};

export function normalizePaymentMethodsSettings(
  input: Partial<PaymentMethodsSettings> | null | undefined,
): PaymentMethodsSettings {
  const base = structuredClone(PAYMENT_METHODS_DEFAULTS);
  if (!input?.methods) return base;

  for (const provider of MOBILE_MONEY_PROVIDERS) {
    const row = input.methods[provider];
    if (!row) continue;
    base.methods[provider] = {
      enabled: Boolean(row.enabled),
      merchantName:
        typeof row.merchantName === "string" && row.merchantName.trim()
          ? row.merchantName.trim()
          : base.methods[provider].merchantName,
      merchantPhone:
        typeof row.merchantPhone === "string" && row.merchantPhone.trim()
          ? row.merchantPhone.trim()
          : base.methods[provider].merchantPhone,
      instructions:
        typeof row.instructions === "string" && row.instructions.trim()
          ? row.instructions.trim()
          : base.methods[provider].instructions,
    };
  }

  return base;
}

export function listEnabledMobileMoneyProviders(
  settings: PaymentMethodsSettings = PAYMENT_METHODS_DEFAULTS,
): MobileMoneyProvider[] {
  return MOBILE_MONEY_PROVIDERS.filter(
    (provider) => settings.methods[provider]?.enabled,
  );
}

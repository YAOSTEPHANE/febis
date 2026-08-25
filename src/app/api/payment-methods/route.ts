import { NextResponse } from "next/server";
import { getPaymentMethodsSettings } from "@/lib/payment-settings";
import { listEnabledMobileMoneyProviders } from "@/lib/payment-settings-shared";
import { paymentChannelLabel } from "@/lib/finance-shared";

/** Public: méthodes Mobile Money activées + consignes marchand. */
export async function GET() {
  const settings = await getPaymentMethodsSettings();
  const enabled = listEnabledMobileMoneyProviders(settings).map((id) => {
    const method = settings.methods[id];
    return {
      id,
      label: paymentChannelLabel(id),
      merchantName: method.merchantName,
      merchantPhone: method.merchantPhone,
      instructions: method.instructions,
    };
  });

  return NextResponse.json({
    methods: enabled,
    otherChannels: [
      { id: "virement", label: paymentChannelLabel("virement") },
      { id: "especes", label: paymentChannelLabel("especes") },
    ],
  });
}

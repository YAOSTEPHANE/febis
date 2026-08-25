import "server-only";
import type { Db } from "mongodb";
import { getDb } from "@/lib/mongodb";
import {
  normalizePaymentMethodsSettings,
  PAYMENT_METHODS_DEFAULTS,
  type PaymentMethodsSettings,
} from "@/lib/payment-settings-shared";

async function tryDb(): Promise<Db | null> {
  try {
    return await getDb();
  } catch {
    return null;
  }
}

type SettingsDoc = {
  key: "payment_methods";
  data: PaymentMethodsSettings;
  updatedAt: Date;
};

export async function getPaymentMethodsSettings(): Promise<PaymentMethodsSettings> {
  const db = await tryDb();
  if (!db) return PAYMENT_METHODS_DEFAULTS;

  try {
    const doc = await db
      .collection<SettingsDoc>("app_settings")
      .findOne({ key: "payment_methods" });
    return normalizePaymentMethodsSettings(doc?.data);
  } catch {
    return PAYMENT_METHODS_DEFAULTS;
  }
}

export async function savePaymentMethodsSettings(
  data: PaymentMethodsSettings,
): Promise<PaymentMethodsSettings> {
  const normalized = normalizePaymentMethodsSettings(data);
  const db = await getDb();
  const now = new Date();
  await db.collection<SettingsDoc>("app_settings").updateOne(
    { key: "payment_methods" },
    {
      $set: { key: "payment_methods", data: normalized, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
  return normalized;
}

"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  MOBILE_MONEY_PROVIDERS,
  type MobileMoneyProvider,
} from "@/lib/types";
import { paymentChannelLabel } from "@/lib/finance-shared";
import type {
  MobileMoneyMethodConfig,
  PaymentMethodsSettings,
} from "@/lib/payment-settings-shared";

const emptySettings = (): PaymentMethodsSettings => ({
  methods: {
    wave: {
      enabled: true,
      merchantName: "FEBiS",
      merchantPhone: "",
      instructions: "",
    },
    orange_money: {
      enabled: true,
      merchantName: "FEBiS",
      merchantPhone: "",
      instructions: "",
    },
    mtn_money: {
      enabled: false,
      merchantName: "FEBiS",
      merchantPhone: "",
      instructions: "",
    },
  },
});

export function PaymentMethodsSettingsPanel() {
  const [settings, setSettings] = useState<PaymentMethodsSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/payment-methods");
      const json = (await res.json()) as {
        settings?: PaymentMethodsSettings;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      if (json.settings) setSettings(json.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function patchMethod(
    provider: MobileMoneyProvider,
    patch: Partial<MobileMoneyMethodConfig>,
  ) {
    setSettings((prev) => ({
      ...prev,
      methods: {
        ...prev.methods,
        [provider]: { ...prev.methods[provider], ...patch },
      },
    }));
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/payment-methods", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const json = (await res.json()) as {
        settings?: PaymentMethodsSettings;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      if (json.settings) setSettings(json.settings);
      setMessage("Moyens de paiement enregistrés.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-febis-ink/50">Chargement des moyens de paiement…</p>
    );
  }

  return (
    <form onSubmit={(e) => void onSave(e)} className="admin-panel admin-panel-premium space-y-4 p-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
          Mobile Money CI
        </p>
        <h3 className="mt-1 font-display text-xl font-bold text-febis-ink">
          Wave, Orange Money & MTN
        </h3>
        <p className="mt-1 text-sm text-febis-ink/55">
          Activez les canaux et renseignez les numéros marchands affichés aux
          clients. L’encaissement reste manuel jusqu’au branchement API.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-febis-red/20 bg-febis-red/5 px-4 py-3 text-sm font-semibold text-febis-red">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm font-semibold text-emerald-800">
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {MOBILE_MONEY_PROVIDERS.map((provider) => {
          const method = settings.methods[provider];
          return (
            <div
              key={provider}
              className="rounded-xl border border-febis-ink/10 bg-white/70 p-4"
            >
              <label className="flex items-center justify-between gap-2">
                <span className="font-display text-lg font-bold text-febis-ink">
                  {paymentChannelLabel(provider)}
                </span>
                <input
                  type="checkbox"
                  checked={method.enabled}
                  onChange={(e) =>
                    patchMethod(provider, { enabled: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-febis-ink/20"
                />
              </label>
              <label className="mt-3 block text-xs font-semibold text-febis-ink/70">
                Nom marchand
                <input
                  value={method.merchantName}
                  onChange={(e) =>
                    patchMethod(provider, { merchantName: e.target.value })
                  }
                  className="field-premium mt-1.5"
                />
              </label>
              <label className="mt-3 block text-xs font-semibold text-febis-ink/70">
                Numéro marchand
                <input
                  value={method.merchantPhone}
                  onChange={(e) =>
                    patchMethod(provider, { merchantPhone: e.target.value })
                  }
                  placeholder="+225 …"
                  className="field-premium mt-1.5"
                />
              </label>
              <label className="mt-3 block text-xs font-semibold text-febis-ink/70">
                Instructions client
                <textarea
                  rows={3}
                  value={method.instructions}
                  onChange={(e) =>
                    patchMethod(provider, { instructions: e.target.value })
                  }
                  className="field-premium mt-1.5 resize-y"
                />
              </label>
            </div>
          );
        })}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="cta-premium disabled:opacity-60"
      >
        {saving ? "Enregistrement…" : "Enregistrer les moyens de paiement"}
      </button>
    </form>
  );
}

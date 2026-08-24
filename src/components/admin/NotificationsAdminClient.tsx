"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENTS,
  notificationChannelLabel,
  notificationEventLabel,
  type SerializedNotification,
} from "@/lib/direction-shared";

export function NotificationsAdminClient() {
  const [items, setItems] = useState<SerializedNotification[]>([]);
  const [providers, setProviders] = useState<{
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
    mode: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/notifications");
      const json = (await res.json()) as {
        notifications?: SerializedNotification[];
        providers?: typeof providers;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setItems(json.notifications ?? []);
      setProviders(json.providers ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: data.get("channel"),
          event: data.get("event"),
          to: data.get("to"),
          subject: data.get("subject"),
          body: data.get("body"),
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function scanStock() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan_stock" }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Notifications"
        description="Email, WhatsApp, SMS — file d’envoi (mode simulation par défaut jusqu’au branchement fournisseurs)."
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-4 py-3 text-sm font-semibold text-febis-red">
          {error}
        </p>
      ) : null}

      {providers ? (
        <div className="mb-5 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide">
          <span className="rounded-full border border-febis-ink/15 px-3 py-1">
            Mode {providers.mode}
          </span>
          <span className="rounded-full border border-febis-ink/15 px-3 py-1">
            Email {providers.email ? "live" : "sim"}
          </span>
          <span className="rounded-full border border-febis-ink/15 px-3 py-1">
            WhatsApp {providers.whatsapp ? "live" : "sim"}
          </span>
          <span className="rounded-full border border-febis-ink/15 px-3 py-1">
            SMS {providers.sms ? "live" : "sim"}
          </span>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="admin-panel overflow-hidden">
          <div className="border-b border-febis-ink/8 px-5 py-3 text-sm font-semibold">
            Journal ({items.length})
          </div>
          <div className="divide-y divide-febis-ink/8">
            {items.map((n) => (
              <div key={n.id} className="px-5 py-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-semibold text-febis-ink">{n.subject}</p>
                  <span className="text-xs font-bold uppercase text-febis-ink/45">
                    {n.status}
                  </span>
                </div>
                <p className="text-xs text-febis-ink/50">
                  {notificationChannelLabel(n.channel)} ·{" "}
                  {notificationEventLabel(n.event)} · {n.to}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-febis-ink/65">
                  {n.body}
                </p>
              </div>
            ))}
            {items.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-febis-ink/45">
                Aucune notification.
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <form
            onSubmit={onSend}
            className="admin-panel admin-panel-premium space-y-3 p-5"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep">
              Envoyer / simuler
            </p>
            <select name="channel" className="field-premium" defaultValue="email">
              {NOTIFICATION_CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {notificationChannelLabel(c)}
                </option>
              ))}
            </select>
            <select name="event" className="field-premium" defaultValue="paiement">
              {NOTIFICATION_EVENTS.map((e) => (
                <option key={e} value={e}>
                  {notificationEventLabel(e)}
                </option>
              ))}
            </select>
            <input name="to" required placeholder="Destinataire" className="field-premium" />
            <input name="subject" required placeholder="Sujet" className="field-premium" />
            <textarea name="body" required rows={4} placeholder="Message" className="field-premium" />
            <button
              type="submit"
              disabled={saving}
              className="cta-premium w-full justify-center disabled:opacity-60"
            >
              {saving ? "Envoi…" : "Envoyer"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => void scanStock()}
            disabled={saving}
            className="w-full rounded-full border border-febis-ink/15 px-4 py-3 text-sm font-bold"
          >
            Scanner stock faible & notifier
          </button>
        </div>
      </div>
    </>
  );
}

"use client";

import { FormEvent, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function AdminSaveButton({
  saving,
  label = "Enregistrer",
}: {
  saving: boolean;
  label?: string;
}) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="cta-premium disabled:opacity-60"
    >
      {saving ? "Enregistrement…" : label}
    </button>
  );
}

export function useAdminSave<T>(
  url: string,
  initial: T,
  method: "PUT" | "POST" = "PUT",
) {
  const [data, setData] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save(event?: FormEvent) {
    event?.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) throw new Error(payload.error ?? "Échec");
      setMessage("Enregistré. Visible sur l’accueil après rechargement.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return { data, setData, saving, message, error, save };
}

export function AdminNotice({
  message,
  error,
}: {
  message: string;
  error: string;
}) {
  if (!message && !error) return null;
  return (
    <div
      className={cn(
        "rounded-xl px-3 py-2 text-sm font-semibold",
        error
          ? "border border-febis-red/20 bg-febis-red/8 text-febis-red"
          : "border border-emerald-600/20 bg-emerald-50 text-emerald-800",
      )}
      role="status"
    >
      {error || message}
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-febis-ink">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-febis-ink/55">{description}</p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

export function AdminPanel({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "form" | "section";
}) {
  return <Tag className={cn("admin-panel", className)}>{children}</Tag>;
}

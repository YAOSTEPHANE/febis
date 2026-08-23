"use client";

import { FormEvent, useState } from "react";

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
    <p
      className={
        error
          ? "text-sm font-semibold text-febis-red"
          : "text-sm font-semibold text-emerald-700"
      }
      role="status"
    >
      {error || message}
    </p>
  );
}

export function AdminPageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-3xl font-extrabold text-febis-ink">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-febis-ink/60">{description}</p>
    </div>
  );
}

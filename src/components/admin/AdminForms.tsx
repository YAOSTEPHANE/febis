"use client";

import { FormEvent, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function AdminSaveButton({
  saving,
  label = "Enregistrer",
  className,
}: {
  saving: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={saving}
      className={cn("cta-premium disabled:opacity-60", className)}
    >
      {saving ? "Enregistrement…" : label}
    </button>
  );
}

export function AdminGhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cn("admin-btn-ghost", className)} {...props}>
      {children}
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
        "rounded-xl px-3.5 py-2.5 text-sm font-semibold",
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
  eyebrow = "Module",
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-febis-gold-deep">
          {eyebrow}
        </p>
        <div className="mb-2.5 h-0.5 w-14 rounded-full bg-[linear-gradient(90deg,#9a6b1f,#d4a84b,#f0d78c)]" />
        <h1 className="font-display text-[clamp(1.65rem,3vw,2.15rem)] font-extrabold tracking-tight text-febis-ink">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-febis-ink/55 sm:text-[0.95rem]">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function AdminPanel({
  children,
  className,
  premium,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  premium?: boolean;
  as?: "div" | "form" | "section";
}) {
  return (
    <Tag
      className={cn(
        "admin-panel",
        premium && "admin-panel-premium",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="admin-empty">
      <span className="admin-empty-mark" aria-hidden>
        ··
      </span>
      <p className="font-display text-lg font-bold text-febis-ink">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-febis-ink/50">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function AdminToolbar({
  title,
  actions,
}: {
  title: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="admin-panel-toolbar">
      <div className="text-sm font-semibold text-febis-ink/65">{title}</div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

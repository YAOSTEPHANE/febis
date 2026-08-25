"use client";

import { useEffect } from "react";
import { cn } from "@/lib/cn";

export function AdminFormOverlay({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Fermer l’overlay"
        className="absolute inset-0 bg-febis-ink/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-form-overlay-title"
        className={cn(
          "relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-febis-ink/10 bg-[#fffdf9] shadow-[0_24px_64px_rgba(26,18,16,0.28)] sm:rounded-2xl",
          wide ? "max-w-4xl" : "max-w-3xl",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-febis-ink/8 px-5 py-4">
          <div>
            <p
              id="admin-form-overlay-title"
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-febis-gold-deep"
            >
              {title}
            </p>
            {subtitle ? (
              <p className="mt-0.5 text-sm text-febis-ink/50">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-febis-ink/12 text-lg font-bold text-febis-ink/50 transition hover:border-febis-ink/25 hover:text-febis-ink"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex shrink-0 flex-wrap gap-3 border-t border-febis-ink/8 bg-white/80 px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

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
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-5"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Fermer l’overlay"
        className="absolute inset-0 bg-febis-ink/50 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-form-overlay-title"
        className={cn(
          "relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[1.35rem] border border-febis-ink/10 bg-[#fffdf9] shadow-[0_28px_80px_rgba(26,18,16,0.32)] sm:rounded-[1.35rem]",
          wide ? "max-w-4xl" : "max-w-3xl",
        )}
      >
        <div className="relative flex shrink-0 items-center justify-between gap-3 border-b border-febis-ink/8 px-5 py-4 sm:px-6">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-[linear-gradient(90deg,#9a6b1f,#d4a84b,#f0d78c,#d4a84b,#9a6b1f)]"
            aria-hidden
          />
          <div className="min-w-0">
            <p
              id="admin-form-overlay-title"
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-febis-gold-deep"
            >
              {title}
            </p>
            {subtitle ? (
              <p className="mt-1 truncate text-sm font-medium text-febis-ink/50">
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-febis-ink/10 bg-white text-febis-ink/50 transition hover:border-febis-ink/20 hover:text-febis-ink"
            aria-label="Fermer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>
        {footer ? (
          <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-febis-ink/8 bg-white/85 px-5 py-4 backdrop-blur-md sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

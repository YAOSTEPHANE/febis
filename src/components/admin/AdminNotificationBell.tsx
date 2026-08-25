"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  notificationChannelLabel,
  notificationEventLabel,
  type SerializedNotification,
} from "@/lib/direction-shared";
import { cn } from "@/lib/cn";

const NOTIF_HREF = "/admin/dashboard/notifications";
const SEEN_KEY = "febis-admin-notif-seen-at";

function formatRelative(iso: string) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "à l’instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 9a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SerializedNotification[]>([]);
  const [unseen, setUnseen] = useState(0);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) return;
      const json = (await res.json()) as {
        notifications?: SerializedNotification[];
      };
      const list = json.notifications ?? [];
      setItems(list.slice(0, 12));

      let seenAt = 0;
      try {
        seenAt = Number(localStorage.getItem(SEEN_KEY) ?? "0");
      } catch {
        seenAt = 0;
      }
      const count = list.filter(
        (n) => new Date(n.createdAt).getTime() > seenAt,
      ).length;
      setUnseen(count);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function markSeen() {
    const now = String(Date.now());
    try {
      localStorage.setItem(SEEN_KEY, now);
    } catch {
      /* ignore */
    }
    setUnseen(0);
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      void load();
      markSeen();
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={
          unseen > 0
            ? `Notifications — ${unseen} non lue(s)`
            : "Notifications"
        }
        title="Notifications"
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full border transition",
          open
            ? "border-febis-red/30 bg-febis-red/5 text-febis-red"
            : "border-febis-ink/10 bg-white/90 text-febis-ink/70 hover:border-febis-ink/20 hover:text-febis-ink",
        )}
      >
        <BellIcon className="h-4.5 w-4.5" />
        {unseen > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-febis-red px-1 text-[9px] font-extrabold text-white">
            {unseen > 9 ? "9+" : unseen}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-febis-ink/10 bg-white shadow-[0_18px_40px_rgba(26,18,16,0.12)]"
        >
          <div className="flex items-center justify-between border-b border-febis-ink/8 px-3.5 py-3">
            <p className="text-sm font-semibold text-febis-ink">
              Notifications
            </p>
            <Link
              href={NOTIF_HREF}
              onClick={() => setOpen(false)}
              className="text-xs font-bold text-febis-red hover:underline"
            >
              Tout voir
            </Link>
          </div>

          <div className="max-h-[min(70vh,22rem)] overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-3.5 py-8 text-center text-sm text-febis-ink/45">
                Chargement…
              </p>
            ) : null}
            {!loading && items.length === 0 ? (
              <p className="px-3.5 py-8 text-center text-sm text-febis-ink/45">
                Aucune notification pour le moment.
              </p>
            ) : null}
            {items.map((n) => (
              <Link
                key={n.id}
                href={NOTIF_HREF}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block border-b border-febis-ink/6 px-3.5 py-3 transition hover:bg-febis-smoke/60 last:border-b-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-1 text-sm font-semibold text-febis-ink">
                    {n.subject}
                  </p>
                  <span className="shrink-0 text-[10px] text-febis-ink/40">
                    {formatRelative(n.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] font-medium text-febis-ink/45">
                  {notificationEventLabel(n.event)} ·{" "}
                  {notificationChannelLabel(n.channel)}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-febis-ink/60">
                  {n.body}
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

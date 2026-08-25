"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ADMIN_NAV, ADMIN_NAV_GROUPS } from "@/lib/homepage-content";
import { AdminHeaderSearch } from "@/components/admin/AdminHeaderSearch";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { AdminNavIcon } from "@/components/admin/AdminNavIcon";
import { cn } from "@/lib/cn";
import type { Permission } from "@/lib/rbac-shared";

const PARAMETRES_HREF = "/admin/dashboard/parametres";

function isPathMatch(pathname: string, href: string) {
  return href === "/admin/dashboard"
    ? pathname === href
    : pathname.startsWith(href);
}

function isParametresArea(pathname: string) {
  if (pathname === PARAMETRES_HREF || pathname.startsWith(`${PARAMETRES_HREF}/`)) {
    return true;
  }
  return ADMIN_NAV.some(
    (item) =>
      (item.group === "settings" || item.group === "outils") &&
      item.menu === false &&
      pathname.startsWith(item.href),
  );
}

function isMenuActive(pathname: string, href: string) {
  return isPathMatch(pathname, href);
}

function AdminProfileMenu({
  name,
  role,
  parametresActive,
}: {
  name: string;
  role: string;
  parametresActive: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

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

  useEffect(() => {
    setOpen(false);
  }, [parametresActive]);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin");
      router.refresh();
    } finally {
      setLoggingOut(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Menu profil — ${name}`}
        title={name}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border transition",
          parametresActive || open
            ? "border-febis-red/30 bg-febis-red/5"
            : "border-febis-ink/10 bg-white/90 hover:border-febis-ink/20",
        )}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-febis-red to-febis-red-deep text-[11px] font-extrabold text-white">
          {initials || "FB"}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-febis-ink/10 bg-white shadow-[0_18px_40px_rgba(26,18,16,0.12)]"
        >
          <div className="border-b border-febis-ink/8 px-3.5 py-3">
            <p className="truncate text-sm font-semibold text-febis-ink">{name}</p>
            <p className="text-[11px] text-febis-ink/45">{role}</p>
          </div>
          <Link
            href={PARAMETRES_HREF}
            role="menuitem"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3.5 py-3 text-sm font-semibold transition hover:bg-febis-smoke/80",
              parametresActive
                ? "bg-febis-red/5 text-febis-red"
                : "text-febis-ink",
            )}
          >
            Paramètres
          </Link>
          <button
            type="button"
            role="menuitem"
            disabled={loggingOut}
            onClick={() => void logout()}
            className="flex w-full items-center gap-3 border-t border-febis-ink/8 px-3.5 py-3 text-left text-sm font-semibold text-febis-ink transition hover:bg-febis-red/5 hover:text-febis-red disabled:opacity-60"
          >
            {loggingOut ? "Déconnexion…" : "Déconnexion"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AdminShell({
  children,
  name,
  role,
  permissions,
}: {
  children: React.ReactNode;
  name: string;
  role: string;
  permissions: Permission[];
}) {
  const pathname = usePathname();
  const allowed = new Set(permissions);
  const allNav = ADMIN_NAV.filter((item) => allowed.has(item.permission));
  const menuNav = allNav.filter((item) => item.menu !== false);
  const parametresActive = isParametresArea(pathname);

  const current = parametresActive
    ? allNav.find((item) => item.href === PARAMETRES_HREF) ??
      allNav.find((item) => isPathMatch(pathname, item.href))
    : allNav.find((item) => isPathMatch(pathname, item.href));

  return (
    <div className="admin-shell site-atmosphere min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1560px]">
        <aside className="admin-aside relative hidden w-[288px] shrink-0 flex-col md:flex">
          <div className="admin-aside-glow" aria-hidden />
          <div className="relative z-10 border-b border-white/8 px-5 py-5">
            <Link href="/admin/dashboard" className="inline-flex">
              <span className="rounded-lg bg-white px-2.5 py-1.5 shadow-lg shadow-black/20">
                <Image
                  src="/logo-febis.jpg"
                  alt="FEBiS"
                  width={80}
                  height={28}
                  className="h-6 w-auto object-contain"
                />
              </span>
            </Link>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#f0d78c]">
              Administration
            </p>
          </div>

          <nav className="relative z-10 flex-1 overflow-y-auto px-3 py-4">
            {ADMIN_NAV_GROUPS.map((group) => {
              const items = menuNav.filter((item) => item.group === group.id);
              if (items.length === 0) return null;
              return (
                <div key={group.id} className="mb-5">
                  <p className="mb-2 px-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {items.map((item) => {
                      const active = isMenuActive(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "admin-nav-link",
                            active && "is-active",
                          )}
                        >
                          <span className="admin-nav-mark">
                            <AdminNavIcon href={item.href} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-bold leading-tight">
                              {item.label}
                            </span>
                            <span
                              className={cn(
                                "mt-0.5 block text-[11px] leading-snug",
                                active ? "text-white/75" : "text-white/40",
                              )}
                            >
                              {item.description}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="admin-topbar sticky top-0 z-30">
            <div className="flex items-center gap-2 px-4 py-3.5 sm:gap-3 sm:px-5 md:px-8">
              <div className="min-w-0 shrink md:max-w-[28%] lg:max-w-[32%]">
                <div className="flex items-center gap-2 md:hidden">
                  <Image
                    src="/logo-febis.jpg"
                    alt="FEBiS"
                    width={72}
                    height={24}
                    className="h-5 w-auto rounded-sm object-contain"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-febis-red">
                    Admin
                  </span>
                </div>
                <p className="mt-1 truncate font-display text-lg font-bold text-febis-ink md:mt-0 md:text-[1.35rem]">
                  {current?.label ?? "Administration"}
                </p>
                <p className="hidden truncate text-sm text-febis-ink/50 lg:block">
                  {current?.description ?? "Espace professionnel FEBiS"}
                </p>
              </div>

              {allowed.has("search") ? <AdminHeaderSearch /> : null}

              <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
                {allowed.has("notifications") ? (
                  <AdminNotificationBell />
                ) : null}

                <AdminProfileMenu
                  name={name}
                  role={role}
                  parametresActive={parametresActive}
                />

                <Link
                  href="/"
                  target="_blank"
                  className="hidden rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/10 px-3.5 py-2 text-sm font-semibold text-[#8a7010] transition hover:bg-[#c9a227]/18 sm:inline-flex"
                >
                  Ouvrir le site ↗
                </Link>
              </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto px-4 pb-3 md:hidden">
              {menuNav.map((item) => {
                const active = isMenuActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                      active
                        ? "bg-febis-red text-white"
                        : "bg-white/90 text-febis-ink/65",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </header>

          <main className="px-4 py-6 sm:px-5 sm:py-7 md:px-9 md:py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

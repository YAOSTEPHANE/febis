"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ADMIN_NAV } from "@/lib/homepage-content";
import { AdminHeaderSearch } from "@/components/admin/AdminHeaderSearch";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
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
          "flex h-7 w-7 items-center justify-center rounded-full border transition",
          parametresActive || open
            ? "border-febis-red/35 bg-febis-red/5 shadow-[0_8px_20px_rgba(160,16,24,0.12)]"
            : "border-febis-ink/10 bg-white/90 hover:border-febis-ink/20",
        )}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-febis-red to-febis-red-deep text-[9px] font-extrabold text-white shadow-inner">
          {initials || "FB"}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-febis-ink/10 bg-white/95 shadow-[0_22px_50px_rgba(26,18,16,0.14)] backdrop-blur-xl"
        >
          <div className="relative overflow-hidden border-b border-febis-ink/8 px-4 py-3.5">
            <div
              className="pointer-events-none absolute inset-0 opacity-80"
              style={{
                background:
                  "radial-gradient(ellipse 80% 120% at 0% 0%, rgba(215,25,32,0.08), transparent 55%)",
              }}
              aria-hidden
            />
            <p className="relative truncate text-sm font-semibold text-febis-ink">
              {name}
            </p>
            <p className="relative text-[11px] font-medium text-febis-ink/45">
              {role}
            </p>
          </div>
          <Link
            href={PARAMETRES_HREF}
            role="menuitem"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-sm font-semibold transition hover:bg-febis-smoke/80",
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
            className="flex w-full items-center gap-3 border-t border-febis-ink/8 px-4 py-3 text-left text-sm font-semibold text-febis-ink transition hover:bg-febis-red/5 hover:text-febis-red disabled:opacity-60"
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
      <div className="mx-auto min-h-screen max-w-[1600px]">
        <header className="admin-topbar sticky top-0 z-30">
          <div className="flex h-12 items-center gap-2 px-3 sm:gap-2.5 sm:px-5 md:px-6 lg:px-8">
            <Link
              href="/admin/dashboard"
              className="flex shrink-0 items-center gap-2"
              aria-label="FEBiS Admin — Accueil"
            >
              <span className="relative flex h-8 w-8 overflow-hidden rounded-md bg-white shadow-[0_4px_12px_rgba(26,18,16,0.1)] ring-1 ring-febis-ink/8 sm:h-9 sm:w-9">
                <Image
                  src="/logo-febis.jpg"
                  alt=""
                  width={192}
                  height={181}
                  className="site-logo-img h-full w-full object-contain p-[2px]"
                  sizes="36px"
                  priority
                />
              </span>
              <span className="hidden min-w-0 flex-col leading-none sm:flex">
                <span className="font-display text-sm font-extrabold tracking-tight text-febis-ink">
                  FEBiS
                </span>
                <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-febis-red">
                  Admin
                </span>
              </span>
            </Link>

            <span
              className="hidden h-5 w-px shrink-0 bg-febis-ink/10 sm:block"
              aria-hidden
            />

            <p className="min-w-0 flex-1 truncate font-display text-xs font-bold tracking-tight text-febis-ink/70 sm:text-sm md:max-w-[30%]">
              {current?.label ?? "Administration"}
            </p>

            {allowed.has("search") ? <AdminHeaderSearch /> : null}

            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
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
                className="admin-btn-ghost hidden !px-3 !py-1.5 !text-[11px] !border-[#c9a227]/35 !bg-[#c9a227]/10 !text-[#8a7010] hover:!bg-[#c9a227]/18 md:inline-flex"
              >
                Site ↗
              </Link>
            </div>
          </div>

          <nav className="admin-mobile-nav" aria-label="Modules">
            {menuNav.map((item) => {
              const active = isMenuActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("admin-mobile-chip", active && "is-active")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="admin-rise px-4 py-6 sm:px-5 sm:py-7 md:px-8 md:py-9 lg:px-9 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

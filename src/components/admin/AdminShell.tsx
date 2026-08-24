"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV, ADMIN_NAV_GROUPS } from "@/lib/homepage-content";
import { LogoutButton } from "@/components/LogoutButton";
import { cn } from "@/lib/cn";

function isActive(pathname: string, href: string) {
  return href === "/admin/dashboard"
    ? pathname === href
    : pathname.startsWith(href);
}

export function AdminShell({
  children,
  name,
  role,
}: {
  children: React.ReactNode;
  name: string;
  role: string;
}) {
  const pathname = usePathname();
  const current = ADMIN_NAV.find((item) => isActive(pathname, item.href));
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

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
                  width={112}
                  height={40}
                  className="h-8 w-auto object-contain"
                />
              </span>
            </Link>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#f0d78c]">
              Command center
            </p>
            <p className="mt-1 font-display text-xl font-bold leading-tight text-white">
              FEBiS Ops
            </p>
          </div>

          <nav className="relative z-10 flex-1 overflow-y-auto px-3 py-4">
            {ADMIN_NAV_GROUPS.map((group) => {
              const items = ADMIN_NAV.filter((item) => item.group === group.id);
              if (items.length === 0) return null;
              return (
                <div key={group.id} className="mb-5">
                  <p className="mb-2 px-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {items.map((item) => {
                      const active = isActive(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "admin-nav-link",
                            active && "is-active",
                          )}
                        >
                          <span className="admin-nav-mark">{item.mark}</span>
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

          <div className="relative z-10 mt-auto space-y-3 border-t border-white/8 p-4">
            <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-3 py-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-febis-red to-febis-red-deep text-xs font-extrabold text-white">
                {initials || "FB"}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-white">
                  {name}
                </span>
                <span className="block truncate text-[11px] text-white/45">
                  {role}
                </span>
              </span>
            </div>
            <Link
              href="/"
              target="_blank"
              className="block rounded-xl border border-[#f0d78c]/25 bg-[#f0d78c]/8 py-2 text-center text-sm font-semibold text-[#f0d78c] transition hover:bg-[#f0d78c]/15"
            >
              Ouvrir le site ↗
            </Link>
            <LogoutButton className="w-full justify-center border-white/15 bg-white/5 text-white hover:border-febis-red/50 hover:bg-white/10 hover:text-white" />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="admin-topbar sticky top-0 z-30">
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 md:px-8">
              <div className="min-w-0">
                <div className="flex items-center gap-2 md:hidden">
                  <Image
                    src="/logo-febis.jpg"
                    alt="FEBiS"
                    width={96}
                    height={32}
                    className="h-7 w-auto rounded-sm object-contain"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-febis-red">
                    Ops
                  </span>
                </div>
                <p className="mt-1 truncate font-display text-lg font-bold text-febis-ink md:mt-0 md:text-[1.35rem]">
                  {current?.label ?? "Administration"}
                </p>
                <p className="hidden truncate text-sm text-febis-ink/50 md:block">
                  {current?.description ?? "Espace professionnel FEBiS"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                <Link
                  href="/"
                  target="_blank"
                  className="hidden rounded-xl border border-febis-ink/10 bg-white/90 px-3.5 py-2 text-sm font-semibold text-febis-ink/80 transition hover:border-febis-red/35 hover:text-febis-red sm:inline-flex"
                >
                  Voir le site
                </Link>
                <div className="md:hidden">
                  <LogoutButton />
                </div>
                <div className="hidden items-center gap-2.5 rounded-xl border border-febis-ink/8 bg-white/80 px-2.5 py-1.5 md:flex">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-febis-red/10 text-[11px] font-extrabold text-febis-red">
                    {initials || "FB"}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-febis-ink">
                      {name}
                    </span>
                    <span className="block text-[11px] text-febis-ink/45">
                      {role}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto px-4 pb-3 md:hidden">
              {ADMIN_NAV.map((item) => {
                const active = isActive(pathname, item.href);
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

          <main className="px-5 py-7 md:px-9 md:py-10">{children}</main>
        </div>
      </div>
    </div>
  );
}

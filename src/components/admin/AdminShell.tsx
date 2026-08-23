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

  return (
    <div className="admin-shell site-atmosphere min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1480px]">
        <aside className="admin-aside hidden w-[272px] shrink-0 flex-col border-r border-febis-ink/8 bg-white/70 backdrop-blur-xl md:flex">
          <div className="border-b border-febis-ink/8 px-5 py-5">
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              <Image
                src="/logo-febis.jpg"
                alt="FEBiS"
                width={112}
                height={40}
                className="h-9 w-auto rounded-sm object-contain"
              />
            </Link>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-febis-red">
              Espace admin
            </p>
            <p className="mt-0.5 font-display text-lg font-bold leading-tight text-febis-ink">
              Contenu &amp; opérations
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {ADMIN_NAV_GROUPS.map((group) => {
              const items = ADMIN_NAV.filter((item) => item.group === group.id);
              if (items.length === 0) return null;
              return (
                <div key={group.id} className="mb-5">
                  <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-febis-ink/40">
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
                            "group flex items-start gap-2.5 rounded-xl px-2.5 py-2 transition-colors",
                            active
                              ? "bg-febis-red text-white shadow-[0_10px_24px_rgba(160,16,24,0.22)]"
                              : "text-febis-ink/75 hover:bg-white hover:text-febis-ink",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold tracking-wide",
                              active
                                ? "bg-white/18 text-white"
                                : "bg-febis-mist/80 text-febis-red",
                            )}
                          >
                            {item.mark}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-bold leading-tight">
                              {item.label}
                            </span>
                            <span
                              className={cn(
                                "mt-0.5 block text-[11px] leading-snug",
                                active ? "text-white/75" : "text-febis-ink/45",
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

          <div className="mt-auto space-y-3 border-t border-febis-ink/8 p-4">
            <div className="rounded-xl bg-febis-smoke/80 px-3 py-2.5">
              <p className="truncate text-sm font-bold text-febis-ink">{name}</p>
              <p className="text-xs text-febis-ink/50">{role}</p>
            </div>
            <Link
              href="/"
              target="_blank"
              className="block text-center text-sm font-semibold text-febis-red hover:underline"
            >
              Ouvrir le site ↗
            </Link>
            <LogoutButton className="w-full justify-center" />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="nav-glass sticky top-0 z-30 border-b border-febis-ink/8">
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
                    Admin
                  </span>
                </div>
                <p className="mt-1 truncate font-display text-lg font-bold text-febis-ink md:mt-0 md:text-xl">
                  {current?.label ?? "Administration"}
                </p>
                <p className="hidden truncate text-sm text-febis-ink/50 md:block">
                  {current?.description ?? "Espace professionnel FEBiS"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href="/"
                  target="_blank"
                  className="hidden rounded-full border border-febis-ink/12 bg-white/80 px-3.5 py-2 text-sm font-semibold text-febis-ink/80 transition hover:border-febis-red/35 hover:text-febis-red sm:inline-flex"
                >
                  Voir le site
                </Link>
                <div className="md:hidden">
                  <LogoutButton />
                </div>
                <div className="hidden rounded-full border border-febis-ink/10 bg-white/70 px-3 py-1.5 md:block">
                  <p className="text-sm font-semibold text-febis-ink">{name}</p>
                  <p className="text-[11px] text-febis-ink/45">{role}</p>
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
                      "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition",
                      active
                        ? "bg-febis-red text-white"
                        : "bg-white/85 text-febis-ink/65",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </header>

          <main className="px-5 py-7 md:px-8 md:py-9">{children}</main>
        </div>
      </div>
    </div>
  );
}

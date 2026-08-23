"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "@/lib/homepage-content";
import { LogoutButton } from "@/components/LogoutButton";
import { cn } from "@/lib/cn";

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

  return (
    <div className="site-atmosphere min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="hidden w-64 shrink-0 border-r border-febis-ink/8 bg-white/55 p-5 backdrop-blur md:block">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-febis-red">
            FEBiS Admin
          </p>
          <p className="mt-1 font-display text-lg font-bold text-febis-ink">
            Contenu accueil
          </p>
          <nav className="mt-6 space-y-1">
            {ADMIN_NAV.map((item) => {
              const active =
                item.href === "/admin/dashboard"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-xl px-3 py-2.5 transition-colors",
                    active
                      ? "bg-febis-red text-white"
                      : "text-febis-ink/75 hover:bg-white hover:text-febis-ink",
                  )}
                >
                  <span className="block text-sm font-bold">{item.label}</span>
                  <span
                    className={cn(
                      "block text-[11px]",
                      active ? "text-white/75" : "text-febis-ink/45",
                    )}
                  >
                    {item.description}
                  </span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-8 space-y-2 border-t border-febis-ink/8 pt-4">
            <Link
              href="/"
              className="block text-sm font-semibold text-febis-red hover:underline"
            >
              ← Voir le site
            </Link>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="nav-glass sticky top-0 z-30 border-b border-febis-ink/8">
            <div className="flex items-center justify-between gap-3 px-5 py-4 md:px-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-febis-red md:hidden">
                  FEBiS Admin
                </p>
                <p className="font-semibold text-febis-ink">{name}</p>
                <p className="text-sm text-febis-ink/55">{role}</p>
              </div>
              <LogoutButton />
            </div>
            <div className="flex gap-2 overflow-x-auto px-5 pb-3 md:hidden">
              {ADMIN_NAV.map((item) => {
                const active =
                  item.href === "/admin/dashboard"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold",
                      active
                        ? "bg-febis-red text-white"
                        : "bg-white/80 text-febis-ink/70",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </header>
          <main className="px-5 py-8 md:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

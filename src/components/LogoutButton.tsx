"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className={cn(
        "inline-flex items-center rounded-full border border-febis-ink/15 bg-white/80 px-4 py-2 text-sm font-semibold text-febis-ink transition hover:border-febis-red/40 hover:text-febis-red",
        className,
      )}
    >
      Déconnexion
    </button>
  );
}

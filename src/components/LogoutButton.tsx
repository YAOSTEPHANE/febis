"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
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
      className="rounded-full border border-febis-ink/15 bg-white/70 px-4 py-2 text-sm font-semibold text-febis-ink hover:border-febis-red/40"
    >
      Déconnexion
    </button>
  );
}

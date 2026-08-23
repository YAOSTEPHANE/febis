"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const data = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password"),
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Connexion impossible");
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="site-atmosphere flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-md overflow-hidden rounded-[1.5rem] border border-febis-ink/8 bg-white/75 p-8 shadow-[0_30px_80px_rgba(160,16,24,0.1)] backdrop-blur-xl">
        <Image
          src="/logo-febis.jpg"
          alt="FEBiS"
          width={140}
          height={48}
          className="mb-6 h-10 w-auto rounded-sm object-contain"
        />
        <h1 className="font-display text-3xl font-extrabold text-febis-ink">
          Espace professionnel
        </h1>
        <p className="mt-2 text-sm text-febis-ink/60">
          Accès réservé — Admin, Direction, Compta, Opérationnels.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block text-sm font-semibold text-febis-ink/80">
            Email
            <input
              required
              type="email"
              name="email"
              autoComplete="username"
              className="field-premium mt-2"
              placeholder="admin@febis.ci"
            />
          </label>
          <label className="block text-sm font-semibold text-febis-ink/80">
            Mot de passe
            <input
              required
              type="password"
              name="password"
              autoComplete="current-password"
              className="field-premium mt-2"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className="text-sm font-semibold text-febis-red" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="cta-premium w-full disabled:opacity-70"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}

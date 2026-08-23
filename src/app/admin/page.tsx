"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="site-atmosphere relative flex min-h-screen">
      <div className="relative hidden w-[46%] overflow-hidden lg:block">
        <Image
          src="/images/expertise-desk.jpg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="46vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-febis-ink/85 via-febis-red-deep/70 to-febis-ink/80" />
        <div className="absolute inset-0 flex flex-col justify-between p-10 text-white">
          <div className="inline-flex w-fit rounded-xl bg-white/95 px-3 py-2 shadow-lg">
            <Image
              src="/logo-febis.jpg"
              alt="FEBiS"
              width={140}
              height={48}
              className="h-10 w-auto object-contain"
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-febis-gold-light">
              NOYA × FEBiS
            </p>
            <h1 className="mt-3 max-w-md font-display text-4xl font-extrabold leading-tight">
              Pilotez la plateforme digitale
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
              Accueil, résidences, événementiel, blog et demandes clients —
              un seul espace professionnel.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-14">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Image
              src="/logo-febis.jpg"
              alt="FEBiS"
              width={140}
              height={48}
              className="h-10 w-auto rounded-sm object-contain"
            />
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-febis-red">
            Accès sécurisé
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-febis-ink md:text-[2.15rem]">
            Espace professionnel
          </h2>
          <p className="mt-2 text-sm text-febis-ink/55">
            Réservé Admin, Direction, Compta et équipes opérationnelles.
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-8 space-y-4 rounded-[1.35rem] border border-febis-ink/8 bg-white/80 p-6 shadow-[0_24px_60px_rgba(160,16,24,0.08)] backdrop-blur-xl md:p-7"
          >
            <label className="block text-sm font-semibold text-febis-ink/80">
              Email professionnel
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
              <div className="relative mt-2">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  className="field-premium pr-24"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-bold text-febis-ink/55 hover:bg-febis-mist/70 hover:text-febis-ink"
                >
                  {showPassword ? "Masquer" : "Afficher"}
                </button>
              </div>
            </label>

            {error && (
              <div
                className="rounded-xl border border-febis-red/20 bg-febis-red/8 px-3 py-2.5 text-sm font-semibold text-febis-red"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cta-premium w-full disabled:opacity-70"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-febis-ink/45">
            <a href="/" className="font-semibold text-febis-red hover:underline">
              ← Retour au site public
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

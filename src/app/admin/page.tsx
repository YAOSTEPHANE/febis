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
      <div className="relative hidden w-[48%] overflow-hidden lg:block">
        <Image
          src="/images/expertise-desk.jpg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="48vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-febis-ink/90 via-febis-red-deep/65 to-febis-ink/85" />
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 20% 80%, rgba(212,168,75,0.22), transparent 60%)",
          }}
          aria-hidden
        />
        <div className="absolute inset-0 flex flex-col justify-between p-10 text-white xl:p-12">
          <div className="inline-flex w-fit items-center gap-3 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.25)]">
            <span className="relative flex h-11 w-11 overflow-hidden rounded-xl ring-1 ring-febis-ink/8">
              <Image
                src="/logo-febis.jpg"
                alt=""
                width={192}
                height={181}
                className="site-logo-img h-full w-full object-contain p-0.5"
                sizes="44px"
                priority
              />
            </span>
            <span className="pr-1">
              <span className="block font-display text-lg font-extrabold leading-none tracking-tight text-febis-ink">
                FEBiS
              </span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-febis-red">
                Admin
              </span>
            </span>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-febis-gold-light">
              Espace professionnel
            </p>
            <h1 className="mt-3 max-w-md font-display text-4xl font-extrabold leading-[1.05] tracking-tight xl:text-[2.75rem]">
              Pilotez la plateforme digitale FEBiS
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/72 xl:text-base">
              Résidences, événementiel, boutique, BTP, CRM et finance — un
              command center unifié pour vos équipes.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {["Sécurisé", "Multi-rôles", "Temps réel"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/75 backdrop-blur-md"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-14">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="relative flex h-11 w-11 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-febis-ink/8">
              <Image
                src="/logo-febis.jpg"
                alt=""
                width={192}
                height={181}
                className="site-logo-img h-full w-full object-contain p-0.5"
                sizes="44px"
                priority
              />
            </span>
            <span>
              <span className="block font-display text-lg font-extrabold leading-none tracking-tight text-febis-ink">
                FEBiS
              </span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-febis-red">
                Admin
              </span>
            </span>
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-febis-red">
            Accès sécurisé
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-febis-ink md:text-[2.2rem]">
            Connexion admin
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-febis-ink/55">
            Réservé Admin, Direction, Compta et équipes opérationnelles.
          </p>

          <form
            onSubmit={onSubmit}
            className="admin-panel admin-panel-premium relative mt-8 space-y-4 p-6 md:p-7"
          >
            <label className="admin-label">
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
            <label className="admin-label">
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-bold text-febis-ink/55 transition hover:bg-febis-mist/70 hover:text-febis-ink"
                >
                  {showPassword ? "Masquer" : "Afficher"}
                </button>
              </div>
            </label>

            {error ? (
              <div
                className="rounded-xl border border-febis-red/20 bg-febis-red/8 px-3.5 py-2.5 text-sm font-semibold text-febis-red"
                role="alert"
              >
                {error}
              </div>
            ) : null}

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

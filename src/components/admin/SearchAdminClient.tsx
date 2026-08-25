"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminForms";

type Hit = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  href: string;
  activity?: string;
};

const TYPE_LABELS: Record<string, string> = {
  client: "Client",
  contact: "Contact",
  reservation: "Réservation",
  invoice: "Facture",
  project: "Projet BTP",
  equipment: "Matériel",
  lodging: "Logement",
  payment: "Paiement",
  blog: "Article",
  employee: "Collaborateur",
};

export function SearchAdminClient() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [q, setQ] = useState(initialQ);
  const [hits, setHits] = useState<Hit[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search(query: string) {
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const res = await fetch(
        `/api/admin/search?q=${encodeURIComponent(query.trim())}`,
      );
      const json = (await res.json()) as { hits?: Hit[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setHits(json.hits ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setHits([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const fromUrl = searchParams.get("q") ?? "";
    setQ(fromUrl);
    if (fromUrl.trim().length >= 2) {
      void search(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when URL q changes
  }, [searchParams]);

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    await search(q);
  }

  return (
    <>
      <AdminPageHeader
        title="Recherche globale"
        description="Clients, contacts, réservations, factures, projets, logements, matériel, paiements, blog."
      />

      <form
        onSubmit={onSearch}
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <label className="block flex-1 text-sm font-semibold">
          Requête (2 caractères min.)
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="field-premium mt-1.5"
            placeholder="Nom, email, n° facture…"
            autoFocus
          />
        </label>
        <button type="submit" disabled={loading} className="cta-premium">
          {loading ? "Recherche…" : "Chercher"}
        </button>
      </form>

      {error ? (
        <p className="mb-4 text-sm font-semibold text-febis-red">{error}</p>
      ) : null}

      {searched && !loading && hits.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-febis-ink/15 px-6 py-10 text-center text-febis-ink/50">
          Aucun résultat.
        </p>
      ) : null}

      <div className="divide-y divide-febis-ink/8 overflow-hidden rounded-2xl border border-febis-ink/10 bg-white/70">
        {hits.map((hit) => (
          <Link
            key={`${hit.type}-${hit.id}`}
            href={hit.href}
            className="block px-5 py-4 transition hover:bg-white"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-febis-orange">
              {TYPE_LABELS[hit.type] ?? hit.type}
              {hit.activity ? ` · ${hit.activity}` : ""}
            </p>
            <p className="font-display text-lg font-bold text-febis-ink">
              {hit.title}
            </p>
            <p className="text-sm text-febis-ink/55">{hit.subtitle}</p>
          </Link>
        ))}
      </div>
    </>
  );
}

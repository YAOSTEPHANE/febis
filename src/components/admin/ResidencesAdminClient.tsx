"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import {
  LODGING_STATUSES,
  categoryLabel,
  formatXof,
  statusLabel,
} from "@/lib/residences-shared";
import { cn } from "@/lib/cn";

type Lodging = {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  pricePerNight: number;
  location: string;
  capacity: number;
};

export function ResidencesAdminClient() {
  const [lodgings, setLodgings] = useState<Lodging[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/residences");
      const json = (await res.json()) as {
        lodgings?: Lodging[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setLodgings(json.lodgings ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(slug: string, status: string) {
    setSaving(slug);
    setError("");
    try {
      const res = await fetch("/api/admin/residences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, status }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Résidences"
        description="Catalogue logements, statuts (disponible / réservé / maintenance) et accès aux réservations."
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <Link href="/admin/dashboard/reservations" className="cta-premium">
          Gérer les réservations →
        </Link>
        <Link
          href="/residences"
          className="rounded-full border border-febis-ink/15 px-4 py-2 text-sm font-bold"
          target="_blank"
        >
          Voir le site
        </Link>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-febis-red/20 bg-febis-red/5 px-4 py-3 text-sm font-semibold text-febis-red">
          {error}
        </p>
      ) : null}

      <div className="admin-panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-febis-mist/80 text-xs uppercase tracking-wider text-febis-ink/55">
            <tr>
              <th className="px-4 py-3">Logement</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Prix / nuit</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-febis-ink/8">
            {lodgings.map((item) => (
              <tr key={item.slug}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-febis-ink">{item.title}</p>
                  <p className="text-xs text-febis-ink/45">
                    {item.location} · {item.capacity} pers.
                  </p>
                </td>
                <td className="px-4 py-3">{categoryLabel(item.category)}</td>
                <td className="px-4 py-3 font-semibold text-febis-red">
                  {formatXof(item.pricePerNight)}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={item.status}
                    disabled={saving === item.slug}
                    onChange={(e) => void setStatus(item.slug, e.target.value)}
                    className={cn(
                      "field-premium max-w-[160px] py-1.5 text-xs",
                      item.status === "maintenance" && "border-febis-orange/40",
                    )}
                  >
                    {LODGING_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {lodgings.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-febis-ink/45">
                  Aucun logement — lancez <code>npm run seed</code>.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}

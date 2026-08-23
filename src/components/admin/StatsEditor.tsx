"use client";

import type { TrustStat } from "@/lib/homepage-content";
import {
  AdminNotice,
  AdminPageHeader,
  AdminSaveButton,
  useAdminSave,
} from "@/components/admin/AdminForms";

export function StatsEditor({ initial }: { initial: TrustStat[] }) {
  const { data, setData, saving, message, error, save } = useAdminSave(
    "/api/admin/homepage/trust",
    initial,
  );

  return (
    <>
      <AdminPageHeader
        title="Bandeau stats"
        description="Indicateurs affichés sous les catégories sur l’accueil."
      />
      <form onSubmit={save} className="space-y-4">
        {data.map((stat, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-2xl border border-febis-ink/8 bg-white/70 p-4 sm:grid-cols-2"
          >
            <label className="text-sm font-semibold text-febis-ink/80">
              Valeur
              <input
                className="field-premium mt-2"
                value={stat.value}
                onChange={(e) => {
                  const next = [...data];
                  next[index] = { ...stat, value: e.target.value };
                  setData(next);
                }}
              />
            </label>
            <label className="text-sm font-semibold text-febis-ink/80">
              Libellé
              <input
                className="field-premium mt-2"
                value={stat.label}
                onChange={(e) => {
                  const next = [...data];
                  next[index] = { ...stat, label: e.target.value };
                  setData(next);
                }}
              />
            </label>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-4">
          <AdminSaveButton saving={saving} />
          <AdminNotice message={message} error={error} />
        </div>
      </form>
    </>
  );
}

"use client";

import type { HeroContent } from "@/lib/homepage-content";
import {
  AdminNotice,
  AdminPageHeader,
  AdminSaveButton,
  useAdminSave,
} from "@/components/admin/AdminForms";

export function HeroEditor({ initial }: { initial: HeroContent }) {
  const { data, setData, saving, message, error, save } = useAdminSave(
    "/api/admin/homepage/hero",
    initial,
  );

  return (
    <>
      <AdminPageHeader
        title="Hero"
        description="Premier écran de l’accueil : marque, accroche et boutons d’action."
      />
      <form onSubmit={save} className="space-y-4 rounded-2xl border border-febis-ink/8 bg-white/70 p-6">
        {(
          [
            ["eyebrow", "Sur-titre"],
            ["brand", "Marque"],
            ["headline", "Accroche"],
            ["highlight", "Mot mis en avant"],
            ["description", "Description"],
            ["primaryCtaLabel", "CTA principal — libellé"],
            ["primaryCtaHref", "CTA principal — lien"],
            ["secondaryCtaLabel", "CTA secondaire — libellé"],
            ["secondaryCtaHref", "CTA secondaire — lien"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm font-semibold text-febis-ink/80">
            {label}
            {key === "description" || key === "headline" ? (
              <textarea
                className="field-premium mt-2 min-h-24"
                value={data[key]}
                onChange={(e) => setData({ ...data, [key]: e.target.value })}
              />
            ) : (
              <input
                className="field-premium mt-2"
                value={data[key]}
                onChange={(e) => setData({ ...data, [key]: e.target.value })}
              />
            )}
          </label>
        ))}
        <div className="flex flex-wrap items-center gap-4">
          <AdminSaveButton saving={saving} />
          <AdminNotice message={message} error={error} />
        </div>
      </form>
    </>
  );
}

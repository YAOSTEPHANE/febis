"use client";

import type { PoleContent } from "@/lib/homepage-content";
import {
  AdminNotice,
  AdminPageHeader,
  AdminSaveButton,
  useAdminSave,
} from "@/components/admin/AdminForms";

export function PolesEditor({ initial }: { initial: PoleContent[] }) {
  const { data, setData, saving, message, error, save } = useAdminSave(
    "/api/admin/homepage/poles",
    initial,
  );

  return (
    <>
      <AdminPageHeader
        title="Pôles d’activité"
        description="Les quatre tuiles Résidences, BTP, Événementiel et Boutique."
      />
      <form onSubmit={save} className="space-y-4">
        {data.map((pole, index) => (
          <div
            key={pole.id}
            className="space-y-3 admin-panel p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-febis-ink/80">
                Titre
                <input
                  className="field-premium mt-2"
                  value={pole.title}
                  onChange={(e) => {
                    const next = [...data];
                    next[index] = { ...pole, title: e.target.value };
                    setData(next);
                  }}
                />
              </label>
              <label className="text-sm font-semibold text-febis-ink/80">
                Tag
                <input
                  className="field-premium mt-2"
                  value={pole.tag}
                  onChange={(e) => {
                    const next = [...data];
                    next[index] = { ...pole, tag: e.target.value };
                    setData(next);
                  }}
                />
              </label>
            </div>
            <label className="block text-sm font-semibold text-febis-ink/80">
              Description
              <textarea
                className="field-premium mt-2"
                value={pole.description}
                onChange={(e) => {
                  const next = [...data];
                  next[index] = { ...pole, description: e.target.value };
                  setData(next);
                }}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-febis-ink/80">
                Image
                <input
                  className="field-premium mt-2"
                  value={pole.image}
                  onChange={(e) => {
                    const next = [...data];
                    next[index] = { ...pole, image: e.target.value };
                    setData(next);
                  }}
                />
              </label>
              <label className="text-sm font-semibold text-febis-ink/80">
                Lien
                <input
                  className="field-premium mt-2"
                  value={pole.href ?? ""}
                  onChange={(e) => {
                    const next = [...data];
                    next[index] = {
                      ...pole,
                      href: e.target.value || undefined,
                    };
                    setData(next);
                  }}
                />
              </label>
            </div>
            <label className="block text-sm font-semibold text-febis-ink/80">
              Points (un par ligne)
              <textarea
                className="field-premium mt-2 min-h-24"
                value={pole.points.join("\n")}
                onChange={(e) => {
                  const next = [...data];
                  next[index] = {
                    ...pole,
                    points: e.target.value
                      .split("\n")
                      .map((p) => p.trim())
                      .filter(Boolean),
                  };
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

"use client";

import type { PlatformContent } from "@/lib/homepage-content";
import {
  AdminNotice,
  AdminPageHeader,
  AdminSaveButton,
  useAdminSave,
} from "@/components/admin/AdminForms";

export function PlatformEditor({ initial }: { initial: PlatformContent }) {
  const { data, setData, saving, message, error, save } = useAdminSave(
    "/api/admin/homepage/platform",
    initial,
  );

  return (
    <>
      <AdminPageHeader
        title="Plateforme"
        description="Bloc transversal CRM / finance / facturation / pilotage."
      />
      <form onSubmit={save} className="space-y-4 rounded-2xl border border-febis-ink/8 bg-white/70 p-6">
        <label className="block text-sm font-semibold text-febis-ink/80">
          Sur-titre
          <input
            className="field-premium mt-2"
            value={data.eyebrow}
            onChange={(e) => setData({ ...data, eyebrow: e.target.value })}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-febis-ink/80">
            Titre
            <input
              className="field-premium mt-2"
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
            />
          </label>
          <label className="text-sm font-semibold text-febis-ink/80">
            Surbrillance
            <input
              className="field-premium mt-2"
              value={data.highlight}
              onChange={(e) => setData({ ...data, highlight: e.target.value })}
            />
          </label>
        </div>
        <label className="block text-sm font-semibold text-febis-ink/80">
          Description
          <textarea
            className="field-premium mt-2"
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
          />
        </label>
        <label className="block text-sm font-semibold text-febis-ink/80">
          Rôles (séparés par virgule)
          <input
            className="field-premium mt-2"
            value={data.roles.join(", ")}
            onChange={(e) =>
              setData({
                ...data,
                roles: e.target.value
                  .split(",")
                  .map((r) => r.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>

        {data.items.map((item, index) => (
          <div key={index} className="grid gap-3 border-t border-febis-ink/8 pt-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-febis-ink/80">
              Module
              <input
                className="field-premium mt-2"
                value={item.title}
                onChange={(e) => {
                  const items = [...data.items];
                  items[index] = { ...item, title: e.target.value };
                  setData({ ...data, items });
                }}
              />
            </label>
            <label className="text-sm font-semibold text-febis-ink/80">
              Texte
              <input
                className="field-premium mt-2"
                value={item.text}
                onChange={(e) => {
                  const items = [...data.items];
                  items[index] = { ...item, text: e.target.value };
                  setData({ ...data, items });
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

"use client";

import type { CategoryContent } from "@/lib/homepage-content";
import {
  AdminNotice,
  AdminPageHeader,
  AdminSaveButton,
  useAdminSave,
} from "@/components/admin/AdminForms";

export function CategoriesEditor({ initial }: { initial: CategoryContent[] }) {
  const { data, setData, saving, message, error, save } = useAdminSave(
    "/api/admin/homepage/categories",
    initial,
  );

  return (
    <>
      <AdminPageHeader
        title="Catégories"
        description="Les 4 cartes types de logements sous la barre de recherche."
      />
      <form onSubmit={save} className="space-y-4">
        {data.map((cat, index) => (
          <div
            key={cat.key}
            className="space-y-3 admin-panel p-4"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-febis-red">
              {cat.key}
            </p>
            <label className="block text-sm font-semibold text-febis-ink/80">
              Description
              <textarea
                className="field-premium mt-2"
                value={cat.description}
                onChange={(e) => {
                  const next = [...data];
                  next[index] = { ...cat, description: e.target.value };
                  setData(next);
                }}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-febis-ink/80">
                Image (chemin)
                <input
                  className="field-premium mt-2"
                  value={cat.image}
                  onChange={(e) => {
                    const next = [...data];
                    next[index] = { ...cat, image: e.target.value };
                    setData(next);
                  }}
                />
              </label>
              <label className="text-sm font-semibold text-febis-ink/80">
                Prix dès (XOF)
                <input
                  className="field-premium mt-2"
                  value={cat.from}
                  onChange={(e) => {
                    const next = [...data];
                    next[index] = { ...cat, from: e.target.value };
                    setData(next);
                  }}
                />
              </label>
            </div>
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

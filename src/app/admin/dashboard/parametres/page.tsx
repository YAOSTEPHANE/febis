import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { permissionsFor } from "@/lib/rbac-shared";
import {
  getAdminOutilsModules,
  getAdminSettingsModules,
} from "@/lib/homepage-content";
import { AdminPageHeader } from "@/components/admin/AdminForms";
import { AdminNavIcon } from "@/components/admin/AdminNavIcon";
import { SeedHomepagePanel } from "@/components/admin/ParametresClient";

function ModuleGrid({
  items,
}: {
  items: Array<{
    href: string;
    label: string;
    description: string;
    mark: string;
  }>;
}) {
  if (items.length === 0) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="admin-panel admin-module-card group flex gap-3.5 p-4"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-febis-red/15 bg-febis-red/8 text-lg text-febis-red transition group-hover:border-transparent group-hover:bg-febis-red group-hover:text-white">
            <AdminNavIcon href={item.href} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className="font-display text-lg font-bold text-febis-ink">
                {item.label}
              </span>
              <span className="text-febis-ink/25 transition group-hover:translate-x-0.5 group-hover:text-febis-red">
                →
              </span>
            </span>
            <span className="mt-0.5 block text-sm text-febis-ink/50">
              {item.description}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}

export default async function AdminParametresPage() {
  const session = await requireAdminSession();
  const permissions = permissionsFor(session.role);
  const contenu = getAdminSettingsModules(permissions);
  const outils = getAdminOutilsModules(permissions);

  return (
    <>
      <AdminPageHeader
        title="Paramètres"
        description="Contenu de la vitrine et fonctionnalités transverses — hors modules métier du menu."
      />

      {outils.length > 0 ? (
        <section className="mb-8">
          <div className="admin-section-label">
            <h2>Fonctionnalités</h2>
            <p>Outils</p>
          </div>
          <p className="mb-4 text-sm text-febis-ink/55">
            Recherche, notifications, utilisateurs et sauvegardes — ce ne sont
            pas des modules d’activité.
          </p>
          <ModuleGrid items={outils} />
        </section>
      ) : null}

      {contenu.length > 0 ? (
        <section>
          <div className="admin-section-label">
            <h2>Contenu du site</h2>
            <p>Vitrine</p>
          </div>
          <p className="mb-4 text-sm text-febis-ink/55">
            Blocs à renseigner pour l’accueil et les pages publiques.
          </p>
          <SeedHomepagePanel />
          <div className="mt-6">
            <ModuleGrid items={contenu} />
          </div>
        </section>
      ) : null}

      {outils.length === 0 && contenu.length === 0 ? (
        <p className="rounded-xl border border-dashed border-febis-ink/15 px-6 py-10 text-center text-sm text-febis-ink/45">
          Aucun paramètre accessible pour ce profil.
        </p>
      ) : null}
    </>
  );
}

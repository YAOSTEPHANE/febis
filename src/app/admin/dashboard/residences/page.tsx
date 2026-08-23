import Link from "next/link";
import { listPublicLodgings } from "@/lib/residences-data";
import { formatXof, categoryLabel } from "@/lib/residences";
import { AdminPageHeader } from "@/components/admin/AdminForms";

export default async function AdminResidencesPage() {
  const lodgings = await listPublicLodgings();

  return (
    <>
      <AdminPageHeader
        title="Résidences"
        description="Logements affichés sur l’accueil et /residences. Gestion via la collection lodgings (seed)."
      />
      <div className="mb-4">
        <Link href="/residences" className="text-sm font-bold text-febis-red">
          Voir sur le site →
        </Link>
      </div>
      <div className="admin-panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-febis-mist/80 text-xs uppercase tracking-wider text-febis-ink/55">
            <tr>
              <th className="px-4 py-3">Titre</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Prix / nuit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-febis-ink/8">
            {lodgings.map((item) => (
              <tr key={item.slug}>
                <td className="px-4 py-3 font-semibold text-febis-ink">
                  <Link
                    href={`/residences/${item.slug}`}
                    className="hover:text-febis-red"
                  >
                    {item.title}
                  </Link>
                </td>
                <td className="px-4 py-3">{categoryLabel(item.category)}</td>
                <td className="px-4 py-3">{item.status}</td>
                <td className="px-4 py-3">{formatXof(item.pricePerNight)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-febis-ink/55">
        Pour réinitialiser les fiches :{" "}
        <code className="rounded bg-febis-mist px-1.5 py-0.5">npm run seed</code>
      </p>
    </>
  );
}

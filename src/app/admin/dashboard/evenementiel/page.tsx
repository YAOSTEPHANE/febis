import Link from "next/link";
import { listPublicEquipment } from "@/lib/evenementiel-data";
import { formatXof, equipmentCategoryLabel } from "@/lib/evenementiel";
import { AdminPageHeader } from "@/components/admin/AdminForms";

export default async function AdminEvenementielPage() {
  const equipment = await listPublicEquipment();

  return (
    <>
      <AdminPageHeader
        title="Événementiel"
        description="Catalogue matériel de l’accueil et de /evenementiel."
      />
      <div className="mb-4">
        <Link href="/evenementiel" className="text-sm font-bold text-febis-red">
          Voir le catalogue →
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-febis-ink/8 bg-white/70">
        <table className="w-full text-left text-sm">
          <thead className="bg-febis-mist/80 text-xs uppercase tracking-wider text-febis-ink/55">
            <tr>
              <th className="px-4 py-3">Article</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Prix / jour</th>
              <th className="px-4 py-3">Caution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-febis-ink/8">
            {equipment.map((item) => (
              <tr key={item.slug}>
                <td className="px-4 py-3 font-semibold text-febis-ink">
                  {item.name}
                </td>
                <td className="px-4 py-3">
                  {equipmentCategoryLabel(item.category)}
                </td>
                <td className="px-4 py-3">
                  {item.quantityAvailable}/{item.quantityTotal}
                </td>
                <td className="px-4 py-3">{formatXof(item.pricePerDay)}</td>
                <td className="px-4 py-3">{formatXof(item.depositAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

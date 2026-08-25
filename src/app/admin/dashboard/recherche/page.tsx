import { Suspense } from "react";
import { SearchAdminClient } from "@/components/admin/SearchAdminClient";

export default function AdminRecherchePage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm font-semibold text-febis-ink/50">
          Chargement de la recherche…
        </p>
      }
    >
      <SearchAdminClient />
    </Suspense>
  );
}

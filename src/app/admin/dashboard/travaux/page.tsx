import { listTravauxAdmin } from "@/lib/homepage-data";
import { TravauxAdminEditor } from "@/components/admin/TravauxAdminEditor";

export default async function AdminTravauxPage() {
  const items = await listTravauxAdmin();
  return <TravauxAdminEditor initial={items} />;
}

import { getHomepageSection } from "@/lib/homepage-data";
import { PolesEditor } from "@/components/admin/PolesEditor";

export default async function AdminPolesPage() {
  const poles = await getHomepageSection("poles");
  return <PolesEditor initial={poles} />;
}

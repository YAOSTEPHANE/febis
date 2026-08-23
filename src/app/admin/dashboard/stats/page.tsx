import { getHomepageSection } from "@/lib/homepage-data";
import { StatsEditor } from "@/components/admin/StatsEditor";

export default async function AdminStatsPage() {
  const trust = await getHomepageSection("trust");
  return <StatsEditor initial={trust} />;
}

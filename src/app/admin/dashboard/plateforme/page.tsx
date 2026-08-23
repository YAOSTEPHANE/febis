import { getHomepageSection } from "@/lib/homepage-data";
import { PlatformEditor } from "@/components/admin/PlatformEditor";

export default async function AdminPlatformPage() {
  const platform = await getHomepageSection("platform");
  return <PlatformEditor initial={platform} />;
}

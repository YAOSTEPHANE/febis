import { getHomepageSection } from "@/lib/homepage-data";
import { HeroEditor } from "@/components/admin/HeroEditor";

export default async function AdminHeroPage() {
  const hero = await getHomepageSection("hero");
  return <HeroEditor initial={hero} />;
}

import { getHomepageSection } from "@/lib/homepage-data";
import { CategoriesEditor } from "@/components/admin/CategoriesEditor";

export default async function AdminCategoriesPage() {
  const categories = await getHomepageSection("categories");
  return <CategoriesEditor initial={categories} />;
}

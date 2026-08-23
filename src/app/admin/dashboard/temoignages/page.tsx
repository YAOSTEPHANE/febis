import { listTestimonialsAdmin } from "@/lib/homepage-data";
import { TestimonialsAdminEditor } from "@/components/admin/TestimonialsAdminEditor";

export default async function AdminTemoignagesPage() {
  const items = await listTestimonialsAdmin();
  return <TestimonialsAdminEditor initial={items} />;
}

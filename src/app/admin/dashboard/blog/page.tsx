import { listBlogPostsAdmin } from "@/lib/homepage-data";
import { BlogAdminEditor } from "@/components/admin/BlogAdminEditor";

export default async function AdminBlogPage() {
  const posts = await listBlogPostsAdmin();
  return <BlogAdminEditor initial={posts} />;
}

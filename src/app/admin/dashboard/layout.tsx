import { requireAdminSession } from "@/lib/admin-auth";
import { roleLabel } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  return (
    <AdminShell name={session.name} role={roleLabel(session.role)}>
      {children}
    </AdminShell>
  );
}

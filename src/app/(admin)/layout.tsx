import { AdminShell } from '@/components/admin/admin-shell'
import { requireRole } from '@/lib/auth/guards'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole('admin')

  return <AdminShell profile={profile}>{children}</AdminShell>
}

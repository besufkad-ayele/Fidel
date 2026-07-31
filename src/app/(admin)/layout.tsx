import { AdminShell } from '@/components/admin/admin-shell'
import { requireRole } from '@/lib/auth/guards'
import { countPendingPasswordResetRequests } from '@/lib/data/notifications'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole('admin')
  const pendingNotifications = await countPendingPasswordResetRequests()

  return (
    <AdminShell profile={profile} pendingNotifications={pendingNotifications}>
      {children}
    </AdminShell>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { Bell, KeyRound } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { SectionCard } from '@/components/admin/section-card'
import { EmptyState } from '@/components/admin/empty-state'
import { ConfirmForm } from '@/components/admin/confirm-form'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/auth/guards'
import { formatDateTime } from '@/lib/admin/constants'
import { listPasswordResetRequests } from '@/lib/data/notifications'
import { dismissPasswordResetRequestAction } from '@/app/(admin)/admin/notification-actions'

export const metadata: Metadata = { title: 'Notifications' }

export default async function AdminNotificationsPage() {
  await requireRole('admin')
  const pending = await listPasswordResetRequests({ status: 'pending' })

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Notifications"
        description="Password reset requests and other items that need an admin response."
      />

      <SectionCard
        title="Password reset requests"
        description="Learners submit these from Forgot password. Set a new password on their profile, then share it with them."
      >
        {pending.length === 0 ? (
          <EmptyState
            title="No pending reset requests"
            description="When someone uses Forgot password on the login page, the request will show up here."
            compact
          />
        ) : (
          <ul className="space-y-3">
            {pending.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-gold-300 bg-gold-50/60 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-gold-500/15 text-gold-700">
                      <KeyRound className="size-4" aria-hidden />
                    </span>
                    <h3 className="font-display text-lg text-green-900">
                      {item.fullName || item.email}
                    </h3>
                    <StatusBadge status="pending" />
                    {item.role ? <StatusBadge status={item.role} /> : null}
                  </div>
                  <p className="text-sm text-green-800">{item.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Requested {formatDateTime(item.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link href={`/admin/people/${item.profileId}` as '/'}>
                      Open profile & set password
                    </Link>
                  </Button>
                  <ConfirmForm
                    action={dismissPasswordResetRequestAction.bind(null, item.id)}
                    message={`Dismiss the password reset request for ${item.email}?`}
                    label="Dismiss"
                    variant="outline"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Bell className="size-3.5" aria-hidden />
        More notification types (sessions, homework) will appear here later.
      </p>
    </div>
  )
}

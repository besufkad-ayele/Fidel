import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { SectionCard } from '@/components/admin/section-card'
import { StatusBadge } from '@/components/admin/status-badge'
import { EmptyState } from '@/components/admin/empty-state'
import { ConfirmForm } from '@/components/admin/confirm-form'
import { createAdminDb } from '@/lib/admin/db'
import { TIMEZONES, formatDate, formatDateTime, formatMoney } from '@/lib/admin/constants'
import {
  updatePersonAction,
  suspendPersonAction,
  reactivatePersonAction,
  activatePersonAction,
  resendInviteAction,
  resetPasswordAction,
  deletePersonAndRedirectAction,
} from '@/app/(admin)/admin/manage-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const db = await createAdminDb()
  const { data } = await db.from('profiles').select('full_name, email').eq('id', id).maybeSingle()
  return { title: data?.full_name || data?.email || 'Person' }
}

export default async function PersonDetailPage({ params }: Props) {
  const { id } = await params
  const db = await createAdminDb()

  const { data: profile } = await db.from('profiles').select('*').eq('id', id).maybeSingle()
  if (!profile) notFound()

  const [student, teacher, entitlements, payments, notes, assignments] = await Promise.all([
    db.from('student_profiles').select('*').eq('user_id', id).maybeSingle(),
    db.from('teacher_profiles').select('*').eq('user_id', id).maybeSingle(),
    db
      .from('entitlements')
      .select('id, scope, level_id, unit_id, source, status, granted_at, expires_at, note')
      .eq('student_id', id)
      .order('granted_at', { ascending: false }),
    db
      .from('payments')
      .select('id, amount_cents, currency, provider, status, paid_at, reference')
      .eq('student_id', id)
      .order('created_at', { ascending: false }),
    db
      .from('student_internal_notes')
      .select('id, body, created_at')
      .eq('student_id', id)
      .order('created_at', { ascending: false }),
    db
      .from('student_teacher_assignments')
      .select('id, teacher_id, is_primary, assigned_at')
      .or(`student_id.eq.${id},teacher_id.eq.${id}`),
  ])

  const status = !profile.is_active ? 'suspended' : profile.activated_at ? 'active' : 'pending'
  const confirmName = profile.full_name || profile.email

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={profile.full_name || profile.email}
        description={profile.email}
        actions={[
          { label: 'Grant access', href: '/admin/entitlements', variant: 'outline' },
          { label: 'Record payment', href: '/admin/payments', variant: 'outline' },
        ]}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <StatusBadge status={profile.role} />
        <StatusBadge status={status} />
        {profile.admin_title ? <StatusBadge status={profile.admin_title} /> : null}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {status === 'pending' ? (
          <ConfirmForm
            action={activatePersonAction.bind(null, id)}
            message="Activate this pending account so they can sign in?"
            label="Activate"
            variant="outline"
          />
        ) : null}
        <ConfirmForm
          action={resendInviteAction.bind(null, id)}
          message={`Resend invite to ${profile.email}?`}
          label="Resend invite"
          variant="outline"
        />
        <ConfirmForm
          action={resetPasswordAction.bind(null, id)}
          message={`Generate a password reset for ${profile.email}?`}
          label="Reset password"
          variant="outline"
        />
        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/people/${id}/edit` as '/'}>Edit</Link>
        </Button>
        {status === 'active' ? (
          <form action={suspendPersonAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={id} />
            <Input
              name="reason"
              placeholder="Suspension reason"
              className="h-8 w-[200px]"
              required
            />
            <Button type="submit" size="sm" variant="outline">
              Suspend
            </Button>
          </form>
        ) : null}
        {status === 'suspended' ? (
          <ConfirmForm
            action={reactivatePersonAction.bind(null, id)}
            message="Reactivate this account?"
            label="Reactivate"
            variant="outline"
          />
        ) : null}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <SectionCard title="Edit profile">
          <form action={updatePersonAction} className="space-y-3">
            <input type="hidden" name="id" value={id} />
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                className="mt-1.5"
                defaultValue={profile.full_name}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" className="mt-1.5" defaultValue={profile.phone ?? ''} />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                name="timezone"
                defaultValue={profile.timezone}
                className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="locale">Locale</Label>
              <Input id="locale" name="locale" className="mt-1.5" defaultValue={profile.locale} />
            </div>
            <Button type="submit">Save profile</Button>
          </form>
        </SectionCard>

        <SectionCard title="Overview">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Timezone</dt>
              <dd className="font-medium">{profile.timezone}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Locale</dt>
              <dd className="font-medium">{profile.locale}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Invited</dt>
              <dd className="font-medium">{formatDateTime(profile.invited_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Activated</dt>
              <dd className="font-medium">{formatDateTime(profile.activated_at)}</dd>
            </div>
            {student.data ? (
              <>
                <div>
                  <dt className="text-muted-foreground">Persona</dt>
                  <dd className="font-medium capitalize">{student.data.persona}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Starting level</dt>
                  <dd className="font-medium">{student.data.starting_level_id}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Learning goal</dt>
                  <dd className="font-medium">{student.data.learning_goal || '—'}</dd>
                </div>
              </>
            ) : null}
            {teacher.data ? (
              <>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Headline</dt>
                  <dd className="font-medium">{teacher.data.headline || '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Accepting students</dt>
                  <dd className="font-medium">{teacher.data.is_accepting_students ? 'Yes' : 'No'}</dd>
                </div>
              </>
            ) : null}
            {profile.suspended_reason ? (
              <div className="col-span-2">
                <dt className="text-muted-foreground">Suspended reason</dt>
                <dd className="font-medium text-danger-500">{profile.suspended_reason}</dd>
              </div>
            ) : null}
          </dl>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Access">
          {(entitlements.data ?? []).length === 0 ? (
            <EmptyState
              title="No entitlements"
              description="Grant a level or specific units so this student can open content."
              actionLabel="Grant access"
              actionHref="/admin/entitlements"
              compact
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scope</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(entitlements.data ?? []).map(
                  (e: {
                    id: string
                    scope: string
                    level_id: string | null
                    unit_id: string | null
                    status: string
                    expires_at: string | null
                  }) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.scope}</TableCell>
                      <TableCell>{e.level_id || e.unit_id}</TableCell>
                      <TableCell>
                        <StatusBadge status={e.status} />
                      </TableCell>
                      <TableCell>{formatDate(e.expires_at)}</TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        <SectionCard title="Payments">
          {(payments.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(payments.data ?? []).map(
                  (p: {
                    id: string
                    amount_cents: number
                    currency: string
                    status: string
                    paid_at: string | null
                  }) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatMoney(p.amount_cents, p.currency)}</TableCell>
                      <TableCell>
                        <StatusBadge status={p.status} />
                      </TableCell>
                      <TableCell>{formatDate(p.paid_at)}</TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        <SectionCard title="Notes & assignments">
          <div className="space-y-4">
            {(notes.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No internal notes.</p>
            ) : (
              (notes.data ?? []).map((n: { id: string; body: string; created_at: string }) => (
                <div key={n.id} className="rounded-lg border border-cream-300 bg-cream-100 p-3 text-sm">
                  <p>{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.created_at)}</p>
                </div>
              ))
            )}
            <p className="text-sm text-muted-foreground">
              Assignments: {(assignments.data ?? []).length} ·{' '}
              <Link href={'/admin/people' as '/'} className="text-green-700 hover:underline">
                Back to directory
              </Link>
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Delete account">
          <p className="mb-3 text-sm text-muted-foreground">
            Hard delete cascades auth + profile data. Blocked if issued certificates exist. Type the
            full name to confirm: <span className="font-medium text-green-700">{confirmName}</span>
          </p>
          <form action={deletePersonAndRedirectAction} className="space-y-3">
            <input type="hidden" name="id" value={id} />
            <div>
              <Label htmlFor="confirmName">Confirm name</Label>
              <Input id="confirmName" name="confirmName" className="mt-1.5" required />
            </div>
            <Button type="submit" variant="destructive">
              Delete account
            </Button>
          </form>
        </SectionCard>
      </div>
    </div>
  )
}

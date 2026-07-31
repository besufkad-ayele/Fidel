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
  updateStudentProfileAction,
  updateTeacherProfileAction,
  suspendPersonAction,
  reactivatePersonAction,
  activatePersonAction,
  resendInviteAction,
  deletePersonAndRedirectAction,
  revokeEntitlementAction,
  restoreEntitlementAction,
} from '@/app/(admin)/admin/manage-actions'
import { PersonPasswordPanel } from './person-password-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StudentProgressTracker } from '@/components/admin/student-progress-tracker'
import { getStudentProgressDetail } from '@/lib/data/progress'
import { TeacherAssignmentPanel } from './teacher-assignment-panel'

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

  const [student, teacher, entitlements, payments, notes, assignments, teachers, progress, pendingReset] =
    await Promise.all([
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
        .eq('student_id', id)
        .order('assigned_at', { ascending: true }),
      db
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'teacher')
        .eq('is_active', true)
        .order('full_name'),
      getStudentProgressDetail(id, { asAdmin: true }),
      db
        .from('password_reset_requests')
        .select('id')
        .eq('profile_id', id)
        .eq('status', 'pending')
        .maybeSingle(),
    ])

  const teacherIds = (assignments.data ?? []).map((a: { teacher_id: string }) => a.teacher_id)
  const { data: assignedProfiles } = teacherIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', teacherIds)
    : { data: [] as { id: string; full_name: string; email: string }[] }

  const nameMap = new Map<string, string>(
    (assignedProfiles ?? []).map((p: { id: string; full_name: string; email: string }) => [
      p.id,
      p.full_name || p.email,
    ]),
  )

  const status = !profile.is_active ? 'suspended' : profile.activated_at ? 'active' : 'pending'
  const confirmName = profile.full_name || profile.email
  const isStudent = profile.role === 'student' || !!student.data

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={profile.full_name || profile.email}
        description={profile.email}
        actions={
          isStudent
            ? [
                {
                  label: 'Manage progress',
                  href: `/admin/progress/${id}`,
                  variant: 'default' as const,
                },
                {
                  label: 'Grant access',
                  href: `/admin/entitlements?studentId=${id}`,
                  variant: 'outline' as const,
                },
                { label: 'Record payment', href: '/admin/payments', variant: 'outline' as const },
              ]
            : [{ label: 'Record payment', href: '/admin/payments', variant: 'outline' as const }]
        }
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
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" className="mt-1.5" defaultValue={profile.email} required />
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
            {profile.role === 'admin' ? (
              <div>
                <Label htmlFor="adminTitle">Admin title</Label>
                <select
                  id="adminTitle"
                  name="adminTitle"
                  defaultValue={profile.admin_title ?? ''}
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">None</option>
                  <option value="super_admin">Super admin</option>
                  <option value="content_manager">Content manager</option>
                  <option value="program_coordinator">Program coordinator</option>
                  <option value="support">Support</option>
                </select>
              </div>
            ) : null}
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

      {student.data ? (
        <div className="mb-8">
          <SectionCard title="Fellow learning profile">
            <form action={updateStudentProfileAction} className="grid gap-3 lg:grid-cols-2">
              <input type="hidden" name="userId" value={id} />
              <div>
                <Label htmlFor="preferredName">Preferred name</Label>
                <Input
                  id="preferredName"
                  name="preferredName"
                  className="mt-1.5"
                  defaultValue={student.data.preferred_name ?? ''}
                />
              </div>
              <div>
                <Label htmlFor="persona">Persona</Label>
                <select
                  id="persona"
                  name="persona"
                  defaultValue={student.data.persona ?? 'other'}
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="diplomat">Diplomat</option>
                  <option value="ngo">NGO</option>
                  <option value="tourist">Tourist</option>
                  <option value="missionary">Missionary</option>
                  <option value="researcher">Researcher</option>
                  <option value="diaspora">Diaspora</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="studyIntent">Study intent</Label>
                <select
                  id="studyIntent"
                  name="studyIntent"
                  defaultValue={student.data.study_intent ?? 'steady'}
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="casual">Casual</option>
                  <option value="steady">Steady</option>
                  <option value="intensive">Intensive</option>
                </select>
              </div>
              <div>
                <Label htmlFor="priorExperience">Prior experience</Label>
                <select
                  id="priorExperience"
                  name="priorExperience"
                  defaultValue={student.data.prior_experience ?? 'none'}
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="none">None</option>
                  <option value="few_words">Few words</option>
                  <option value="speaks_some">Speaks some</option>
                  <option value="reads_fidel">Reads fidel</option>
                  <option value="conversational">Conversational</option>
                </select>
              </div>
              <div>
                <Label htmlFor="nativeLanguage">Native language</Label>
                <Input
                  id="nativeLanguage"
                  name="nativeLanguage"
                  className="mt-1.5"
                  defaultValue={student.data.native_language ?? ''}
                />
              </div>
              <div>
                <Label htmlFor="otherLanguages">Other languages (comma-separated)</Label>
                <Input
                  id="otherLanguages"
                  name="otherLanguages"
                  className="mt-1.5"
                  defaultValue={(student.data.other_languages ?? []).join(', ')}
                />
              </div>
              <div>
                <Label htmlFor="country">Country (ISO)</Label>
                <Input id="country" name="country" className="mt-1.5" defaultValue={student.data.country ?? ''} />
              </div>
              <div>
                <Label htmlFor="jobTitle">Job title</Label>
                <Input id="jobTitle" name="jobTitle" className="mt-1.5" defaultValue={student.data.job_title ?? ''} />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input id="department" name="department" className="mt-1.5" defaultValue={student.data.department ?? ''} />
              </div>
              <div>
                <Label htmlFor="preferredDays">Preferred days (0-6, comma-separated)</Label>
                <Input
                  id="preferredDays"
                  name="preferredDays"
                  className="mt-1.5"
                  defaultValue={(student.data.preferred_days ?? []).join(',')}
                />
              </div>
              <div className="lg:col-span-2">
                <Label htmlFor="preferredTimes">Preferred times (morning,afternoon,evening)</Label>
                <Input
                  id="preferredTimes"
                  name="preferredTimes"
                  className="mt-1.5"
                  defaultValue={(student.data.preferred_times ?? []).join(',')}
                />
              </div>
              <div className="lg:col-span-2">
                <Label htmlFor="learningGoal">Learning goal</Label>
                <Textarea
                  id="learningGoal"
                  name="learningGoal"
                  className="mt-1.5"
                  defaultValue={student.data.learning_goal ?? ''}
                  rows={3}
                />
              </div>
              <div className="lg:col-span-2">
                <Button type="submit">Save fellow profile</Button>
              </div>
            </form>
          </SectionCard>
        </div>
      ) : null}

      {teacher.data ? (
        <div className="mb-8">
          <SectionCard title="Teacher profile">
            <form action={updateTeacherProfileAction} className="grid gap-3 lg:grid-cols-2">
              <input type="hidden" name="userId" value={id} />
              <div className="lg:col-span-2">
                <Label htmlFor="headline">Headline</Label>
                <Input id="headline" name="headline" className="mt-1.5" defaultValue={teacher.data.headline ?? ''} />
              </div>
              <div className="lg:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" name="bio" className="mt-1.5" defaultValue={teacher.data.bio ?? ''} rows={4} />
              </div>
              <div>
                <Label htmlFor="yearsExperience">Years experience</Label>
                <Input
                  id="yearsExperience"
                  name="yearsExperience"
                  type="number"
                  min={0}
                  className="mt-1.5"
                  defaultValue={teacher.data.years_experience ?? ''}
                />
              </div>
              <div>
                <Label htmlFor="hourlyRateCents">Hourly rate (cents)</Label>
                <Input
                  id="hourlyRateCents"
                  name="hourlyRateCents"
                  type="number"
                  min={0}
                  className="mt-1.5"
                  defaultValue={teacher.data.hourly_rate_cents ?? ''}
                />
              </div>
              <div className="lg:col-span-2">
                <Label htmlFor="languagesSpoken">Languages spoken (comma-separated)</Label>
                <Input
                  id="languagesSpoken"
                  name="languagesSpoken"
                  className="mt-1.5"
                  defaultValue={(teacher.data.languages_spoken ?? []).join(', ')}
                />
              </div>
              <label className="flex items-center gap-2 text-sm lg:col-span-2">
                <input
                  type="checkbox"
                  name="isAcceptingStudents"
                  defaultChecked={Boolean(teacher.data.is_accepting_students)}
                />
                Accepting students
              </label>
              <div className="lg:col-span-2">
                <Button type="submit">Save teacher profile</Button>
              </div>
            </form>
          </SectionCard>
        </div>
      ) : null}

      <div className="mb-8">
        <SectionCard title="Password">
          <PersonPasswordPanel
            personId={id}
            email={profile.email}
            hasPendingResetRequest={Boolean(pendingReset.data)}
          />
        </SectionCard>
      </div>

      {isStudent && progress ? (
        <div className="mb-8">
          <SectionCard
            title="Progress tracker"
            description="Practice pass/fail and weighted unit grades for this student."
            action={
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/progress/${id}` as '/'}>Manage</Link>
              </Button>
            }
          >
            <StudentProgressTracker detail={progress} />
          </SectionCard>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {isStudent ? (
          <SectionCard title="Course access">
            {(entitlements.data ?? []).length === 0 ? (
              <EmptyState
                title="No entitlements"
                description="Grant a level or specific units so this student can open content."
                actionLabel="Grant access"
                actionHref={`/admin/entitlements?studentId=${id}`}
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
                    <TableHead className="text-right">Actions</TableHead>
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
                        <TableCell className="text-right">
                          {e.status === 'active' ? (
                            <form
                              action={revokeEntitlementAction}
                              className="inline-flex items-center gap-1"
                            >
                              <input type="hidden" name="id" value={e.id} />
                              <Input
                                name="reason"
                                placeholder="Reason"
                                className="h-8 w-[120px]"
                                required
                              />
                              <Button type="submit" size="sm" variant="destructive">
                                Revoke
                              </Button>
                            </form>
                          ) : (
                            <form action={restoreEntitlementAction}>
                              <input type="hidden" name="id" value={e.id} />
                              <Button type="submit" size="sm" variant="outline">
                                Restore
                              </Button>
                            </form>
                          )}
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            )}
            <div className="mt-3">
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/entitlements?studentId=${id}` as '/'}>Grant more access</Link>
              </Button>
            </div>
          </SectionCard>
        ) : null}

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

        {isStudent ? (
          <SectionCard title="Temari assignment">
            <TeacherAssignmentPanel
              studentId={id}
              assignments={assignments.data ?? []}
              teachers={teachers.data ?? []}
              nameMap={nameMap}
            />
          </SectionCard>
        ) : null}

        <SectionCard title="Internal notes">
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

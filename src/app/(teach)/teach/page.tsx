import Link from 'next/link'
import type { Metadata } from 'next'
import {
  CalendarDays,
  ClipboardCheck,
  Clock3,
  Users,
  ArrowRight,
  Sun,
  BookOpenCheck,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { AttentionRow } from '@/components/shared/attention-row'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCurrentProfile } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import {
  teacherApproveSessionAction,
  teacherCancelSessionAction,
} from '@/app/(learn)/sessions/actions'

export const metadata: Metadata = { title: 'Today' }

export default async function TeacherTodayPage() {
  const profile = await getCurrentProfile()
  const t = await getTranslations('teach')
  const firstName = profile?.full_name?.split(/\s+/)[0]
  const hour = new Date().getHours()
  const greetingKey = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
  const timezone = profile?.timezone || 'Africa/Addis_Ababa'

  let studentCount = 0
  let upcomingSessions: {
    id: string
    student_id: string
    scheduled_at: string
    status: string
    student_note: string | null
    session_notes: string | null
  }[] = []
  let studentMap = new Map<string, string>()
  if (profile) {
    const supabase = await createClient()
    const [{ count }, sessionsRes] = await Promise.all([
      supabase
        .from('student_teacher_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', profile.id),
      supabase
        .from('sessions')
        .select('id, student_id, scheduled_at, status, student_note, session_notes')
        .eq('teacher_id', profile.id)
        .in('status', ['scheduled', 'cancelled'])
        .order('scheduled_at', { ascending: true })
        .limit(8),
    ])
    studentCount = count ?? 0
    upcomingSessions = sessionsRes.data ?? []

    const studentIds = Array.from(new Set(upcomingSessions.map((s) => s.student_id)))
    if (studentIds.length) {
      const { data: students } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentIds)
      studentMap = new Map((students ?? []).map((s) => [s.id, s.full_name || s.email]))
    }
  }

  const todayLabel = new Intl.DateTimeFormat(profile?.locale || 'en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
  }).format(new Date())

  return (
    <div>
      <header className="mb-8 border-b border-cream-300/80 pb-6">
        <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
          {t('eyebrow')}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-[2rem] leading-10 tracking-tight text-green-700 sm:text-[2.25rem] sm:leading-[2.75rem]">
              {t(`greeting.${greetingKey}`, { name: firstName || t('teacher') })}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('dateLine', { date: todayLabel, timezone })}
            </p>
          </div>
          <Button asChild variant="outline" className="border-cream-400 bg-cream-50">
            <Link href={'/teach/schedule' as '/'}>{t('viewSchedule')}</Link>
          </Button>
        </div>
      </header>

      {/* KPI strip */}
      <section className="mb-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-info-50 text-info-500">
              <Sun className="size-4" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                {t('stats.today')}
              </p>
              <p className="text-2xl font-semibold text-green-700 tabular-nums">0</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-warning-50 text-warning-500">
              <ClipboardCheck className="size-4" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                {t('stats.review')}
              </p>
              <p className="text-2xl font-semibold text-green-700 tabular-nums">0</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <Users className="size-4" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                {t('stats.students')}
              </p>
              <p className="text-2xl font-semibold text-green-700 tabular-nums">{studentCount}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Today's sessions */}
        <section className="rounded-xl border border-cream-300 bg-cream-50 shadow-card lg:col-span-3">
          <div className="flex items-center justify-between border-b border-cream-300 px-6 py-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {t('sessions.eyebrow')}
              </p>
              <h2 className="mt-0.5 text-lg font-semibold text-green-700">{t('sessions.title')}</h2>
            </div>
            <Link
              href={'/teach/schedule' as '/'}
              className="text-sm font-medium text-green-700 hover:underline"
            >
              {t('sessions.week')}
            </Link>
          </div>

          <div className="flex flex-col items-center px-6 py-14 text-center">
            {upcomingSessions.length === 0 ? (
              <>
                <span className="flex size-16 items-center justify-center rounded-2xl border border-cream-300 bg-cream-100 text-green-600">
                  <CalendarDays className="size-7" strokeWidth={1.5} />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-green-700">{t('sessions.emptyTitle')}</h3>
                <p className="mt-2 max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
                  {t('sessions.emptyBody')}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Button asChild className="bg-green-700 text-cream-50 hover:bg-green-600">
                    <Link href={'/teach/schedule' as '/'}>
                      {t('sessions.ctaSchedule')}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-cream-400 bg-cream-50">
                    <Link href={'/teach/availability' as '/'}>{t('sessions.ctaAvailability')}</Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="w-full space-y-3 text-left">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="rounded-lg border border-cream-300 bg-cream-100/70 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-green-700">
                        {studentMap.get(session.student_id) ?? 'Student'} ·{' '}
                        {new Date(session.scheduled_at).toLocaleString()}
                      </p>
                      <span className="text-xs text-muted-foreground uppercase">{session.status}</span>
                    </div>
                    {session.student_note ? (
                      <p className="mt-1 text-sm text-muted-foreground">Student note: {session.student_note}</p>
                    ) : null}
                    {session.session_notes ? (
                      <p className="mt-1 text-sm text-muted-foreground">Latest note: {session.session_notes}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <form action={teacherApproveSessionAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={session.id} />
                        <Input name="note" placeholder="Approval note" className="h-8 w-32" />
                        <Button type="submit" size="sm">
                          Approve
                        </Button>
                      </form>
                      <form action={teacherCancelSessionAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={session.id} />
                        <Input name="note" placeholder="Cancel reason" className="h-8 w-32" />
                        <Button type="submit" size="sm" variant="outline">
                          Cancel
                        </Button>
                      </form>
                      <Button asChild size="sm" variant="outline">
                        <Link href={'/teach/schedule' as '/'}>Propose other time</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Side column */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-cream-300 bg-cream-50 p-6 shadow-card">
            <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {t('review.eyebrow')}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-green-700">{t('review.title')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('review.empty')}</p>
            <Button asChild variant="outline" className="mt-4 w-full border-cream-400 bg-cream-50">
              <Link href={'/teach/homework' as '/'}>{t('review.cta')}</Link>
            </Button>
          </section>

          <section className="rounded-xl border border-cream-300 bg-cream-50 p-6 shadow-card">
            <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {t('week.eyebrow')}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-green-700">{t('week.title')}</h2>
            <ul className="mt-4 space-y-3">
              {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                const day = new Date()
                day.setDate(day.getDate() + offset)
                const label = new Intl.DateTimeFormat(profile?.locale || 'en', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  timeZone: timezone,
                }).format(day)
                const isToday = offset === 0
                return (
                  <li
                    key={offset}
                    className={
                      isToday
                        ? 'flex items-center justify-between rounded-lg border border-gold-300 bg-gold-50 px-3 py-2.5'
                        : 'flex items-center justify-between rounded-lg border border-cream-300 bg-cream-100/50 px-3 py-2.5'
                    }
                  >
                    <span
                      className={
                        isToday
                          ? 'text-sm font-semibold text-green-700'
                          : 'text-sm text-muted-foreground'
                      }
                    >
                      {label}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {t('week.free')}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </div>

      {/* Prep shortcuts */}
      <section className="mt-8">
        <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          {t('shortcuts.eyebrow')}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AttentionRow
            href="/teach/students"
            icon={Users}
            tone="info"
            title={t('shortcuts.rosterTitle')}
            description={
              studentCount > 0
                ? t('shortcuts.rosterBody', { count: studentCount })
                : t('shortcuts.rosterEmpty')
            }
          />
          <AttentionRow
            href="/teach/availability"
            icon={Clock3}
            tone="default"
            title={t('shortcuts.availabilityTitle')}
            description={t('shortcuts.availabilityBody')}
          />
          <AttentionRow
            href="/teach/homework"
            icon={BookOpenCheck}
            tone="warning"
            title={t('shortcuts.prepTitle')}
            description={t('shortcuts.prepBody')}
          />
        </div>
      </section>
    </div>
  )
}

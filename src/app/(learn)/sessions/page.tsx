import Link from 'next/link'
import type { Metadata } from 'next'
import { CalendarDays, Clock3, Video, CheckCircle2, Hourglass } from 'lucide-react'
import { createAdminDb } from '@/lib/admin/db'
import { getCurrentProfile } from '@/lib/auth/session'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  isPendingApproval,
  isConfirmedUpcoming,
  needsHappenedConfirmation,
} from '@/lib/domain/sessions'
import { cancelStudentSessionAction, markSessionHappenedAction } from './actions'

export const metadata: Metadata = { title: 'Live sessions' }

type SessionRow = {
  id: string
  teacher_id: string
  scheduled_at: string
  duration_minutes: number
  status: string
  meet_link: string | null
  student_note: string | null
  session_notes: string | null
}

function formatSessionWhen(iso: string, locale?: string | null) {
  const date = new Date(iso)
  const day = new Intl.DateTimeFormat(locale || 'en', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
  const time = new Intl.DateTimeFormat(locale || 'en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
  return { day, time }
}

function statusMeta(session: SessionRow) {
  if (isPendingApproval(session)) {
    return {
      label: 'Awaiting approval',
      className: 'border-warning-500/25 bg-warning-50 text-warning-500',
      Icon: Hourglass,
    }
  }
  if (needsHappenedConfirmation(session)) {
    return {
      label: 'Confirm attendance',
      className: 'border-gold-300 bg-gold-50 text-gold-800',
      Icon: CheckCircle2,
    }
  }
  if (isConfirmedUpcoming(session)) {
    return {
      label: 'Confirmed',
      className: 'border-success-500/25 bg-success-50 text-success-500',
      Icon: CheckCircle2,
    }
  }
  return {
    label: session.status,
    className: 'border-cream-400 bg-cream-100 text-muted-foreground',
    Icon: Clock3,
  }
}

export default async function Page({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const searchParams = await searchParamsPromise
  const profile = await getCurrentProfile()
  if (!profile) return null

  const db = createAdminDb()
  const { data: sessions } = await db
    .from('sessions')
    .select(
      'id, teacher_id, scheduled_at, duration_minutes, status, meet_link, student_note, session_notes',
    )
    .eq('student_id', profile.id)
    .in('status', ['pending', 'scheduled'])
    .order('scheduled_at', { ascending: true })

  const activeSessions = (sessions ?? []) as SessionRow[]

  const teacherIds = Array.from(new Set(activeSessions.map((s) => s.teacher_id)))
  const { data: teachers } = teacherIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', teacherIds)
    : { data: [] as { id: string; full_name: string; email: string }[] }
  const teacherMap = new Map<string, string>(
    (teachers ?? []).map((t: { id: string; full_name: string | null; email: string }) => [
      t.id,
      t.full_name || t.email,
    ]),
  )

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-green-700">Live sessions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Book a session, wait for approval with a Meet link, then join and confirm when it
            happened.
          </p>
        </div>
        <Button asChild className="bg-green-700 text-cream-50 hover:bg-green-600">
          <Link href={'/sessions/book' as '/'}>Book session</Link>
        </Button>
      </div>

      {searchParams.error === 'not_ended' ? (
        <p className="rounded-lg border border-warning-500/30 bg-warning-50 px-3 py-2 text-sm text-warning-500">
          You can mark a session as happened after the scheduled end time.
        </p>
      ) : null}

      {activeSessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cream-400 bg-cream-50 px-6 py-12 text-center">
          <CalendarDays className="mx-auto size-8 text-green-600/50" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium text-green-800">No upcoming sessions</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Completed and cancelled sessions are cleared from this list.
          </p>
          <Button asChild className="mt-5 bg-green-700 text-cream-50 hover:bg-green-600">
            <Link href={'/sessions/book' as '/'}>Book your next session</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {activeSessions.map((session) => {
            const pending = isPendingApproval(session)
            const needsConfirm = needsHappenedConfirmation(session)
            const upcoming = isConfirmedUpcoming(session)
            const status = statusMeta(session)
            const StatusIcon = status.Icon
            const when = formatSessionWhen(session.scheduled_at, profile.locale)
            const teacherName = teacherMap.get(session.teacher_id) ?? 'Teacher'
            const teacherNote = session.session_notes?.replace(/^Approved:\s*/i, '') ?? null

            return (
              <article
                key={session.id}
                className="overflow-hidden rounded-xl border border-cream-300 bg-cream-50 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-cream-300/80 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                      Teacher
                    </p>
                    <h2 className="mt-0.5 font-display text-xl text-green-800">{teacherName}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-3.5 shrink-0" strokeWidth={1.75} />
                        {when.day}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="size-3.5 shrink-0" strokeWidth={1.75} />
                        {when.time}
                        <span className="text-cream-400">·</span>
                        {session.duration_minutes} min
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                      status.className,
                    )}
                  >
                    <StatusIcon className="size-3.5" strokeWidth={2} />
                    {status.label}
                  </span>
                </div>

                {(session.student_note || teacherNote) && (
                  <div className="space-y-2 border-b border-cream-300/80 px-5 py-4">
                    {session.student_note ? (
                      <div className="rounded-lg border border-cream-300 bg-cream-100/70 px-3 py-2.5">
                        <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                          Your focus
                        </p>
                        <p className="mt-1 text-sm text-green-900">{session.student_note}</p>
                      </div>
                    ) : null}
                    {teacherNote ? (
                      <p className="px-0.5 text-sm text-muted-foreground">
                        <span className="font-medium text-green-800">Teacher: </span>
                        {teacherNote}
                      </p>
                    ) : null}
                  </div>
                )}

                <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    {upcoming && session.meet_link ? (
                      <Button asChild className="bg-green-700 text-cream-50 hover:bg-green-600">
                        <a href={session.meet_link} target="_blank" rel="noopener noreferrer">
                          <Video className="size-4" />
                          Join Meet
                        </a>
                      </Button>
                    ) : null}

                    {needsConfirm ? (
                      <form action={markSessionHappenedAction}>
                        <input type="hidden" name="id" value={session.id} />
                        <Button type="submit" className="bg-gold-500 text-green-950 hover:bg-gold-600">
                          <CheckCircle2 className="size-4" />
                          Mark as happened
                        </Button>
                      </form>
                    ) : null}

                    {pending ? (
                      <p className="text-sm text-muted-foreground">
                        Waiting for your teacher to approve and add a Meet link.
                      </p>
                    ) : null}
                  </div>

                  {!needsConfirm ? (
                    <form
                      action={cancelStudentSessionAction}
                      className="flex w-full max-w-md items-center gap-2 sm:w-auto sm:justify-end"
                    >
                      <input type="hidden" name="id" value={session.id} />
                      <input
                        name="reason"
                        placeholder="Cancel reason (optional)"
                        className="h-9 min-w-0 flex-1 rounded-md border border-cream-400 bg-background px-3 text-sm sm:w-48 sm:flex-none"
                      />
                      <Button type="submit" variant="outline" size="sm" className="shrink-0 border-cream-400">
                        Cancel
                      </Button>
                    </form>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

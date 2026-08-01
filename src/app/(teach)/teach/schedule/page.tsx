import Link from 'next/link'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/guards'
import { createAdminDb } from '@/lib/admin/db'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  teacherApproveSessionAction,
  teacherProposeSessionAction,
  teacherCancelSessionAction,
  markSessionHappenedAction,
} from '@/app/(learn)/sessions/actions'
import { FALLBACK_SLOT_HOURS, slotsForDay, zonedCivilToUtcIso, minutesToTime, civilDateInTimezone } from '@/lib/domain/availability'
import {
  isConfirmedUpcoming,
  isPendingApproval,
  needsHappenedConfirmation,
} from '@/lib/domain/sessions'

export const metadata: Metadata = { title: 'Schedule' }

function ymdUTC(d: Date) {
  return d.toISOString().slice(0, 10)
}

function slotLabel(date: Date, timeZone?: string) {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  })
}

export default async function Page({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ day?: string; error?: string }>
}) {
  const searchParams = await searchParamsPromise
  const { user, profile: teacher } = await requireRole('teacher')
  const db = createAdminDb()
  const supabase = await createClient()
  const timezone = teacher.timezone || 'Africa/Addis_Ababa'

  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))

  const calStart = new Date(monthStart)
  calStart.setUTCDate(calStart.getUTCDate() - calStart.getUTCDay())
  const calEnd = new Date(monthEnd)
  calEnd.setUTCDate(calEnd.getUTCDate() + (6 - calEnd.getUTCDay()))

  const rangeStartIso = calStart.toISOString()
  const rangeEndIso = calEnd.toISOString()

  const [{ data: sessions }, { data: availability }, { data: timeOff }] = await Promise.all([
    db
      .from('sessions')
      .select('id, student_id, scheduled_at, duration_minutes, status, student_note, meet_link')
      .eq('teacher_id', teacher.id)
      .in('status', ['pending', 'scheduled'])
      .gte('scheduled_at', rangeStartIso)
      .lte('scheduled_at', rangeEndIso),
    supabase
      .from('teacher_availability')
      .select('id, weekday, start_time, end_time, timezone, is_active')
      .eq('teacher_id', user.id)
      .eq('is_active', true),
    supabase
      .from('teacher_time_off')
      .select('id, starts_at, ends_at, reason')
      .eq('teacher_id', user.id)
      .gte('ends_at', rangeStartIso)
      .lte('starts_at', rangeEndIso),
  ])

  const hasAvailabilityRules = (availability ?? []).length > 0

  const booked = (sessions ?? []).map((s: any) => ({
    ...s,
    sStart: new Date(s.scheduled_at),
    sEnd: new Date(new Date(s.scheduled_at).getTime() + s.duration_minutes * 60 * 1000),
    day: ymdUTC(new Date(s.scheduled_at)),
  }))

  const dayKeyDefault = ymdUTC(now)
  const selectedDayKey = searchParams?.day && typeof searchParams.day === 'string' ? searchParams.day : dayKeyDefault
  const selectedDay = new Date(selectedDayKey + 'T00:00:00.000Z')

  function candidateSlotsForDay(day: Date): string[] {
    if (hasAvailabilityRules) {
      return slotsForDay({
        day,
        timezone,
        blocks: (availability ?? []).map((b) => ({
          weekday: b.weekday,
          start_time: b.start_time,
          end_time: b.end_time,
          timezone: b.timezone,
          is_active: b.is_active,
        })),
        timeOff: (timeOff ?? []).map((t) => ({
          starts_at: t.starts_at,
          ends_at: t.ends_at,
          reason: t.reason,
        })),
        durationMinutes: 60,
        stepMinutes: 60,
      })
    }
    const ymd = civilDateInTimezone(day, timezone)
    return FALLBACK_SLOT_HOURS.map((h) => zonedCivilToUtcIso(ymd, minutesToTime(h * 60), timezone)).filter(
      (iso): iso is string => Boolean(iso),
    )
  }

  const freeSlotsOfDay = candidateSlotsForDay(selectedDay)
    .map((iso) => {
      const start = new Date(iso)
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      const overlaps = booked.some(
        (b: { sStart: Date; sEnd: Date }) => start < b.sEnd && end > b.sStart,
      )
      return { iso, label: slotLabel(start, timezone), isFree: !overlaps }
    })
    .filter((s) => s.isFree)

  const { data: upcomingSessions } = await db
    .from('sessions')
    .select(
      'id, student_id, scheduled_at, duration_minutes, status, meet_link, student_note, session_notes',
    )
    .eq('teacher_id', teacher.id)
    .in('status', ['pending', 'scheduled'])
    .order('scheduled_at', { ascending: true })
    .limit(20)

  const actionableSessions = ((upcomingSessions ?? []) as Array<{
    id: string
    student_id: string
    scheduled_at: string
    duration_minutes: number
    status: string
    meet_link: string | null
    student_note: string | null
    session_notes: string | null
  }>).filter(
    (s) => isPendingApproval(s) || isConfirmedUpcoming(s) || needsHappenedConfirmation(s),
  )

  const studentIds = Array.from(new Set(actionableSessions.map((s) => s.student_id)))
  const { data: studentProfiles } = studentIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', studentIds)
    : { data: [] as { id: string; full_name: string; email: string }[] }

  const studentMap = new Map<string, string>(
    (studentProfiles ?? []).map((p: { id: string; full_name: string | null; email: string }) => [
      p.id,
      p.full_name || p.email,
    ]),
  )

  // Student schedules for context (next 7 days).
  const { data: studentSessions } = studentIds.length
    ? await db
        .from('sessions')
        .select('id, student_id, teacher_id, scheduled_at, duration_minutes, status')
        .in('status', ['pending', 'scheduled'])
        .in('student_id', studentIds)
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('scheduled_at', { ascending: true })
    : { data: [] as any[] }

  const studentScheduleMap = new Map<string, any[]>()
  for (const s of studentSessions ?? []) {
    const list = studentScheduleMap.get(s.student_id) ?? []
    list.push(s)
    studentScheduleMap.set(s.student_id, list)
  }

  const dayCells: Date[] = []
  for (let d = new Date(calStart); d <= calEnd; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
    dayCells.push(new Date(d))
  }

  const dayCellMeta = (day: Date) => {
    const dayKey = ymdUTC(day)
    const candidates = candidateSlotsForDay(day)
    const bookedCount = candidates.filter((iso) => {
      const start = new Date(iso)
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      return booked.some((b: { sStart: Date; sEnd: Date }) => start < b.sEnd && end > b.sStart)
    }).length

    const freeCount = candidates.length - bookedCount
    return { dayKey, bookedCount, freeCount }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-green-700">Schedule</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Free slots (selectable) are shown below. Booked sessions are visible in the calendar colors.
            {hasAvailabilityRules
              ? ` Slots follow your weekly availability (${timezone}).`
              : ' Using default hours — set weekly availability for precise control.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={'/teach/availability' as '/'}>Edit availability</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={'/teach' as '/'}>Back to Today</Link>
          </Button>
        </div>
      </div>

      {/* Simple monthly calendar */}
      <div className="rounded-xl border border-cream-300 bg-cream-50 p-4">
        <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="px-1 py-1 font-medium">
              {d}
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2">
          {dayCells.map((day) => {
            const meta = dayCellMeta(day)
            const isSelected = meta.dayKey === selectedDayKey
            const isInMonth = day.getUTCMonth() === now.getUTCMonth()
            const cellTone =
              meta.bookedCount > 0 ? 'border-danger-300 bg-danger-50/60' : meta.freeCount > 0 ? 'border-cream-300 bg-green-50/60' : 'border-cream-200 bg-cream-50'

            return (
              <Link
                key={meta.dayKey}
                href={`/teach/schedule?day=${meta.dayKey}` as '/'}
                className={`min-h-[86px] rounded-lg border p-2 transition ${
                  isSelected ? 'ring-2 ring-green-700' : ''
                } ${cellTone} ${!isInMonth ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium text-green-700">{Number(day.getUTCDate())}</span>
                  {meta.bookedCount > 0 ? (
                    <span className="rounded bg-danger-100 px-2 py-0.5 text-[10px] font-semibold text-danger-600">
                      {meta.bookedCount} booked
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  {meta.freeCount > 0 ? `${meta.freeCount} free` : 'No free'}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {searchParams.error === 'meet_link_required' ? (
        <p className="rounded-lg border border-warning-300 bg-warning-50 px-3 py-2 text-sm text-warning-700">
          Paste a Meet link (https://…) before approving a booking.
        </p>
      ) : null}
      {searchParams.error === 'not_ended' ? (
        <p className="rounded-lg border border-warning-300 bg-warning-50 px-3 py-2 text-sm text-warning-700">
          You can mark a session as happened after the scheduled end time.
        </p>
      ) : null}

      {/* Session actions */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          {actionableSessions.length === 0 ? (
            <div className="rounded-xl border border-cream-300 bg-cream-50 p-6 text-sm text-muted-foreground">
              No pending or active sessions. Completed and cancelled sessions are cleared from this list.
            </div>
          ) : (
            actionableSessions.map((s) => {
              const pending = isPendingApproval(s)
              const needsConfirm = needsHappenedConfirmation(s)
              const upcoming = isConfirmedUpcoming(s)
              return (
              <div key={s.id} className="rounded-xl border border-cream-300 bg-cream-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Student</p>
                    <p className="mt-1 font-semibold text-green-700">{studentMap.get(s.student_id) ?? '—'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Current time: {new Date(s.scheduled_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs uppercase text-muted-foreground">
                    {pending ? 'Pending' : needsConfirm ? 'Confirm' : 'Scheduled'}
                  </span>
                </div>

                {s.student_note ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Student note: <span className="font-medium">{s.student_note}</span>
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {upcoming && s.meet_link ? (
                    <Button asChild size="sm">
                      <a href={s.meet_link} target="_blank" rel="noopener noreferrer">
                        Join Meet
                      </a>
                    </Button>
                  ) : null}
                  {needsConfirm ? (
                    <form action={markSessionHappenedAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <Button type="submit" size="sm">
                        Mark as happened
                      </Button>
                    </form>
                  ) : null}
                  {!needsConfirm ? (
                    <form action={teacherCancelSessionAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={s.id} />
                      <Input name="note" placeholder="Cancel reason" className="h-8 w-40" />
                      <Button type="submit" size="sm" variant="outline">
                        Cancel
                      </Button>
                    </form>
                  ) : null}
                </div>

                {pending ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <form action={teacherApproveSessionAction} className="space-y-2 rounded-lg border border-cream-300 bg-cream-100/50 p-3">
                    <input type="hidden" name="id" value={s.id} />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Google Meet link</p>
                      <Input
                        name="meetLink"
                        placeholder="https://meet.google.com/abc-defg-hij"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Approval note</p>
                      <Input name="note" placeholder="e.g. Exam prep check" className="mt-1" />
                    </div>
                    <Button type="submit" size="sm">
                      Approve &amp; add Meet
                    </Button>
                  </form>

                  <form
                    action={teacherProposeSessionAction}
                    className="space-y-2 rounded-lg border border-cream-300 bg-cream-100/50 p-3"
                  >
                    <input type="hidden" name="id" value={s.id} />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Propose time span</p>
                      {freeSlotsOfDay.length === 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">No free slots on selected day.</p>
                      ) : (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <label className="space-y-1">
                            <span className="text-[11px] text-muted-foreground">From</span>
                            <select name="proposedFromAt" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                              {freeSlotsOfDay.map((slot) => (
                                <option key={slot.iso} value={slot.iso}>
                                  {slot.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="space-y-1">
                            <span className="text-[11px] text-muted-foreground">To</span>
                            <select name="proposedToAt" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                              {freeSlotsOfDay.map((slot) => (
                                <option key={slot.iso} value={slot.iso}>
                                  {slot.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Reason</p>
                      <Textarea name="note" rows={2} placeholder="e.g. I am free between these times for examination prep" className="mt-1" />
                    </div>
                    <Button type="submit" size="sm" variant="outline" disabled={freeSlotsOfDay.length === 0}>
                      Propose time
                    </Button>
                  </form>
                </div>
                ) : null}

                {/* Student schedule context */}
                <div className="mt-4 rounded-lg border border-cream-300 bg-cream-50 p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Student schedule (next 7 days)</p>
                  <div className="mt-2 space-y-2">
                    {(studentScheduleMap.get(s.student_id) ?? []).slice(0, 6).map((ss: any) => (
                      <div key={ss.id} className="flex items-center justify-between gap-3 rounded-md border border-cream-300 bg-cream-100/50 px-2 py-1 text-xs">
                        <span>{new Date(ss.scheduled_at).toLocaleString()}</span>
                        <span className="text-muted-foreground">Booked</span>
                      </div>
                    ))}
                    {(studentScheduleMap.get(s.student_id) ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground mt-2">No scheduled sessions for this student in the next 7 days.</p>
                    ) : null}
                  </div>
                </div>
              </div>
            )})
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-cream-300 bg-cream-50 p-5">
            <h2 className="font-semibold text-green-700">Free slots on {selectedDay.toLocaleDateString()}</h2>
            {freeSlotsOfDay.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No free slots in these time blocks.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {freeSlotsOfDay.map((slot) => (
                  <div key={slot.iso} className="rounded-lg border border-cream-300 bg-green-50/60 px-3 py-2 text-sm">
                    {slot.label}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Only free slots are selectable for “Propose time”.
            </p>
          </div>

          <div className="rounded-xl border border-cream-300 bg-cream-50 p-5">
            <h2 className="font-semibold text-green-700">Legend</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <span className="size-3 rounded-full bg-green-200" />
                  Free
                </span>
                <span className="text-xs text-muted-foreground">Selectable</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <span className="size-3 rounded-full bg-red-200" />
                  Booked
                </span>
                <span className="text-xs text-muted-foreground">Not selectable</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

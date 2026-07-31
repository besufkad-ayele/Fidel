import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminDb } from '@/lib/admin/db'
import { getCurrentProfile } from '@/lib/auth/session'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { civilDateInTimezone, slotsForHorizon } from '@/lib/domain/availability'
import {
  BookingCalendar,
  type BookingDayColumn,
} from '@/components/features/learn/booking-calendar'

export const metadata: Metadata = { title: 'Book a session' }

export default async function Page({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ teacherId?: string; error?: string }>
}) {
  const searchParams = await searchParamsPromise
  const profile = await getCurrentProfile()
  if (!profile) return null

  const db = createAdminDb()
  const { data: assignments } = await db
    .from('student_teacher_assignments')
    .select('teacher_id, is_primary')
    .eq('student_id', profile.id)
    .order('is_primary', { ascending: false })
  const teacherIds = (assignments ?? []).map((a: { teacher_id: string }) => a.teacher_id)
  const { data: teachers } = teacherIds.length
    ? await db.from('profiles').select('id, full_name, email, timezone').in('id', teacherIds).eq('is_active', true)
    : { data: [] as { id: string; full_name: string; email: string; timezone: string }[] }

  const selectedTeacherId =
    (searchParams?.teacherId && teacherIds.includes(searchParams.teacherId) ? searchParams.teacherId : null) ??
    (teacherIds[0] ?? null)

  if (!selectedTeacherId) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl text-green-700">Book a session</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don't have a teacher assigned yet. Ask your administrator to assign one.
        </p>
      </div>
    )
  }

  const selectedTeacher = (teachers ?? []).find((t) => t.id === selectedTeacherId)
  const teacherTimezone = selectedTeacher?.timezone || 'Africa/Addis_Ababa'
  const displayTimezone = profile.timezone || teacherTimezone
  const locale = profile.locale || 'en'
  const now = new Date()
  const horizonEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [{ data: availability }, { data: timeOff }, { data: teacherSessions }] = await Promise.all([
    db
      .from('teacher_availability')
      .select('id, weekday, start_time, end_time, timezone, is_active')
      .eq('teacher_id', selectedTeacherId)
      .eq('is_active', true),
    db
      .from('teacher_time_off')
      .select('id, starts_at, ends_at, reason')
      .eq('teacher_id', selectedTeacherId)
      .gte('ends_at', now.toISOString())
      .lte('starts_at', horizonEnd.toISOString()),
    db
      .from('sessions')
      .select('scheduled_at, duration_minutes, student_note')
      .eq('teacher_id', selectedTeacherId)
      .eq('status', 'scheduled')
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', horizonEnd.toISOString())
      .order('scheduled_at', { ascending: true }),
  ])

  const hasAvailabilityRules = (availability ?? []).length > 0

  const openIsos = slotsForHorizon({
    from: now,
    days: 7,
    timezone: teacherTimezone,
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

  const booked = (teacherSessions ?? []).map(
    (s: { scheduled_at: string; duration_minutes: number }) => ({
      start: new Date(s.scheduled_at),
      end: new Date(new Date(s.scheduled_at).getTime() + s.duration_minutes * 60 * 1000),
      iso: s.scheduled_at,
    }),
  )

  const isFree = (iso: string) => {
    const start = new Date(iso)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    return !booked.some((b) => start < b.end && end > b.start)
  }

  const timeLabel = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: displayTimezone,
    }).format(new Date(iso))

  const days: BookingDayColumn[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
    const key = civilDateInTimezone(day, displayTimezone)
    const weekdayLabel = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      timeZone: displayTimezone,
    }).format(day)
    const dateLabel = new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      timeZone: displayTimezone,
    }).format(day)

    const dayOpen = openIsos
      .filter((iso) => civilDateInTimezone(new Date(iso), displayTimezone) === key)
      .map((iso) => ({
        iso,
        timeLabel: timeLabel(iso),
        status: (isFree(iso) ? 'free' : 'booked') as 'free' | 'booked',
      }))

    // Include booked sessions that fall on this day even if outside open hours
    const openSet = new Set(dayOpen.map((s) => s.iso))
    for (const b of booked) {
      if (civilDateInTimezone(b.start, displayTimezone) !== key) continue
      if (openSet.has(b.iso)) continue
      dayOpen.push({
        iso: b.iso,
        timeLabel: timeLabel(b.iso),
        status: 'booked',
      })
    }

    dayOpen.sort((a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime())

    days.push({ key, weekdayLabel, dateLabel, slots: dayOpen })
  }

  const error = searchParams?.error
  const teacherName = selectedTeacher?.full_name || selectedTeacher?.email || 'Teacher'
  const timezoneNote = hasAvailabilityRules
    ? `Open times from their weekly availability · shown in ${displayTimezone}`
    : `Default open hours (teacher has not set weekly availability yet) · shown in ${displayTimezone}`

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-green-700">Book a session</h1>
        <p className="text-sm text-muted-foreground">
          Choose an open card on the next-7-days calendar. Your teacher sets these hours from their
          availability page.
        </p>
      </div>

      {error === 'slot_taken' ? (
        <div className="rounded-lg border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-500">
          That time was just taken. Please choose another free slot.
        </div>
      ) : null}
      {error === 'outside_availability' ? (
        <div className="rounded-lg border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-500">
          That time is outside your teacher&apos;s availability. Please choose another free slot.
        </div>
      ) : null}
      {error === 'booking_failed' ? (
        <div className="rounded-lg border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-500">
          Booking failed. Please try again.
        </div>
      ) : null}
      {error === 'invalid_time' ? (
        <div className="rounded-lg border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-500">
          Invalid time selected. Please refresh.
        </div>
      ) : null}

      {(teachers ?? []).length > 1 ? (
        <form method="get" className="rounded-xl border border-cream-300 bg-cream-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <Label htmlFor="teacherId">Teacher</Label>
              <select
                id="teacherId"
                name="teacherId"
                className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue={selectedTeacherId}
              >
                {(teachers ?? []).map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name || teacher.email}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="outline">
              Show calendar
            </Button>
          </div>
        </form>
      ) : null}

      <BookingCalendar
        teacherId={selectedTeacherId}
        teacherName={teacherName}
        timezoneNote={timezoneNote}
        days={days}
      />
    </div>
  )
}

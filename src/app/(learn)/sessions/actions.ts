'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAuth, requireRole } from '@/lib/auth/guards'
import { createAdminDb, writeAudit } from '@/lib/admin/db'
import { getCurrentProfile } from '@/lib/auth/session'
import { isOpenSlot } from '@/lib/domain/availability'
import { normalizeMeetLink, sessionHasEnded } from '@/lib/domain/sessions'

function nowIso() {
  return new Date().toISOString()
}

function revalidateSessionPaths() {
  revalidatePath('/sessions')
  revalidatePath('/sessions/book')
  revalidatePath('/dashboard')
  revalidatePath('/teach')
  revalidatePath('/teach/schedule')
  revalidatePath('/admin/sessions')
}

export async function bookSessionAction(formData: FormData): Promise<void> {
  const { user, profile } = await requireRole('student')
  const teacherId = String(formData.get('teacherId') ?? '')
  const scheduledAt = String(formData.get('scheduledAt') ?? '')
  const note = String(formData.get('note') ?? '').trim() || null
  if (!teacherId || !scheduledAt) throw new Error('Teacher and time are required')

  const start = new Date(scheduledAt)
  if (Number.isNaN(start.getTime())) redirect(`/sessions/book?error=invalid_time`)
  if (start.getTime() < Date.now()) redirect(`/sessions/book?error=invalid_time`)
  const durationMinutes = 60
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)

  const db = createAdminDb()

  const [{ data: teacherProfile }, { data: availability }, { data: timeOff }] = await Promise.all([
    db.from('profiles').select('timezone').eq('id', teacherId).maybeSingle(),
    db
      .from('teacher_availability')
      .select('weekday, start_time, end_time, timezone, is_active')
      .eq('teacher_id', teacherId)
      .eq('is_active', true),
    db
      .from('teacher_time_off')
      .select('starts_at, ends_at, reason')
      .eq('teacher_id', teacherId)
      .lt('starts_at', end.toISOString())
      .gt('ends_at', start.toISOString()),
  ])

  const teacherTimezone = teacherProfile?.timezone || 'Africa/Addis_Ababa'
  const withinAvailability = isOpenSlot({
    scheduledAt: start.toISOString(),
    timezone: teacherTimezone,
    blocks: (availability ?? []).map(
      (b: {
        weekday: number
        start_time: string
        end_time: string
        timezone: string
        is_active: boolean
      }) => ({
        weekday: b.weekday,
        start_time: b.start_time,
        end_time: b.end_time,
        timezone: b.timezone,
        is_active: b.is_active,
      }),
    ),
    timeOff: (timeOff ?? []).map(
      (t: { starts_at: string; ends_at: string; reason: string | null }) => ({
        starts_at: t.starts_at,
        ends_at: t.ends_at,
        reason: t.reason,
      }),
    ),
    durationMinutes,
  })
  if (!withinAvailability) redirect(`/sessions/book?error=outside_availability&teacherId=${teacherId}`)

  // Prevent double-booking even if the UI was stale.
  const { data: conflicts } = await db
    .from('sessions')
    .select('id, scheduled_at, duration_minutes')
    .eq('teacher_id', teacherId)
    .in('status', ['pending', 'scheduled'])
    .gte('scheduled_at', new Date(start.getTime() - durationMinutes * 60 * 1000).toISOString())
    .lte('scheduled_at', end.toISOString())

  const overlaps = (conflicts ?? []).some((s: { scheduled_at: string; duration_minutes: number }) => {
    const sStart = new Date(s.scheduled_at)
    const sEnd = new Date(sStart.getTime() + s.duration_minutes * 60 * 1000)
    return start < sEnd && end > sStart
  })

  if (overlaps) redirect(`/sessions/book?error=slot_taken&teacherId=${teacherId}`)

  try {
    const { error } = await db.from('sessions').insert({
      student_id: user.id,
      teacher_id: teacherId,
      scheduled_at: start.toISOString(),
      duration_minutes: durationMinutes,
      student_timezone: profile.timezone || 'Africa/Addis_Ababa',
      status: 'pending',
      student_note: note,
      session_notes: null,
      meet_link: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    })
    if (error) throw new Error(error.message)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Booking failed'
    console.error('[bookSessionAction] failed', msg)
    redirect(`/sessions/book?error=booking_failed&teacherId=${teacherId}`)
  }

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'session.book',
    entityType: 'session',
    entityId: `${user.id}:${scheduledAt}`,
    metadata: { teacherId },
  })

  revalidateSessionPaths()
  redirect('/sessions')
}

export async function cancelStudentSessionAction(formData: FormData): Promise<void> {
  const { user, profile } = await requireRole('student')
  const id = String(formData.get('id') ?? '')
  const reason = String(formData.get('reason') ?? '').trim() || 'Cancelled by student'
  if (!id) return
  const db = createAdminDb()

  const { error } = await db
    .from('sessions')
    .update({
      status: 'cancelled',
      cancelled_by: user.id,
      cancelled_at: nowIso(),
      cancellation_reason: reason,
      session_notes: reason,
      updated_at: nowIso(),
    })
    .eq('id', id)
    .eq('student_id', user.id)
    .in('status', ['pending', 'scheduled'])
  if (error) throw new Error(error.message)

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'session.cancel',
    entityType: 'session',
    entityId: id,
    metadata: { reason, by: 'student' },
  })

  revalidateSessionPaths()
}

export async function teacherApproveSessionAction(formData: FormData): Promise<void> {
  const { user, profile } = await requireRole('teacher')
  const id = String(formData.get('id') ?? '')
  const note = String(formData.get('note') ?? '').trim()
  const meetLink = normalizeMeetLink(String(formData.get('meetLink') ?? ''))
  if (!id) return
  if (!meetLink) {
    redirect(`/teach/schedule?error=meet_link_required&session=${id}`)
  }

  const db = createAdminDb()

  const { data: existing, error: loadError } = await db
    .from('sessions')
    .select('id, status')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .maybeSingle()
  if (loadError) throw new Error(loadError.message)
  if (!existing || existing.status !== 'pending') {
    redirect(`/teach/schedule?error=not_pending&session=${id}`)
  }

  const { error } = await db
    .from('sessions')
    .update({
      status: 'scheduled',
      meet_link: meetLink,
      session_notes: note ? `Approved: ${note}` : 'Approved by teacher',
      updated_at: nowIso(),
    })
    .eq('id', id)
    .eq('teacher_id', user.id)
    .eq('status', 'pending')
  if (error) throw new Error(error.message)

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'session.approve',
    entityType: 'session',
    entityId: id,
    metadata: { meetLink },
  })
  revalidateSessionPaths()
}

export async function teacherProposeSessionAction(formData: FormData): Promise<void> {
  const { user, profile } = await requireRole('teacher')
  const id = String(formData.get('id') ?? '')
  const proposedAtLegacy = String(formData.get('proposedAt') ?? '')
  const proposedFromAt = String(formData.get('proposedFromAt') ?? '')
  const proposedToAt = String(formData.get('proposedToAt') ?? '')
  const note = String(formData.get('note') ?? '').trim()

  const proposedFromIso = proposedFromAt || proposedAtLegacy
  if (!id || !proposedFromIso) throw new Error('New time is required')
  const db = createAdminDb()

  const from = new Date(proposedFromIso)
  if (Number.isNaN(from.getTime())) throw new Error('Invalid proposedFromAt')

  const to = proposedToAt ? new Date(proposedToAt) : new Date(from.getTime() + 60 * 60 * 1000)
  const toIso = Number.isNaN(to.getTime())
    ? new Date(from.getTime() + 60 * 60 * 1000).toISOString()
    : to.toISOString()

  const { error } = await db
    .from('sessions')
    .update({
      scheduled_at: from.toISOString(),
      // Keep pending until teacher also attaches a Meet link via Approve.
      status: 'pending',
      meet_link: null,
      session_notes: note
        ? `Teacher proposed time window: ${from.toISOString()} → ${toIso}. Note: ${note}`
        : `Teacher proposed time window: ${from.toISOString()} → ${toIso}`,
      updated_at: nowIso(),
    })
    .eq('id', id)
    .eq('teacher_id', user.id)
    .in('status', ['pending', 'scheduled'])
  if (error) throw new Error(error.message)

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'session.propose_time',
    entityType: 'session',
    entityId: id,
    metadata: { proposedFromAt: from.toISOString(), proposedToAt: toIso },
  })
  revalidateSessionPaths()
}

export async function teacherCancelSessionAction(formData: FormData): Promise<void> {
  const { user, profile } = await requireRole('teacher')
  const id = String(formData.get('id') ?? '')
  const note = String(formData.get('note') ?? '').trim() || 'Cancelled by teacher'
  if (!id) return
  const db = createAdminDb()

  const { error } = await db
    .from('sessions')
    .update({
      status: 'cancelled',
      cancelled_by: user.id,
      cancelled_at: nowIso(),
      cancellation_reason: note,
      session_notes: note,
      updated_at: nowIso(),
    })
    .eq('id', id)
    .eq('teacher_id', user.id)
    .in('status', ['pending', 'scheduled'])
  if (error) throw new Error(error.message)

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'session.cancel',
    entityType: 'session',
    entityId: id,
    metadata: { by: 'teacher', note },
  })
  revalidateSessionPaths()
}

export async function markSessionHappenedAction(formData: FormData): Promise<void> {
  const user = await requireAuth()
  const profile = await getCurrentProfile()
  if (!profile || !profile.is_active) redirect('/login')
  if (profile.role !== 'student' && profile.role !== 'teacher') redirect('/login')

  const id = String(formData.get('id') ?? '')
  if (!id) return

  const db = createAdminDb()
  const { data: session, error: loadError } = await db
    .from('sessions')
    .select('id, student_id, teacher_id, scheduled_at, duration_minutes, status')
    .eq('id', id)
    .maybeSingle()
  if (loadError) throw new Error(loadError.message)
  if (!session || session.status !== 'scheduled') return

  const isOwner =
    (profile.role === 'student' && session.student_id === user.id) ||
    (profile.role === 'teacher' && session.teacher_id === user.id)
  if (!isOwner) return

  if (!sessionHasEnded(session)) {
    if (profile.role === 'teacher') {
      redirect(`/teach/schedule?error=not_ended&session=${id}`)
    }
    redirect(`/sessions?error=not_ended&session=${id}`)
  }

  const { error } = await db
    .from('sessions')
    .update({
      status: 'completed',
      attended: true,
      updated_at: nowIso(),
    })
    .eq('id', id)
    .eq('status', 'scheduled')
  if (error) throw new Error(error.message)

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'session.complete',
    entityType: 'session',
    entityId: id,
    metadata: { by: profile.role },
  })

  revalidateSessionPaths()
}

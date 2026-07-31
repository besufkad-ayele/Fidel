'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/guards'
import { createAdminDb, writeAudit } from '@/lib/admin/db'
import { isOpenSlot } from '@/lib/domain/availability'

function nowIso() {
  return new Date().toISOString()
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

  const db = await createAdminDb()

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
    durationMinutes,
  })
  if (!withinAvailability) redirect(`/sessions/book?error=outside_availability&teacherId=${teacherId}`)

  // Prevent double-booking even if the UI was stale.
  const { data: conflicts } = await db
    .from('sessions')
    .select('id, scheduled_at, duration_minutes')
    .eq('teacher_id', teacherId)
    .eq('status', 'scheduled')
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
      status: 'scheduled',
      student_note: note,
      session_notes: 'Pending teacher confirmation',
      created_at: nowIso(),
      updated_at: nowIso(),
    })
    if (error) throw new Error(error.message)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Booking failed'
    // Keep user-facing error stable; details go to server console.
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

  revalidatePath('/sessions')
  revalidatePath('/sessions/book')
  revalidatePath('/teach')
  revalidatePath('/teach/schedule')
  redirect('/sessions')
}

export async function cancelStudentSessionAction(formData: FormData): Promise<void> {
  const { user, profile } = await requireRole('student')
  const id = String(formData.get('id') ?? '')
  const reason = String(formData.get('reason') ?? '').trim() || 'Cancelled by student'
  if (!id) return
  const db = await createAdminDb()

  const { error } = await db
    .from('sessions')
    .update({
      status: 'cancelled',
      session_notes: reason,
      updated_at: nowIso(),
    })
    .eq('id', id)
    .eq('student_id', user.id)
  if (error) throw new Error(error.message)

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'session.cancel',
    entityType: 'session',
    entityId: id,
    metadata: { reason, by: 'student' },
  })

  revalidatePath('/sessions')
  revalidatePath('/teach')
  revalidatePath('/admin/sessions')
}

export async function teacherApproveSessionAction(formData: FormData): Promise<void> {
  const { user, profile } = await requireRole('teacher')
  const id = String(formData.get('id') ?? '')
  const note = String(formData.get('note') ?? '').trim()
  if (!id) return
  const db = await createAdminDb()

  const { error } = await db
    .from('sessions')
    .update({
      status: 'scheduled',
      session_notes: note ? `Approved: ${note}` : 'Approved by teacher',
      updated_at: nowIso(),
    })
    .eq('id', id)
    .eq('teacher_id', user.id)
  if (error) throw new Error(error.message)

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'session.approve',
    entityType: 'session',
    entityId: id,
  })
  revalidatePath('/teach')
  revalidatePath('/sessions')
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
  const db = await createAdminDb()

  const from = new Date(proposedFromIso)
  if (Number.isNaN(from.getTime())) throw new Error('Invalid proposedFromAt')

  const to = proposedToAt ? new Date(proposedToAt) : new Date(from.getTime() + 60 * 60 * 1000)
  const toIso = Number.isNaN(to.getTime()) ? new Date(from.getTime() + 60 * 60 * 1000).toISOString() : to.toISOString()

  const { error } = await db
    .from('sessions')
    .update({
      scheduled_at: from.toISOString(),
      status: 'scheduled',
      session_notes: note
        ? `Teacher proposed time window: ${from.toISOString()} → ${toIso}. Note: ${note}`
        : `Teacher proposed time window: ${from.toISOString()} → ${toIso}`,
      updated_at: nowIso(),
    })
    .eq('id', id)
    .eq('teacher_id', user.id)
  if (error) throw new Error(error.message)

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'session.propose_time',
    entityType: 'session',
    entityId: id,
    metadata: { proposedFromAt: from.toISOString(), proposedToAt: toIso },
  })
  revalidatePath('/teach')
  revalidatePath('/sessions')
}

export async function teacherCancelSessionAction(formData: FormData): Promise<void> {
  const { user, profile } = await requireRole('teacher')
  const id = String(formData.get('id') ?? '')
  const note = String(formData.get('note') ?? '').trim() || 'Cancelled by teacher'
  if (!id) return
  const db = await createAdminDb()

  const { error } = await db
    .from('sessions')
    .update({
      status: 'cancelled',
      session_notes: note,
      updated_at: nowIso(),
    })
    .eq('id', id)
    .eq('teacher_id', user.id)
  if (error) throw new Error(error.message)

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'session.cancel',
    entityType: 'session',
    entityId: id,
    metadata: { by: 'teacher', note },
  })
  revalidatePath('/teach')
  revalidatePath('/sessions')
  revalidatePath('/admin/sessions')
}

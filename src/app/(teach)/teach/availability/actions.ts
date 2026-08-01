'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { createAdminDb } from '@/lib/admin/db'
import {
  normalizeTime,
  rangesOverlap,
  sessionInsideBlock,
  validateBlock,
} from '@/lib/domain/availability'

export type AvailabilityActionResult = {
  ok: boolean
  error?: string
  warning?: string
}

function revalidateAvailability() {
  revalidatePath('/teach/availability')
  revalidatePath('/teach/schedule')
  revalidatePath('/teach')
  revalidatePath('/sessions/book')
}

export async function saveAvailabilityBlockAction(input: {
  id?: string
  weekday: number
  startTime: string
  endTime: string
  timezone: string
}): Promise<AvailabilityActionResult> {
  const { user } = await requireRole('teacher')
  const validation = validateBlock({
    weekday: input.weekday,
    start_time: input.startTime,
    end_time: input.endTime,
  })
  if (validation) return { ok: false, error: validation }

  let start: string
  let end: string
  try {
    start = normalizeTime(input.startTime)
    end = normalizeTime(input.endTime)
  } catch {
    return { ok: false, error: 'Use times like 09:00' }
  }

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('teacher_availability')
    .select('id, weekday, start_time, end_time')
    .eq('teacher_id', user.id)
    .eq('weekday', input.weekday)
    .eq('is_active', true)

  const overlap = (existing ?? []).some((row) => {
    if (input.id && row.id === input.id) return false
    return rangesOverlap(start, end, row.start_time, row.end_time)
  })
  if (overlap) return { ok: false, error: 'This overlaps another block on that day' }

  if (input.id) {
    const { error } = await supabase
      .from('teacher_availability')
      .update({
        weekday: input.weekday,
        start_time: start,
        end_time: end,
        timezone: input.timezone || 'Africa/Addis_Ababa',
        is_active: true,
      })
      .eq('id', input.id)
      .eq('teacher_id', user.id)
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await supabase.from('teacher_availability').insert({
      teacher_id: user.id,
      weekday: input.weekday,
      start_time: start,
      end_time: end,
      timezone: input.timezone || 'Africa/Addis_Ababa',
      is_active: true,
    })
    if (error) return { ok: false, error: error.message }
  }

  revalidateAvailability()
  return { ok: true }
}

export async function removeAvailabilityBlockAction(input: {
  id: string
  force?: boolean
}): Promise<AvailabilityActionResult> {
  const { user, profile } = await requireRole('teacher')
  const supabase = await createClient()

  const { data: block } = await supabase
    .from('teacher_availability')
    .select('id, weekday, start_time, end_time, timezone, is_active')
    .eq('id', input.id)
    .eq('teacher_id', user.id)
    .maybeSingle()

  if (!block) return { ok: false, error: 'Block not found' }

  const timezone = block.timezone || profile.timezone || 'Africa/Addis_Ababa'
  const now = new Date()
  const horizon = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

  // Sessions live outside the hand-maintained Database types for now.
  const db = createAdminDb()
  const { data: booked } = await db
    .from('sessions')
    .select('id, scheduled_at, duration_minutes')
    .eq('teacher_id', user.id)
    .in('status', ['pending', 'scheduled'])
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', horizon.toISOString())

  const conflicts = (
    (booked ?? []) as Array<{ id: string; scheduled_at: string; duration_minutes: number }>
  ).filter((s) =>
    sessionInsideBlock({
      scheduledAt: s.scheduled_at,
      durationMinutes: s.duration_minutes ?? 60,
      block: {
        weekday: block.weekday,
        start_time: block.start_time,
        end_time: block.end_time,
        timezone,
      },
      timezone,
    }),
  )

  if (conflicts.length > 0 && !input.force) {
    return {
      ok: false,
      error: `${conflicts.length} upcoming session(s) sit in this block. Confirm to remove anyway — bookings stay unless you cancel them separately.`,
      warning: 'has_bookings',
    }
  }

  const { error } = await supabase
    .from('teacher_availability')
    .delete()
    .eq('id', input.id)
    .eq('teacher_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidateAvailability()
  return {
    ok: true,
    warning:
      conflicts.length > 0
        ? `Removed the block. ${conflicts.length} existing booking(s) were left unchanged.`
        : undefined,
  }
}

export async function updateTeachingTimezoneAction(timezone: string): Promise<AvailabilityActionResult> {
  const { user } = await requireRole('teacher')
  if (!timezone.trim()) return { ok: false, error: 'Timezone is required' }

  const supabase = await createClient()
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ timezone: timezone.trim() })
    .eq('id', user.id)
  if (profileErr) return { ok: false, error: profileErr.message }

  await supabase
    .from('teacher_availability')
    .update({ timezone: timezone.trim() })
    .eq('teacher_id', user.id)

  revalidateAvailability()
  return { ok: true }
}

export async function addTimeOffAction(input: {
  startsAt: string
  endsAt: string
  reason?: string
}): Promise<AvailabilityActionResult> {
  const { user } = await requireRole('teacher')
  const starts = new Date(input.startsAt)
  const ends = new Date(input.endsAt)
  if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) {
    return { ok: false, error: 'Invalid dates' }
  }
  if (ends <= starts) return { ok: false, error: 'End must be after start' }

  const supabase = await createClient()
  const { error } = await supabase.from('teacher_time_off').insert({
    teacher_id: user.id,
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    reason: input.reason?.trim() || null,
  })
  if (error) return { ok: false, error: error.message }

  revalidateAvailability()
  return { ok: true }
}

export async function removeTimeOffAction(id: string): Promise<AvailabilityActionResult> {
  const { user } = await requireRole('teacher')
  const supabase = await createClient()
  const { error } = await supabase
    .from('teacher_time_off')
    .delete()
    .eq('id', id)
    .eq('teacher_id', user.id)
  if (error) return { ok: false, error: error.message }

  revalidateAvailability()
  return { ok: true }
}

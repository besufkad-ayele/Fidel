'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'

const PARTS = new Set(['cultural_insight', 'language_lesson', 'practice'] as const)
type LessonPart = 'cultural_insight' | 'language_lesson' | 'practice'

export async function completeUnitPartAction(formData: FormData): Promise<void> {
  const { user } = await requireRole('student')
  const unitId = String(formData.get('unitId') ?? '').trim()
  const part = String(formData.get('part') ?? '').trim() as LessonPart
  const levelSlug = String(formData.get('levelSlug') ?? '').trim()
  const unitSlug = String(formData.get('unitSlug') ?? '').trim()

  if (!unitId || !PARTS.has(part)) {
    throw new Error('Missing unit or part')
  }

  const supabase = await createClient()
  const now = new Date().toISOString()

  // Keep unit rollup in sync without wiping homework / quiz / live scores.
  const { data: unitRow } = await supabase
    .from('student_unit_progress')
    .select('id, practice_passed, started_at, completed_at')
    .eq('student_id', user.id)
    .eq('unit_id', unitId)
    .maybeSingle()

  if (part === 'practice') {
    if (unitRow) {
      const { error } = await supabase
        .from('student_unit_progress')
        .update({
          practice_passed: true,
          self_paced_status: 'completed',
          completed_at: unitRow.completed_at ?? now,
          updated_at: now,
        })
        .eq('id', unitRow.id)
      if (error) {
        console.error('[completeUnitPartAction] unit update', error.message)
        if (!/practice_passed/i.test(error.message)) throw new Error(error.message)
      }
    } else {
      const { error } = await supabase.from('student_unit_progress').insert({
        student_id: user.id,
        unit_id: unitId,
        practice_passed: true,
        self_paced_status: 'completed',
        started_at: now,
        completed_at: now,
        updated_at: now,
      })
      if (error) {
        console.error('[completeUnitPartAction] unit insert', error.message)
        if (!/practice_passed/i.test(error.message)) throw new Error(error.message)
      }
    }
  } else if (!unitRow) {
    await supabase.from('student_unit_progress').insert({
      student_id: user.id,
      unit_id: unitId,
      self_paced_status: 'in_progress',
      started_at: now,
      updated_at: now,
    })
  } else if (unitRow.practice_passed !== true) {
    await supabase
      .from('student_unit_progress')
      .update({
        self_paced_status: 'in_progress',
        updated_at: now,
      })
      .eq('id', unitRow.id)
  }

  // Best effort part_progress write. If DB trigger has enum-cast bug, don't block students.
  const { data: existingPart } = await supabase
    .from('part_progress')
    .select('id, first_viewed_at')
    .eq('student_id', user.id)
    .eq('unit_id', unitId)
    .eq('part', part)
    .maybeSingle()

  if (existingPart) {
    const { error } = await supabase
      .from('part_progress')
      .update({
        status: 'completed',
        progress_pct: 100,
        completed_at: now,
        updated_at: now,
      })
      .eq('id', existingPart.id)
    if (error) {
      console.error('[completeUnitPartAction] part_progress update', error.message)
      if (!/self_paced_status.*type text|expression is of type text/i.test(error.message)) {
        throw new Error(error.message)
      }
    }
  } else {
    const { error } = await supabase.from('part_progress').insert({
      student_id: user.id,
      unit_id: unitId,
      part,
      status: 'completed',
      progress_pct: 100,
      first_viewed_at: now,
      completed_at: now,
      updated_at: now,
    })
    if (error) {
      console.error('[completeUnitPartAction] part_progress insert', error.message)
      if (!/self_paced_status.*type text|expression is of type text/i.test(error.message)) {
        throw new Error(error.message)
      }
    }
  }

  if (levelSlug && unitSlug) {
    const routePart =
      part === 'cultural_insight' ? 'culture' : part === 'language_lesson' ? 'lesson' : 'practice'
    revalidatePath(`/levels/${levelSlug}/units/${unitSlug}/${routePart}`)
  }
  revalidatePath('/progress')
  revalidatePath('/dashboard')
  revalidatePath('/levels')
  if (levelSlug) revalidatePath(`/levels/${levelSlug}`)
}

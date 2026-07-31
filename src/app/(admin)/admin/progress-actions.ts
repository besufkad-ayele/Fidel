'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/guards'
import { createAdminDb, writeAudit } from '@/lib/admin/db'

function parseOptionalScore(raw: FormDataEntryValue | null): number | null {
  if (raw == null) return null
  const text = String(raw).trim()
  if (text === '') return null
  const n = Number(text)
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    throw new Error('Scores must be blank or a number from 0 to 100')
  }
  return Math.round(n * 100) / 100
}

export async function upsertUnitGradeAction(formData: FormData): Promise<void> {
  const { user, profile } = await requireRole('admin')
  const studentId = String(formData.get('studentId') ?? '')
  const unitId = String(formData.get('unitId') ?? '')
  if (!studentId || !unitId) throw new Error('Missing student or unit')

  const practiceRaw = formData.get('practicePassed')
  const practicePassed = practiceRaw === 'on' || practiceRaw === 'true' || practiceRaw === '1'

  const homeworkScore = parseOptionalScore(formData.get('homeworkScore'))
  const quizScore = parseOptionalScore(formData.get('quizScore'))
  const liveAssessmentScore = parseOptionalScore(formData.get('liveAssessmentScore'))
  const gradeNotes = String(formData.get('gradeNotes') ?? '').trim() || null

  const db = createAdminDb()
  const now = new Date().toISOString()

  const { data: existing } = await db
    .from('student_unit_progress')
    .select('live_status, completed_at, self_paced_status')
    .eq('student_id', studentId)
    .eq('unit_id', unitId)
    .maybeSingle()

  const payload = {
    student_id: studentId,
    unit_id: unitId,
    practice_passed: practicePassed,
    homework_score: homeworkScore,
    best_quiz_percentage: quizScore,
    live_assessment_score: liveAssessmentScore,
    grade_notes: gradeNotes,
    self_paced_status: practicePassed
      ? 'completed'
      : existing?.self_paced_status === 'completed'
        ? 'in_progress'
        : existing?.self_paced_status ?? 'in_progress',
    live_status:
      liveAssessmentScore != null ? 'completed' : (existing?.live_status ?? 'not_booked'),
    completed_at: practicePassed ? (existing?.completed_at ?? now) : null,
    updated_at: now,
  }

  const { error } = await db.from('student_unit_progress').upsert(payload, {
    onConflict: 'student_id,unit_id',
  })

  if (error) {
    console.error('[upsertUnitGradeAction]', error.message)
    throw new Error(error.message)
  }

  await db.from('part_progress').upsert(
    {
      student_id: studentId,
      unit_id: unitId,
      part: 'practice',
      status: practicePassed ? 'completed' : 'in_progress',
      progress_pct: practicePassed ? 100 : 0,
      completed_at: practicePassed ? now : null,
      updated_at: now,
      first_viewed_at: now,
    },
    { onConflict: 'student_id,unit_id,part' },
  )

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'unit_grade.upsert',
    entityType: 'student_unit_progress',
    entityId: `${studentId}:${unitId}`,
    metadata: {
      studentId,
      unitId,
      practicePassed,
      homeworkScore,
      quizScore,
      liveAssessmentScore,
    },
  })

  revalidatePath('/admin/progress')
  revalidatePath(`/admin/progress/${studentId}`)
  revalidatePath(`/admin/people/${studentId}`)
  revalidatePath('/progress')
  revalidatePath('/dashboard')
}

export async function resetUnitProgressAction(formData: FormData): Promise<void> {
  const { user, profile } = await requireRole('admin')
  const studentId = String(formData.get('studentId') ?? '')
  const unitId = String(formData.get('unitId') ?? '')
  const confirm = String(formData.get('confirm') ?? '').trim()

  if (!studentId || !unitId) throw new Error('Missing student or unit')

  const db = createAdminDb()
  const { data: unit } = await db.from('units').select('title').eq('id', unitId).maybeSingle()
  const expected = unit?.title ?? unitId
  if (confirm !== expected) {
    throw new Error(`Type the unit title exactly to confirm: ${expected}`)
  }

  await db.from('part_progress').delete().eq('student_id', studentId).eq('unit_id', unitId)
  await db.from('student_unit_progress').delete().eq('student_id', studentId).eq('unit_id', unitId)

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'unit_progress.reset',
    entityType: 'student_unit_progress',
    entityId: `${studentId}:${unitId}`,
    metadata: { studentId, unitId },
  })

  revalidatePath('/admin/progress')
  revalidatePath(`/admin/progress/${studentId}`)
  revalidatePath('/progress')
  revalidatePath('/dashboard')
}

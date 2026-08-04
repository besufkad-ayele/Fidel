'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/guards'
import { getCurrentProfile } from '@/lib/auth/session'
import { createAdminDb, writeAudit } from '@/lib/admin/db'
import { createClient } from '@/lib/supabase/server'

export type ReviewHomeworkResult = { ok: true } | { ok: false; error: string }

async function requireTeacherOrAdmin(): Promise<
  | {
      ok: true
      user: Awaited<ReturnType<typeof requireAuth>>
      profile: NonNullable<Awaited<ReturnType<typeof getCurrentProfile>>>
    }
  | { ok: false; error: string }
> {
  const user = await requireAuth()
  const profile = await getCurrentProfile()
  if (!profile?.is_active) {
    return { ok: false, error: 'Not signed in.' }
  }
  if (profile.role !== 'teacher' && profile.role !== 'admin') {
    return { ok: false, error: 'Only teachers and admins can assess homework.' }
  }
  return { ok: true, user, profile }
}

async function teacherCanReviewStudent(teacherId: string, studentId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('student_teacher_assignments')
    .select('student_id')
    .eq('teacher_id', teacherId)
    .eq('student_id', studentId)
    .maybeSingle()
  return Boolean(data)
}

export async function reviewHomeworkSubmissionAction(
  formData: FormData,
): Promise<ReviewHomeworkResult> {
  const auth = await requireTeacherOrAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const { user, profile } = auth
  const submissionId = String(formData.get('submissionId') ?? '').trim()
  const outcome = String(formData.get('outcome') ?? '').trim()
  const feedback = String(formData.get('feedback') ?? '').trim() || null
  const gradeRaw = String(formData.get('grade') ?? '').trim()

  if (!submissionId) return { ok: false, error: 'Missing submission.' }
  if (outcome !== 'approve' && outcome !== 'resubmit') {
    return { ok: false, error: 'Choose Approve or Request resubmission.' }
  }

  let grade: number | null = null
  if (gradeRaw !== '') {
    const n = Number(gradeRaw)
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      return { ok: false, error: 'Grade must be blank or a number from 0 to 100.' }
    }
    grade = Math.round(n)
  }

  if (outcome === 'approve' && grade == null) {
    return { ok: false, error: 'Enter a grade (0–100) to approve this submission.' }
  }

  const db = createAdminDb()
  const { data: submission, error: loadError } = await db
    .from('homework_submissions')
    .select('id, student_id, assignment_id, status')
    .eq('id', submissionId)
    .maybeSingle()

  if (loadError) return { ok: false, error: loadError.message }
  if (!submission) return { ok: false, error: 'Submission not found.' }

  if (profile.role === 'teacher') {
    const allowed = await teacherCanReviewStudent(user.id, submission.student_id)
    if (!allowed) return { ok: false, error: 'This student is not assigned to you.' }
  }

  const { data: assignment } = await db
    .from('homework_assignments')
    .select('id, unit_id, title')
    .eq('id', submission.assignment_id)
    .maybeSingle()

  const now = new Date().toISOString()
  const nextStatus = outcome === 'approve' ? 'reviewed' : 'needs_resubmission'

  const { error: updateError } = await db
    .from('homework_submissions')
    .update({
      status: nextStatus,
      feedback,
      grade,
      reviewed_by: user.id,
      reviewed_at: now,
    })
    .eq('id', submissionId)

  if (updateError) return { ok: false, error: updateError.message }

  if (outcome === 'approve' && grade != null && assignment?.unit_id) {
    const { data: existing } = await db
      .from('student_unit_progress')
      .select('id, practice_passed, live_status, self_paced_status, completed_at, started_at')
      .eq('student_id', submission.student_id)
      .eq('unit_id', assignment.unit_id)
      .maybeSingle()

    const { error: progressError } = await db.from('student_unit_progress').upsert(
      {
        student_id: submission.student_id,
        unit_id: assignment.unit_id,
        homework_score: grade,
        practice_passed: existing?.practice_passed ?? false,
        live_status: existing?.live_status ?? 'not_booked',
        self_paced_status:
          existing?.self_paced_status && existing.self_paced_status !== 'not_started'
            ? existing.self_paced_status
            : 'in_progress',
        completed_at: existing?.completed_at ?? null,
        started_at: existing?.started_at ?? now,
        updated_at: now,
      },
      { onConflict: 'student_id,unit_id' },
    )

    if (progressError) {
      console.error('[reviewHomeworkSubmissionAction] progress', progressError.message)
    }
  }

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: outcome === 'approve' ? 'homework.approve' : 'homework.request_resubmission',
    entityType: 'homework_submission',
    entityId: submissionId,
    metadata: {
      grade,
      feedback,
      assignmentId: submission.assignment_id,
      studentId: submission.student_id,
      unitId: assignment?.unit_id ?? null,
    },
  })

  revalidatePath('/teach/homework')
  revalidatePath(`/teach/homework/${submissionId}`)
  revalidatePath('/admin/homework')
  revalidatePath('/admin/homework/assess')
  revalidatePath(`/admin/homework/assess/${submissionId}`)
  revalidatePath(`/homework/${submission.assignment_id}`)
  revalidatePath('/homework')
  revalidatePath('/dashboard')
  revalidatePath('/progress')
  if (assignment?.unit_id) {
    revalidatePath(`/admin/progress/${submission.student_id}`)
  }

  return { ok: true }
}

import 'server-only'

import { createAdminDb } from '@/lib/admin/db'
import { createClient } from '@/lib/supabase/server'
import { lessonMediaPublicUrl } from '@/lib/media/urls'

export type HomeworkSubmissionStatus =
  | 'assigned'
  | 'submitted'
  | 'reviewed'
  | 'needs_resubmission'

export type HomeworkReviewQueueItem = {
  id: string
  attemptNo: number
  status: HomeworkSubmissionStatus
  submittedAt: string
  grade: number | null
  feedback: string | null
  student: { id: string; fullName: string; email: string }
  assignment: { id: string; title: string; unitId: string | null; instructions: string }
}

export type HomeworkReviewDetail = HomeworkReviewQueueItem & {
  textResponse: string | null
  fileUrls: string[]
  audioUrl: string | null
  videoUrl: string | null
  reviewedAt: string | null
  reviewedBy: string | null
}

type RawSubmission = {
  id: string
  attempt_no: number
  status: HomeworkSubmissionStatus
  submitted_at: string
  grade: number | null
  feedback: string | null
  text_response: string | null
  file_paths: string[] | null
  audio_path: string | null
  video_path: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  student_id: string
  assignment_id: string
}

function mapQueueItem(
  row: RawSubmission,
  student: { id: string; full_name: string | null; email: string },
  assignment: { id: string; title: string; unit_id: string | null; instructions: string },
): HomeworkReviewQueueItem {
  return {
    id: row.id,
    attemptNo: row.attempt_no,
    status: row.status,
    submittedAt: row.submitted_at,
    grade: row.grade,
    feedback: row.feedback,
    student: {
      id: student.id,
      fullName: student.full_name || student.email,
      email: student.email,
    },
    assignment: {
      id: assignment.id,
      title: assignment.title,
      unitId: assignment.unit_id,
      instructions: assignment.instructions,
    },
  }
}

async function teacherStudentIds(teacherId: string): Promise<string[] | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('student_teacher_assignments')
    .select('student_id')
    .eq('teacher_id', teacherId)

  if (error) {
    console.error('[homework-review] teacher students', error.message)
    return []
  }
  return (data ?? []).map((r: { student_id: string }) => r.student_id)
}

/** Submissions waiting for (or already through) teacher/admin assessment. */
export async function listHomeworkSubmissionsForReview(opts: {
  role: 'teacher' | 'admin'
  userId: string
  status?: HomeworkSubmissionStatus | 'awaiting' | 'all'
}): Promise<HomeworkReviewQueueItem[]> {
  const db = createAdminDb()
  const statusFilter = opts.status ?? 'awaiting'

  let query = db
    .from('homework_submissions')
    .select(
      'id, attempt_no, status, submitted_at, grade, feedback, text_response, file_paths, audio_path, video_path, reviewed_at, reviewed_by, student_id, assignment_id',
    )
    .order('submitted_at', { ascending: true })
    .limit(100)

  if (statusFilter === 'awaiting') {
    query = query.eq('status', 'submitted')
  } else if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  if (opts.role === 'teacher') {
    const studentIds = await teacherStudentIds(opts.userId)
    if (!studentIds || studentIds.length === 0) return []
    query = query.in('student_id', studentIds)
  }

  const { data: rows, error } = await query
  if (error) {
    console.error('[listHomeworkSubmissionsForReview]', error.message)
    return []
  }
  if (!rows?.length) return []

  const submissions = rows as RawSubmission[]
  const studentIds = [...new Set(submissions.map((r) => r.student_id))]
  const assignmentIds = [...new Set(submissions.map((r) => r.assignment_id))]

  const [{ data: students }, { data: assignments }] = await Promise.all([
    db.from('profiles').select('id, full_name, email').in('id', studentIds),
    db
      .from('homework_assignments')
      .select('id, title, unit_id, instructions')
      .in('id', assignmentIds),
  ])

  const studentMap = new Map(
    ((students ?? []) as Array<{ id: string; full_name: string | null; email: string }>).map(
      (s) => [s.id, s],
    ),
  )
  const assignmentMap = new Map(
    (
      (assignments ?? []) as Array<{
        id: string
        title: string
        unit_id: string | null
        instructions: string
      }>
    ).map((a) => [a.id, a]),
  )

  return submissions
    .map((row) => {
      const student = studentMap.get(row.student_id)
      const assignment = assignmentMap.get(row.assignment_id)
      if (!student || !assignment) return null
      return mapQueueItem(row, student, assignment)
    })
    .filter((item): item is HomeworkReviewQueueItem => Boolean(item))
}

export async function getHomeworkSubmissionForReview(
  submissionId: string,
  opts: { role: 'teacher' | 'admin'; userId: string },
): Promise<HomeworkReviewDetail | null> {
  const db = createAdminDb()
  const { data: row, error } = await db
    .from('homework_submissions')
    .select(
      'id, attempt_no, status, submitted_at, grade, feedback, text_response, file_paths, audio_path, video_path, reviewed_at, reviewed_by, student_id, assignment_id',
    )
    .eq('id', submissionId)
    .maybeSingle()

  if (error) {
    console.error('[getHomeworkSubmissionForReview]', error.message)
    return null
  }
  if (!row) return null

  const submission = row as RawSubmission

  if (opts.role === 'teacher') {
    const studentIds = await teacherStudentIds(opts.userId)
    if (!studentIds?.includes(submission.student_id)) return null
  }

  const [{ data: student }, { data: assignment }] = await Promise.all([
    db
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', submission.student_id)
      .maybeSingle(),
    db
      .from('homework_assignments')
      .select('id, title, unit_id, instructions')
      .eq('id', submission.assignment_id)
      .maybeSingle(),
  ])

  if (!student || !assignment) return null

  const base = mapQueueItem(
    submission,
    student as { id: string; full_name: string | null; email: string },
    assignment as { id: string; title: string; unit_id: string | null; instructions: string },
  )

  return {
    ...base,
    textResponse: submission.text_response,
    fileUrls: (submission.file_paths ?? [])
      .map((p) => lessonMediaPublicUrl(p))
      .filter((u): u is string => Boolean(u)),
    audioUrl: lessonMediaPublicUrl(submission.audio_path),
    videoUrl: lessonMediaPublicUrl(submission.video_path),
    reviewedAt: submission.reviewed_at,
    reviewedBy: submission.reviewed_by,
  }
}

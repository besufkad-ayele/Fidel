import 'server-only'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/session'
import { parsePartContent, type LessonPartContent } from '@/lib/validation/content'
import {
  collectVocabularyIds,
  getVocabularyByIds,
  type VocabItem,
} from '@/lib/data/curriculum'

export type StudentHomeworkSubmissionStatus =
  | 'pending'
  | 'submitted'
  | 'reviewed'
  | 'needs_resubmission'

export type StudentHomeworkListItem = {
  id: string
  title: string
  instructions: string
  dueAt: string | null
  unitId: string | null
  unitTitle: string | null
  levelId: string | null
  isUnitDefault: boolean
  updatedAt: string
  submissionStatus: StudentHomeworkSubmissionStatus
  submittedAt: string | null
}

export type StudentHomeworkDetail = {
  id: string
  title: string
  instructions: string
  dueAt: string | null
  unitId: string | null
  unitTitle: string | null
  levelId: string | null
  allowText: boolean
  allowAudio: boolean
  allowVideo: boolean
  allowFiles: boolean
  maxAudioSeconds: number | null
  maxVideoSeconds: number | null
  content: LessonPartContent | null
  vocabulary: Record<string, VocabItem>
  submissionStatus: StudentHomeworkSubmissionStatus
  submittedAt: string | null
  feedback: string | null
  grade: number | null
}

async function loadUnitMeta(
  unitIds: string[],
): Promise<Map<string, { title: string; levelId: string }>> {
  const unique = [...new Set(unitIds.filter(Boolean))]
  const map = new Map<string, { title: string; levelId: string }>()
  if (unique.length === 0) return map

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('units')
    .select('id, title, level_id')
    .in('id', unique)

  if (error) {
    console.error('[homework] unit meta failed:', error.message)
    return map
  }

  for (const row of data ?? []) {
    map.set(row.id, { title: row.title, levelId: row.level_id })
  }
  return map
}

function mapSubmissionStatus(
  status: string | null | undefined,
): StudentHomeworkSubmissionStatus {
  if (status === 'submitted') return 'submitted'
  if (status === 'reviewed') return 'reviewed'
  if (status === 'needs_resubmission') return 'needs_resubmission'
  return 'pending'
}

async function latestSubmissionsByAssignment(
  studentId: string,
  assignmentIds: string[],
): Promise<
  Map<
    string,
    {
      status: string
      submittedAt: string
      feedback: string | null
      grade: number | null
    }
  >
> {
  const map = new Map<
    string,
    {
      status: string
      submittedAt: string
      feedback: string | null
      grade: number | null
    }
  >()
  if (assignmentIds.length === 0) return map

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('homework_submissions')
    .select('assignment_id, status, submitted_at, feedback, grade, attempt_no')
    .eq('student_id', studentId)
    .in('assignment_id', assignmentIds)
    .order('attempt_no', { ascending: false })

  if (error) {
    console.error('[homework] submissions lookup failed:', error.message)
    return map
  }

  for (const row of data ?? []) {
    if (map.has(row.assignment_id)) continue
    map.set(row.assignment_id, {
      status: row.status,
      submittedAt: row.submitted_at,
      feedback: row.feedback,
      grade: row.grade,
    })
  }
  return map
}

export const listPublishedHomeworkForStudent = cache(
  async (): Promise<StudentHomeworkListItem[]> => {
    const user = await getCurrentUser()
    if (!user) return []

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('homework_assignments')
      .select(
        'id, title, instructions, due_at, unit_id, is_unit_default, updated_at',
      )
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('[homework] list failed:', error.message)
      return []
    }

    const rows = data ?? []
    const [units, submissions] = await Promise.all([
      loadUnitMeta(rows.map((r) => r.unit_id).filter((id): id is string => Boolean(id))),
      latestSubmissionsByAssignment(
        user.id,
        rows.map((r) => r.id),
      ),
    ])

    return rows.map((row) => {
      const unit = row.unit_id ? units.get(row.unit_id) : undefined
      const submission = submissions.get(row.id)
      return {
        id: row.id,
        title: row.title,
        instructions: row.instructions,
        dueAt: row.due_at ?? null,
        unitId: row.unit_id,
        unitTitle: unit?.title ?? null,
        levelId: unit?.levelId ?? null,
        isUnitDefault: row.is_unit_default,
        updatedAt: row.updated_at,
        submissionStatus: mapSubmissionStatus(submission?.status),
        submittedAt: submission?.submittedAt ?? null,
      }
    })
  },
)

/** Pending / needs-resubmission assignments for dashboard attention card. */
export const listActionableHomeworkForStudent = cache(async () => {
  const all = await listPublishedHomeworkForStudent()
  return all.filter(
    (a) => a.submissionStatus === 'pending' || a.submissionStatus === 'needs_resubmission',
  )
})

export const getPublishedHomeworkForStudent = cache(
  async (id: string): Promise<StudentHomeworkDetail | null> => {
    const user = await getCurrentUser()
    if (!user) return null

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('homework_assignments')
      .select(
        'id, title, instructions, due_at, unit_id, allow_text, allow_audio, allow_video, allow_files, max_audio_seconds, max_video_seconds, content',
      )
      .eq('id', id)
      .eq('status', 'published')
      .maybeSingle()

    if (error) {
      console.error('[homework] detail failed:', error.message)
      return null
    }
    if (!data) return null

    const content = parsePartContent(data.content)
    const vocabIds = content ? collectVocabularyIds(content) : []
    const vocabRows = vocabIds.length > 0 ? await getVocabularyByIds(vocabIds) : []
    const units = data.unit_id ? await loadUnitMeta([data.unit_id]) : new Map()
    const unit = data.unit_id ? units.get(data.unit_id) : undefined
    const submissions = await latestSubmissionsByAssignment(user.id, [data.id])
    const submission = submissions.get(data.id)

    return {
      id: data.id,
      title: data.title,
      instructions: data.instructions,
      dueAt: data.due_at ?? null,
      unitId: data.unit_id,
      unitTitle: unit?.title ?? null,
      levelId: unit?.levelId ?? null,
      allowText: data.allow_text,
      allowAudio: data.allow_audio,
      allowVideo: data.allow_video,
      allowFiles: data.allow_files,
      maxAudioSeconds: data.max_audio_seconds,
      maxVideoSeconds: data.max_video_seconds,
      content,
      vocabulary: Object.fromEntries(vocabRows.map((v) => [v.id, v])),
      submissionStatus: mapSubmissionStatus(submission?.status),
      submittedAt: submission?.submittedAt ?? null,
      feedback: submission?.feedback ?? null,
      grade: submission?.grade ?? null,
    }
  },
)

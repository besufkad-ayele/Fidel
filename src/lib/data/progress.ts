import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { createAdminDb } from '@/lib/admin/db'
import {
  averageWeightedTotals,
  evaluateUnitGrade,
  type UnitGradeResult,
} from '@/lib/domain/grading'

export type UnitRow = {
  id: string
  level_id: string
  slug: string
  title: string
  sort_order: number
}

export type LevelRow = {
  id: string
  fidel_char: string
  title: string
  cefr_equivalent: string
  sort_order: number
}

export type UnitProgressRow = {
  unit_id: string
  self_paced_status: string
  live_status: string
  practice_passed: boolean
  homework_score: number | null
  best_quiz_percentage: number | null
  live_assessment_score: number | null
  grade_notes: string | null
  started_at: string | null
  completed_at: string | null
  updated_at: string
}

export type StudentUnitProgressView = {
  unit: UnitRow
  level: LevelRow | null
  grade: UnitGradeResult
  selfPacedStatus: string
  liveStatus: string
  gradeNotes: string | null
  startedAt: string | null
  completedAt: string | null
  updatedAt: string | null
}

export type StudentProgressSummary = {
  studentId: string
  fullName: string
  email: string
  isActive: boolean
  unitsStarted: number
  unitsComplete: number
  practicePassedCount: number
  averageGrade: number | null
  units: StudentUnitProgressView[]
}

const UNIT_PROGRESS_SELECT =
  'unit_id, self_paced_status, live_status, practice_passed, homework_score, best_quiz_percentage, live_assessment_score, grade_notes, started_at, completed_at, updated_at'

function toNumber(value: unknown): number | null {
  if (value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function mapUnitProgress(
  unit: UnitRow,
  level: LevelRow | null,
  row: UnitProgressRow | undefined,
): StudentUnitProgressView {
  const grade = evaluateUnitGrade({
    practicePassed: Boolean(row?.practice_passed),
    homeworkScore: toNumber(row?.homework_score),
    quizScore: toNumber(row?.best_quiz_percentage),
    liveAssessmentScore: toNumber(row?.live_assessment_score),
  })

  return {
    unit,
    level,
    grade,
    selfPacedStatus: row?.self_paced_status ?? 'not_started',
    liveStatus: row?.live_status ?? 'not_booked',
    gradeNotes: row?.grade_notes ?? null,
    startedAt: row?.started_at ?? null,
    completedAt: row?.completed_at ?? null,
    updatedAt: row?.updated_at ?? null,
  }
}

async function loadCurriculum(db: { from: (table: string) => any }) {
  const [{ data: levels }, { data: units }] = await Promise.all([
    db
      .from('levels')
      .select('id, fidel_char, title, cefr_equivalent, sort_order')
      .order('sort_order'),
    db
      .from('units')
      .select('id, level_id, slug, title, sort_order')
      .order('sort_order'),
  ])

  return {
    levels: (levels ?? []) as LevelRow[],
    units: (units ?? []) as UnitRow[],
  }
}

function buildStudentViews(
  units: UnitRow[],
  levels: LevelRow[],
  progressRows: UnitProgressRow[],
): StudentUnitProgressView[] {
  const levelMap = new Map(levels.map((l) => [l.id, l]))
  const progressMap = new Map(progressRows.map((r) => [r.unit_id, r]))

  return units.map((unit) =>
    mapUnitProgress(unit, levelMap.get(unit.level_id) ?? null, progressMap.get(unit.id)),
  )
}

function summarize(
  studentId: string,
  fullName: string,
  email: string,
  isActive: boolean,
  units: StudentUnitProgressView[],
): StudentProgressSummary {
  const started = units.filter((u) => u.selfPacedStatus !== 'not_started' || u.grade.scoredComponents > 0)
  const complete = units.filter((u) => u.grade.isComplete)
  const practicePassed = units.filter((u) => u.grade.practicePassed)

  return {
    studentId,
    fullName,
    email,
    isActive,
    unitsStarted: started.length,
    unitsComplete: complete.length,
    practicePassedCount: practicePassed.length,
    averageGrade: averageWeightedTotals(units.map((u) => u.grade.weightedTotal)),
    units,
  }
}

/** Admin: roster of students with grade summaries. */
export async function getAdminProgressRoster(query?: string): Promise<StudentProgressSummary[]> {
  const db = createAdminDb()
  const { levels, units } = await loadCurriculum(db)

  let studentsQuery = db
    .from('profiles')
    .select('id, full_name, email, is_active')
    .eq('role', 'student')
    .order('full_name')
    .limit(200)

  if (query?.trim()) {
    studentsQuery = studentsQuery.or(
      `full_name.ilike.%${query.trim()}%,email.ilike.%${query.trim()}%`,
    )
  }

  const { data: students } = await studentsQuery
  if (!students?.length) return []

  const studentIds = students.map((s: { id: string }) => s.id)
  const byStudent = new Map<string, UnitProgressRow[]>()
  const { data: progressWithStudent } = await db
    .from('student_unit_progress')
    .select(`${UNIT_PROGRESS_SELECT}, student_id`)
    .in('student_id', studentIds)

  for (const row of (progressWithStudent ?? []) as Array<UnitProgressRow & { student_id: string }>) {
    const list = byStudent.get(row.student_id) ?? []
    list.push(row)
    byStudent.set(row.student_id, list)
  }

  return students.map((s: { id: string; full_name: string; email: string; is_active: boolean }) => {
    const views = buildStudentViews(units, levels, byStudent.get(s.id) ?? [])
    return summarize(s.id, s.full_name || s.email, s.email, s.is_active, views)
  })
}

/** Admin or student detail for one learner. */
export async function getStudentProgressDetail(
  studentId: string,
  opts?: { asAdmin?: boolean },
): Promise<StudentProgressSummary | null> {
  const db = opts?.asAdmin ? createAdminDb() : await createClient()

  const { data: profile } = await db
    .from('profiles')
    .select('id, full_name, email, is_active, role')
    .eq('id', studentId)
    .maybeSingle()

  if (!profile) return null

  const { levels, units } = await loadCurriculum(db as { from: (t: string) => any })
  const { data: progress } = await (db as { from: (t: string) => any })
    .from('student_unit_progress')
    .select(UNIT_PROGRESS_SELECT)
    .eq('student_id', studentId)

  const views = buildStudentViews(units, levels, (progress ?? []) as UnitProgressRow[])
  return summarize(
    profile.id,
    profile.full_name || profile.email,
    profile.email,
    profile.is_active ?? true,
    views,
  )
}

export async function getCurrentStudentProgress(): Promise<StudentProgressSummary | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  return getStudentProgressDetail(user.id, { asAdmin: false })
}

/** Unit grade weights. Practice is pass/fail and is not included in the percentage. */
export const GRADE_WEIGHTS = {
  homework: 0.4,
  quiz: 0.1,
  liveAssessment: 0.5,
} as const

export type UnitGradeComponents = {
  practicePassed: boolean
  homeworkScore: number | null
  quizScore: number | null
  liveAssessmentScore: number | null
}

export type UnitGradeResult = UnitGradeComponents & {
  /** Weighted total 0–100 when homework + quiz + live are all present; otherwise null. */
  weightedTotal: number | null
  /** How many of the three scored components have values. */
  scoredComponents: number
  /** True when practice passed and all three scored components are present. */
  isComplete: boolean
}

function clampScore(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(Number(value))) return null
  return Math.max(0, Math.min(100, Number(value)))
}

/** homework×40% + quiz×10% + live×50%. Returns null until all three scores exist. */
export function computeWeightedTotal(components: {
  homeworkScore: number | null
  quizScore: number | null
  liveAssessmentScore: number | null
}): number | null {
  const homework = clampScore(components.homeworkScore)
  const quiz = clampScore(components.quizScore)
  const live = clampScore(components.liveAssessmentScore)
  if (homework == null || quiz == null || live == null) return null
  return Math.round(
    (homework * GRADE_WEIGHTS.homework +
      quiz * GRADE_WEIGHTS.quiz +
      live * GRADE_WEIGHTS.liveAssessment) *
      100,
  ) / 100
}

export function evaluateUnitGrade(input: UnitGradeComponents): UnitGradeResult {
  const homeworkScore = clampScore(input.homeworkScore)
  const quizScore = clampScore(input.quizScore)
  const liveAssessmentScore = clampScore(input.liveAssessmentScore)
  const scoredComponents = [homeworkScore, quizScore, liveAssessmentScore].filter(
    (v) => v != null,
  ).length
  const weightedTotal = computeWeightedTotal({
    homeworkScore,
    quizScore,
    liveAssessmentScore,
  })

  return {
    practicePassed: Boolean(input.practicePassed),
    homeworkScore,
    quizScore,
    liveAssessmentScore,
    weightedTotal,
    scoredComponents,
    isComplete: Boolean(input.practicePassed) && weightedTotal != null,
  }
}

/** Average of units that already have a weighted total; null if none graded yet. */
export function averageWeightedTotals(totals: Array<number | null>): number | null {
  const values = totals.filter((v): v is number => v != null)
  if (values.length === 0) return null
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
}

export function formatWeightLabel(weight: number): string {
  return `${Math.round(weight * 100)}%`
}

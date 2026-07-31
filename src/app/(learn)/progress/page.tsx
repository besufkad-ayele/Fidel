import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { AmharicText } from '@/components/shared/amharic-text'
import { ProgressRing } from '@/components/shared/progress-ring'
import { StatusChip } from '@/components/shared/status-chip'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/auth/guards'
import { listPublishedHomeworkForStudent } from '@/lib/data/homework'
import { getCurrentStudentProgress } from '@/lib/data/progress'
import {
  GRADE_WEIGHTS,
  formatWeightLabel,
} from '@/lib/domain/grading'
import { CheckCircle2, Circle, Minus } from 'lucide-react'
import type { ReactNode } from 'react'

export const metadata: Metadata = { title: 'Progress' }

export default async function StudentProgressPage() {
  await requireRole('student')
  const t = await getTranslations('progress')
  const [detail, homework] = await Promise.all([
    getCurrentStudentProgress(),
    listPublishedHomeworkForStudent(),
  ])

  if (!detail) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl text-green-900">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      </div>
    )
  }

  const homeworkByUnit = new Map<string, typeof homework>()
  for (const assignment of homework) {
    if (!assignment.unitId) continue
    const list = homeworkByUnit.get(assignment.unitId) ?? []
    list.push(assignment)
    homeworkByUnit.set(assignment.unitId, list)
  }

  const byLevel = new Map<string, typeof detail.units>()
  for (const unit of detail.units) {
    const key = unit.level?.id ?? 'unknown'
    const list = byLevel.get(key) ?? []
    list.push(unit)
    byLevel.set(key, list)
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-cream-300 pb-5">
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
          {t('eyebrow')}
        </p>
        <h1 className="mt-1 font-display text-3xl text-green-900">{t('title')}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label={t('summary.average')}
          value={detail.averageGrade != null ? `${detail.averageGrade}%` : '—'}
          ring={detail.averageGrade}
        />
        <SummaryCard
          label={t('summary.practice')}
          value={`${detail.practicePassedCount}/${detail.units.length}`}
        />
        <SummaryCard
          label={t('summary.complete')}
          value={`${detail.unitsComplete}/${detail.units.length}`}
        />
        <SummaryCard
          label={t('summary.started')}
          value={`${detail.unitsStarted}/${detail.units.length}`}
        />
      </section>

      <section className="rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card">
        <h2 className="font-display text-lg text-green-800">{t('weights.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('weights.body')}</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <WeightItem label={t('weights.practice')} value={t('weights.passFail')} />
          <WeightItem
            label={t('weights.homework')}
            value={formatWeightLabel(GRADE_WEIGHTS.homework)}
          />
          <WeightItem label={t('weights.quiz')} value={formatWeightLabel(GRADE_WEIGHTS.quiz)} />
          <WeightItem
            label={t('weights.live')}
            value={formatWeightLabel(GRADE_WEIGHTS.liveAssessment)}
          />
        </ul>
      </section>

      {[...byLevel.entries()].map(([levelId, units]) => {
        const level = units[0]?.level
        const graded = units
          .map((u) => u.grade.weightedTotal)
          .filter((v): v is number => v != null)
        const levelAvg =
          graded.length > 0
            ? Math.round((graded.reduce((a, b) => a + b, 0) / graded.length) * 100) / 100
            : null

        return (
          <section key={levelId} className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl text-green-900">
                  {level ? (
                    <>
                      <AmharicText size="lg" className="mr-2 inline text-gold-600">
                        {level.fidel_char}
                      </AmharicText>
                      {level.title}
                    </>
                  ) : (
                    t('unitsFallback')
                  )}
                </h2>
                {level ? (
                  <p className="text-xs text-muted-foreground">
                    CEFR {level.cefr_equivalent}
                  </p>
                ) : null}
              </div>
              {levelAvg != null ? (
                <p className="text-sm font-semibold tabular-nums text-green-800">
                  {t('levelAverage', { value: Math.round(levelAvg * 100) / 100 })}
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              {units.map((u) => (
                <article
                  key={u.unit.id}
                  className="rounded-xl border border-cream-300 bg-cream-50 p-4 shadow-card sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.14em] text-gold-700 uppercase">
                        {t('unitLabel', { n: u.unit.sort_order })}
                      </p>
                      <h3 className="font-display text-xl text-green-900">{u.unit.title}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusChip
                        state={
                          u.grade.isComplete
                            ? 'completed'
                            : u.selfPacedStatus === 'not_started'
                              ? 'not_started'
                              : 'in_progress'
                        }
                      />
                      {u.grade.weightedTotal != null ? (
                        <ProgressRing
                          value={u.grade.weightedTotal}
                          size={56}
                          label={t('unitGrade')}
                        />
                      ) : null}
                    </div>
                  </div>

                  <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <ComponentRow
                      label={t('weights.practice')}
                      weight={t('weights.passFail')}
                      value={
                        u.grade.practicePassed ? (
                          <span className="inline-flex items-center gap-1 text-success-600">
                            <CheckCircle2 className="size-4" />
                            {t('pass')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Circle className="size-4" />
                            {t('fail')}
                          </span>
                        )
                      }
                    />
                    <ComponentRow
                      label={t('weights.homework')}
                      weight={formatWeightLabel(GRADE_WEIGHTS.homework)}
                      value={scoreOrDash(u.grade.homeworkScore)}
                    />
                    <ComponentRow
                      label={t('weights.quiz')}
                      weight={formatWeightLabel(GRADE_WEIGHTS.quiz)}
                      value={scoreOrDash(u.grade.quizScore)}
                    />
                    <ComponentRow
                      label={t('weights.live')}
                      weight={formatWeightLabel(GRADE_WEIGHTS.liveAssessment)}
                      value={scoreOrDash(u.grade.liveAssessmentScore)}
                    />
                  </dl>

                  {u.gradeNotes ? (
                    <p className="mt-3 text-sm text-muted-foreground">{u.gradeNotes}</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={
                          `/levels/${u.level?.id ?? 'ha'}/units/${u.unit.slug}/practice` as '/'
                        }
                      >
                        {t('openUnit')}
                      </Link>
                    </Button>
                    {(() => {
                      const unitHomework = homeworkByUnit.get(u.unit.id) ?? []
                      if (unitHomework.length === 0) return null
                      const href =
                        unitHomework.length === 1
                          ? (`/homework/${unitHomework[0]!.id}` as '/')
                          : ('/homework' as '/')
                      return (
                        <Button asChild size="sm">
                          <Link href={href}>{t('openHomework')}</Link>
                        </Button>
                      )
                    })()}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  ring,
}: {
  label: string
  value: string
  ring?: number | null
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-cream-300 bg-cream-50 px-4 py-4 shadow-card">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.14em] text-gold-700 uppercase">
          {label}
        </p>
        <p className="mt-1 font-display text-2xl text-green-900 tabular-nums">{value}</p>
      </div>
      {ring != null ? <ProgressRing value={ring} size={56} label={label} /> : null}
    </div>
  )
}

function WeightItem({ label, value }: { label: string; value: string }) {
  return (
    <li className="rounded-lg border border-cream-300 bg-cream-100/60 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-green-900">{value}</p>
    </li>
  )
}

function ComponentRow({
  label,
  weight,
  value,
}: {
  label: string
  weight: string
  value: ReactNode
}) {
  return (
    <div className="rounded-lg border border-cream-300/80 bg-cream-100/40 px-3 py-2">
      <dt className="text-[10px] font-semibold tracking-[0.12em] text-gold-700 uppercase">
        {label} · {weight}
      </dt>
      <dd className="mt-1 text-sm font-semibold tabular-nums text-green-900">{value}</dd>
    </div>
  )
}

function scoreOrDash(score: number | null) {
  if (score == null) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Minus className="size-3.5" />
        —
      </span>
    )
  }
  return `${score}%`
}

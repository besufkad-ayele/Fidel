import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/admin/page-header'
import { SectionCard } from '@/components/admin/section-card'
import { StatusBadge } from '@/components/admin/status-badge'
import { getStudentProgressDetail } from '@/lib/data/progress'
import {
  GRADE_WEIGHTS,
  formatWeightLabel,
} from '@/lib/domain/grading'
import {
  resetUnitProgressAction,
  upsertUnitGradeAction,
} from '@/app/(admin)/admin/progress-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Props = { params: Promise<{ studentId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { studentId } = await params
  const detail = await getStudentProgressDetail(studentId, { asAdmin: true })
  return { title: detail ? `Progress · ${detail.fullName}` : 'Progress' }
}

export default async function AdminStudentProgressPage({ params }: Props) {
  const { studentId } = await params
  const detail = await getStudentProgressDetail(studentId, { asAdmin: true })
  if (!detail) notFound()

  const byLevel = new Map<string, typeof detail.units>()
  for (const unit of detail.units) {
    const key = unit.level?.id ?? 'unknown'
    const list = byLevel.get(key) ?? []
    list.push(unit)
    byLevel.set(key, list)
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        breadcrumbs={[
          { label: 'Progress', href: '/admin/progress' },
          { label: detail.fullName },
        ]}
        title={detail.fullName}
        description={`${detail.email} · Practice pass/fail · Homework ${formatWeightLabel(GRADE_WEIGHTS.homework)} · Quiz ${formatWeightLabel(GRADE_WEIGHTS.quiz)} · Live ${formatWeightLabel(GRADE_WEIGHTS.liveAssessment)}`}
        actions={[
          { label: 'Open profile', href: `/admin/people/${studentId}`, variant: 'outline' },
        ]}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Avg grade" value={detail.averageGrade != null ? `${detail.averageGrade}%` : '—'} />
        <Stat label="Practice passed" value={`${detail.practicePassedCount}/${detail.units.length}`} />
        <Stat label="Units complete" value={`${detail.unitsComplete}/${detail.units.length}`} />
        <Stat label="Units started" value={`${detail.unitsStarted}/${detail.units.length}`} />
      </div>

      <div className="space-y-8">
        {[...byLevel.entries()].map(([levelId, units]) => {
          const level = units[0]?.level
          return (
            <div key={levelId} className="space-y-4">
              <h2 className="font-display text-xl text-green-800">
                {level ? (
                  <>
                    <span className="text-gold-600">{level.fidel_char}</span> {level.title}
                    <span className="ml-2 text-sm font-sans font-normal text-muted-foreground">
                      CEFR {level.cefr_equivalent}
                    </span>
                  </>
                ) : (
                  'Units'
                )}
              </h2>

              {units.map((u) => (
                <SectionCard
                  key={u.unit.id}
                  title={u.unit.title}
                  description={`Unit ${u.unit.sort_order} · ${u.unit.id}`}
                  action={
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        status={u.grade.practicePassed ? 'completed' : 'pending'}
                      />
                      {u.grade.weightedTotal != null ? (
                        <span className="text-sm font-semibold tabular-nums text-green-800">
                          {u.grade.weightedTotal}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Incomplete grade</span>
                      )}
                    </div>
                  }
                >
                  <form action={upsertUnitGradeAction} className="space-y-4">
                    <input type="hidden" name="studentId" value={studentId} />
                    <input type="hidden" name="unitId" value={u.unit.id} />

                    <label className="flex items-center gap-2 text-sm font-medium text-green-900">
                      <input
                        type="checkbox"
                        name="practicePassed"
                        value="true"
                        defaultChecked={u.grade.practicePassed}
                        className="size-4 rounded border-cream-400"
                      />
                      Practice passed (pass / fail — not weighted)
                    </label>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <Label htmlFor={`hw-${u.unit.id}`}>
                          Homework ({formatWeightLabel(GRADE_WEIGHTS.homework)})
                        </Label>
                        <Input
                          id={`hw-${u.unit.id}`}
                          name="homeworkScore"
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          className="mt-1.5"
                          placeholder="0–100"
                          defaultValue={u.grade.homeworkScore ?? ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`quiz-${u.unit.id}`}>
                          Unit quiz ({formatWeightLabel(GRADE_WEIGHTS.quiz)})
                        </Label>
                        <Input
                          id={`quiz-${u.unit.id}`}
                          name="quizScore"
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          className="mt-1.5"
                          placeholder="0–100"
                          defaultValue={u.grade.quizScore ?? ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`live-${u.unit.id}`}>
                          Live assessment ({formatWeightLabel(GRADE_WEIGHTS.liveAssessment)})
                        </Label>
                        <Input
                          id={`live-${u.unit.id}`}
                          name="liveAssessmentScore"
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          className="mt-1.5"
                          placeholder="0–100"
                          defaultValue={u.grade.liveAssessmentScore ?? ''}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`notes-${u.unit.id}`}>Notes</Label>
                      <Textarea
                        id={`notes-${u.unit.id}`}
                        name="gradeNotes"
                        className="mt-1.5"
                        rows={2}
                        defaultValue={u.gradeNotes ?? ''}
                        placeholder="Optional admin / teacher notes"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="submit" size="sm" className="bg-gold-500 text-green-950 hover:bg-gold-600">
                        Save unit grade
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/admin/people/${studentId}` as '/'}>Profile</Link>
                      </Button>
                    </div>
                  </form>

                  <div className="mt-4 border-t border-cream-300 pt-4">
                    <p className="mb-2 text-xs text-muted-foreground">
                      Reset clears part progress and grades for this unit. Type the unit title to confirm.
                    </p>
                    <form action={resetUnitProgressAction} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="studentId" value={studentId} />
                      <input type="hidden" name="unitId" value={u.unit.id} />
                      <div className="min-w-[200px] flex-1">
                        <Label htmlFor={`confirm-${u.unit.id}`}>Confirm unit title</Label>
                        <Input
                          id={`confirm-${u.unit.id}`}
                          name="confirm"
                          className="mt-1.5"
                          placeholder={u.unit.title}
                        />
                      </div>
                      <Button type="submit" size="sm" variant="outline">
                        Reset unit
                      </Button>
                    </form>
                  </div>
                </SectionCard>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-cream-300 bg-cream-50 px-4 py-3 shadow-card">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-gold-700 uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl text-green-900 tabular-nums">{value}</p>
    </div>
  )
}

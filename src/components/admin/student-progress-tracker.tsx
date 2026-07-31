import Link from 'next/link'
import { ProgressRing } from '@/components/shared/progress-ring'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { StudentProgressSummary } from '@/lib/data/progress'
import { GRADE_WEIGHTS, formatWeightLabel } from '@/lib/domain/grading'
import { CheckCircle2, Circle, Minus } from 'lucide-react'

type Props = {
  detail: StudentProgressSummary
}

export function StudentProgressTracker({ detail }: Props) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <MiniStat
          label="Avg grade"
          value={detail.averageGrade != null ? `${detail.averageGrade}%` : '—'}
          ring={detail.averageGrade}
        />
        <MiniStat
          label="Practice passed"
          value={`${detail.practicePassedCount}/${detail.units.length}`}
        />
        <MiniStat
          label="Units complete"
          value={`${detail.unitsComplete}/${detail.units.length}`}
        />
        <MiniStat
          label="Units started"
          value={`${detail.unitsStarted}/${detail.units.length}`}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Practice = pass/fail · Homework {formatWeightLabel(GRADE_WEIGHTS.homework)} · Quiz{' '}
        {formatWeightLabel(GRADE_WEIGHTS.quiz)} · Live{' '}
        {formatWeightLabel(GRADE_WEIGHTS.liveAssessment)}
      </p>

      {detail.units.length === 0 ? (
        <p className="text-sm text-muted-foreground">No curriculum units found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-cream-300">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Practice</TableHead>
                <TableHead className="text-right">HW 40%</TableHead>
                <TableHead className="text-right">Quiz 10%</TableHead>
                <TableHead className="text-right">Live 50%</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.units.map((u) => (
                <TableRow key={u.unit.id}>
                  <TableCell>
                    <div className="min-w-[140px]">
                      <p className="font-medium text-green-900">{u.unit.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {u.level ? `${u.level.fidel_char} · ` : ''}
                        Unit {u.unit.sort_order}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.grade.practicePassed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-success-600">
                        <CheckCircle2 className="size-3.5" />
                        Pass
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Circle className="size-3.5" />
                        Fail
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {scoreCell(u.grade.homeworkScore)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {scoreCell(u.grade.quizScore)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {scoreCell(u.grade.liveAssessmentScore)}
                  </TableCell>
                  <TableCell className="text-right">
                    {u.grade.weightedTotal != null ? (
                      <span className="font-semibold tabular-nums text-green-800">
                        {u.grade.weightedTotal}%
                      </span>
                    ) : (
                      <StatusBadge status="pending" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" className="bg-gold-500 text-green-950 hover:bg-gold-600">
          <Link href={`/admin/progress/${detail.studentId}` as '/'}>Edit grades</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={'/admin/progress' as '/'}>All progress</Link>
        </Button>
      </div>
    </div>
  )
}

function MiniStat({
  label,
  value,
  ring,
}: {
  label: string
  value: string
  ring?: number | null
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-cream-300 bg-cream-100/50 px-3 py-2">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.12em] text-gold-700 uppercase">
          {label}
        </p>
        <p className="font-display text-xl text-green-900 tabular-nums">{value}</p>
      </div>
      {ring != null ? <ProgressRing value={ring} size={40} label={label} /> : null}
    </div>
  )
}

function scoreCell(score: number | null) {
  if (score == null) {
    return (
      <span className="inline-flex items-center justify-end gap-1 text-muted-foreground">
        <Minus className="size-3" />
      </span>
    )
  }
  return `${score}%`
}

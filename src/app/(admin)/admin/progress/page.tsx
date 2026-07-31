import type { Metadata } from 'next'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { StatusBadge } from '@/components/admin/status-badge'
import { PersonAvatar } from '@/components/admin/person-avatar'
import { getAdminProgressRoster } from '@/lib/data/progress'
import { GRADE_WEIGHTS, formatWeightLabel } from '@/lib/domain/grading'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata: Metadata = { title: 'Progress' }

type SearchParams = Promise<{ q?: string }>

export default async function AdminProgressPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { q } = await searchParams
  const roster = await getAdminProgressRoster(q)

  return (
    <div>
      <PageHeader
        eyebrow="People & access"
        title="Student progress"
        description={`Manage unit grades: Practice (pass/fail) · Homework ${formatWeightLabel(GRADE_WEIGHTS.homework)} · Quiz ${formatWeightLabel(GRADE_WEIGHTS.quiz)} · Live assessment ${formatWeightLabel(GRADE_WEIGHTS.liveAssessment)}.`}
      />

      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search students…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {roster.length === 0 ? (
        <EmptyState
          title="No students yet"
          description="Provision a student under People, then enter their unit grades here."
          actionLabel="Go to People"
          actionHref="/admin/people?role=student"
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-cream-300 bg-cream-50 shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Practice passed</TableHead>
                <TableHead className="text-right">Units complete</TableHead>
                <TableHead className="text-right">Avg grade</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.map((row) => (
                <TableRow key={row.studentId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <PersonAvatar name={row.fullName} email={row.email} />
                      <div>
                        <p className="font-medium text-green-900">{row.fullName}</p>
                        <p className="text-xs text-muted-foreground">{row.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.isActive ? 'active' : 'suspended'} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.practicePassedCount}/{row.units.length}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.unitsComplete}/{row.units.length}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-green-800">
                    {row.averageGrade != null ? `${row.averageGrade}%` : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/progress/${row.studentId}` as '/'}>Manage</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

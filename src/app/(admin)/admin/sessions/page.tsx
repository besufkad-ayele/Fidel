import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { StatusBadge } from '@/components/admin/status-badge'
import { createAdminDb } from '@/lib/admin/db'
import { formatDateTime } from '@/lib/admin/constants'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata: Metadata = { title: 'Sessions' }

export default async function AdminSessionsPage() {
  const db = await createAdminDb()
  const [{ data: sessions }, { data: profiles }] = await Promise.all([
    db
      .from('sessions')
      .select(
        'id, student_id, teacher_id, unit_id, scheduled_at, duration_minutes, status, meet_link, student_note, session_notes',
      )
      .order('scheduled_at', { ascending: false })
      .limit(100),
    db.from('profiles').select('id, full_name, email'),
  ])

  const nameMap = new Map<string, string>(
    (profiles ?? []).map((p: { id: string; full_name: string; email: string }) => [
      p.id,
      p.full_name || p.email,
    ]),
  )

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Sessions"
        description="All live bookings across teachers and students."
      />

      {(sessions ?? []).length === 0 ? (
        <EmptyState
          title="No sessions booked"
          description="Once students have teachers and credits, bookings will list here with cancel and reschedule controls."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-cream-300 bg-cream-50 shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(sessions ?? []).map(
                (s: {
                  id: string
                  student_id: string
                  teacher_id: string
                  unit_id: string | null
                  scheduled_at: string
                  status: string
                  student_note: string | null
                  session_notes: string | null
                }) => (
                  <TableRow key={s.id}>
                    <TableCell>{formatDateTime(s.scheduled_at)}</TableCell>
                    <TableCell>{nameMap.get(s.student_id) ?? '—'}</TableCell>
                    <TableCell>{nameMap.get(s.teacher_id) ?? '—'}</TableCell>
                    <TableCell>{s.unit_id ?? 'Free conversation'}</TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="max-w-[260px] text-xs text-muted-foreground">
                      {s.session_notes || s.student_note || '—'}
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

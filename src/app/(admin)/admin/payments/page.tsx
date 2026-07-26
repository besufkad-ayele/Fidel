import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { SectionCard } from '@/components/admin/section-card'
import { StatusBadge } from '@/components/admin/status-badge'
import { KpiCard } from '@/components/admin/kpi-card'
import { createAdminDb } from '@/lib/admin/db'
import { formatDate, formatMoney } from '@/lib/admin/constants'
import { PaymentForm } from './payment-form'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata: Metadata = { title: 'Payments' }

export default async function PaymentsPage() {
  const db = await createAdminDb()
  const [{ data: payments }, { data: students }, { data: orgs }, { data: profiles }] =
    await Promise.all([
      db
        .from('payments')
        .select(
          'id, student_id, organization_id, amount_cents, currency, provider, status, paid_at, reference, created_at',
        )
        .order('created_at', { ascending: false })
        .limit(100),
      db.from('profiles').select('id, full_name, email').eq('role', 'student').order('full_name'),
      db.from('organizations').select('id, name').order('name'),
      db.from('profiles').select('id, full_name, email'),
    ])

  const nameMap = new Map<string, string>(
    (profiles ?? []).map((p: { id: string; full_name: string; email: string }) => [
      p.id,
      p.full_name || p.email,
    ]),
  )
  const outstanding = (payments ?? []).filter((p: { status: string }) =>
    ['pending', 'partial'].includes(p.status),
  )

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="People & access"
        title="Payments"
        description="Offline payment ledger. The system reports — it does not withhold access."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <KpiCard
          label="Outstanding rows"
          value={outstanding.length}
          tone={outstanding.length > 0 ? 'warning' : 'default'}
        />
        <KpiCard label="Total recorded rows" value={(payments ?? []).length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <SectionCard title="Record payment">
          <PaymentForm students={students ?? []} organizations={orgs ?? []} />
        </SectionCard>

        <div className="space-y-6">
          {outstanding.length > 0 ? (
            <SectionCard title="Payments outstanding" description="Pending and partial invoices.">
              <ul className="space-y-2 text-sm">
                {outstanding.map(
                  (p: {
                    id: string
                    student_id: string
                    amount_cents: number
                    currency: string
                    status: string
                  }) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-warning-500/30 bg-warning-50 px-3 py-2"
                    >
                      <span>{nameMap.get(p.student_id) ?? 'Student'}</span>
                      <span className="font-medium">
                        {formatMoney(p.amount_cents, p.currency)} · {p.status}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </SectionCard>
          ) : null}

          {(payments ?? []).length === 0 ? (
            <EmptyState
              title="No payments yet"
              description="Record bank transfers, invoices, and cash against students as they come in."
            />
          ) : (
            <div className="admin-table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(payments ?? []).map(
                    (p: {
                      id: string
                      student_id: string
                      amount_cents: number
                      currency: string
                      provider: string
                      status: string
                      paid_at: string | null
                      reference: string | null
                    }) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {nameMap.get(p.student_id) ?? p.student_id.slice(0, 8)}
                        </TableCell>
                        <TableCell>{formatMoney(p.amount_cents, p.currency)}</TableCell>
                        <TableCell className="capitalize">
                          {p.provider.replace(/manual_|_/g, ' ').trim()}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={p.status} />
                        </TableCell>
                        <TableCell>{formatDate(p.paid_at)}</TableCell>
                        <TableCell className="text-muted-foreground">{p.reference || '—'}</TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

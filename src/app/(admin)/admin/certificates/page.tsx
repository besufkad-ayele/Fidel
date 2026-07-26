import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { StatusBadge } from '@/components/admin/status-badge'
import { createAdminDb } from '@/lib/admin/db'
import { formatDateTime } from '@/lib/admin/constants'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata: Metadata = { title: 'Certificates' }

export default async function CertificatesPage() {
  const db = await createAdminDb()
  const [{ data: certs }, { data: profiles }] = await Promise.all([
    db
      .from('certificates')
      .select(
        'id, student_id, level_id, student_name, level_title, verification_code, status, issued_at',
      )
      .order('issued_at', { ascending: false }),
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
        title="Certificates"
        description="Issuance log with public verification codes."
      />

      <div className="mb-6 rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card">
        <p className="text-sm text-muted-foreground">
          Manual issue and revoke actions will write audit entries and snapshot the student name at
          issue time.
        </p>
        <Button className="mt-3" disabled>
          Issue certificate
        </Button>
      </div>

      {(certs ?? []).length === 0 ? (
        <EmptyState
          title="No certificates issued"
          description="When a student completes a level exam, the certificate appears here with a verification code embassies can check."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-cream-300 bg-cream-50 shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(certs ?? []).map(
                (c: {
                  id: string
                  student_id: string
                  student_name: string
                  level_title: string
                  verification_code: string
                  status: string
                  issued_at: string
                }) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.student_name || nameMap.get(c.student_id)}</TableCell>
                    <TableCell>{c.level_title}</TableCell>
                    <TableCell className="font-mono text-xs">{c.verification_code}</TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell>{formatDateTime(c.issued_at)}</TableCell>
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

import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState } from '@/components/admin/empty-state'
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

export const metadata: Metadata = { title: 'Audit log' }

export default async function AuditPage() {
  const db = await createAdminDb()
  const [{ data: entries }, { data: profiles }] = await Promise.all([
    db
      .from('audit_log')
      .select('id, actor_id, actor_role, action, entity_type, entity_id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(150),
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
        eyebrow="Operations"
        title="Audit log"
        description="Who granted access, why, and when — filterable by actor, action, and entity."
      />

      {(entries ?? []).length === 0 ? (
        <EmptyState
          title="Quiet so far"
          description="Provisioning, grants, payments, and publishes write here automatically."
        />
      ) : (
        <div className="admin-table-wrap">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(entries ?? []).map(
                (e: {
                  id: string
                  actor_id: string | null
                  action: string
                  entity_type: string
                  entity_id: string
                  created_at: string
                }) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(e.created_at)}
                    </TableCell>
                    <TableCell>
                      {e.actor_id ? nameMap.get(e.actor_id) ?? e.actor_id.slice(0, 8) : 'System'}
                    </TableCell>
                    <TableCell className="font-medium">{e.action}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.entity_type}/{e.entity_id.slice(0, 8)}
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

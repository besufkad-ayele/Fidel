import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { SectionCard } from '@/components/admin/section-card'
import { StatusBadge } from '@/components/admin/status-badge'
import { createAdminDb } from '@/lib/admin/db'
import { formatDate } from '@/lib/admin/constants'
import { GrantForm } from './grant-form'
import {
  revokeEntitlementAction,
  extendEntitlementAction,
} from '@/app/(admin)/admin/manage-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata: Metadata = { title: 'Entitlements' }

export default async function EntitlementsPage() {
  const db = await createAdminDb()
  const [{ data: entitlements }, { data: students }, { data: units }, { data: profiles }] =
    await Promise.all([
      db
        .from('entitlements')
        .select(
          'id, student_id, scope, level_id, unit_id, source, status, granted_at, expires_at, note',
        )
        .order('granted_at', { ascending: false })
        .limit(100),
      db.from('profiles').select('id, full_name, email').eq('role', 'student').order('full_name'),
      db.from('units').select('id, title, level_id').order('sort_order'),
      db.from('profiles').select('id, full_name, email'),
    ])

  const nameMap = new Map<string, string>(
    (profiles ?? []).map((p: { id: string; full_name: string; email: string }) => [
      p.id,
      p.full_name || p.email,
    ]),
  )

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="People & access"
        title="Entitlements"
        description="Grant levels or specific units after a student already exists."
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <SectionCard title="Grant access">
          <GrantForm students={students ?? []} units={units ?? []} />
        </SectionCard>

        <div>
          {(entitlements ?? []).length === 0 ? (
            <EmptyState
              title="No entitlements yet"
              description="Grant a level or unit to a student. Access never depends on payment status alone."
            />
          ) : (
            <div className="admin-table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(entitlements ?? []).map(
                    (e: {
                      id: string
                      student_id: string
                      scope: string
                      level_id: string | null
                      unit_id: string | null
                      source: string
                      status: string
                      expires_at: string | null
                    }) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">
                          {nameMap.get(e.student_id) ?? e.student_id.slice(0, 8)}
                        </TableCell>
                        <TableCell>{e.scope}</TableCell>
                        <TableCell>{e.level_id || e.unit_id}</TableCell>
                        <TableCell className="capitalize">{e.source.replace(/_/g, ' ')}</TableCell>
                        <TableCell>
                          <StatusBadge status={e.status} />
                        </TableCell>
                        <TableCell>{formatDate(e.expires_at)}</TableCell>
                        <TableCell className="text-right">
                          {e.status === 'active' ? (
                            <div className="flex flex-col items-end gap-2">
                              <form action={extendEntitlementAction} className="flex items-center gap-1">
                                <input type="hidden" name="id" value={e.id} />
                                <Input
                                  name="expiresAt"
                                  type="date"
                                  className="h-8 w-[140px]"
                                  defaultValue={e.expires_at ? e.expires_at.slice(0, 10) : ''}
                                />
                                <Button type="submit" size="sm" variant="outline">
                                  Extend
                                </Button>
                              </form>
                              <form action={revokeEntitlementAction} className="flex items-center gap-1">
                                <input type="hidden" name="id" value={e.id} />
                                <Input
                                  name="reason"
                                  placeholder="Revoke reason"
                                  className="h-8 w-[160px]"
                                  required
                                />
                                <Button type="submit" size="sm" variant="destructive">
                                  Revoke
                                </Button>
                              </form>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
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

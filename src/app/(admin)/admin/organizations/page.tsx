import Link from 'next/link'
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

export const metadata: Metadata = { title: 'Organizations' }

export default async function OrganizationsPage() {
  const db = await createAdminDb()
  const { data: orgs } = await db
    .from('organizations')
    .select('id, name, type, billing_contact_name, billing_contact_email, created_at')
    .order('name')

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="People & access"
        title="Organizations"
        description="Embassies, NGOs, and universities that buy on behalf of learners."
        actions={[{ label: 'New organization', href: '/admin/organizations/new' }]}
      />

      {(orgs ?? []).length === 0 ? (
        <EmptyState
          title="No organizations yet"
          description="Create an organization so student provisioning can attach a sponsor and billing contact."
          actionLabel="New organization"
          actionHref="/admin/organizations/new"
        />
      ) : (
        <div className="admin-table-wrap">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Billing contact</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(orgs ?? []).map(
                (org: {
                  id: string
                  name: string
                  type: string
                  billing_contact_name: string | null
                  billing_contact_email: string | null
                  created_at: string
                }) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium text-green-700">
                      <Link
                        href={`/admin/organizations/${org.id}` as '/'}
                        className="hover:underline"
                      >
                        {org.name}
                      </Link>
                    </TableCell>
                    <TableCell className="capitalize">{org.type.replace(/_/g, ' ')}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {org.billing_contact_name || org.billing_contact_email || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(org.created_at)}
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="mt-4 text-sm text-muted-foreground">
        Cohorts live under{' '}
        <Link href={'/admin/cohorts' as '/'} className="text-green-700 hover:underline">
          Cohorts
        </Link>
        .
      </p>
    </div>
  )
}

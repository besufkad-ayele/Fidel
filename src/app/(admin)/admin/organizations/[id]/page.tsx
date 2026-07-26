import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { SectionCard } from '@/components/admin/section-card'
import { ConfirmForm } from '@/components/admin/confirm-form'
import { createAdminDb } from '@/lib/admin/db'
import {
  updateOrganizationFormAction,
  deleteOrganizationAction,
} from '@/app/(admin)/admin/manage-actions'
import { ORG_TYPES } from '@/lib/admin/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const db = await createAdminDb()
  const { data } = await db.from('organizations').select('name').eq('id', id).maybeSingle()
  return { title: data?.name || 'Organization' }
}

export default async function OrganizationDetailPage({ params }: Props) {
  const { id } = await params
  const db = await createAdminDb()
  const { data: org } = await db.from('organizations').select('*').eq('id', id).maybeSingle()
  if (!org) notFound()

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={org.name}
        description="Update sponsor details or remove the organization."
        actions={[{ label: 'All organizations', href: '/admin/organizations', variant: 'outline' }]}
      />

      <SectionCard title="Edit organization">
        <form action={updateOrganizationFormAction} className="space-y-4">
          <input type="hidden" name="id" value={id} />
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" className="mt-1.5" defaultValue={org.name} required />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              defaultValue={org.type}
            >
              {ORG_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="country">Country (ISO)</Label>
            <Input
              id="country"
              name="country"
              className="mt-1.5"
              maxLength={2}
              defaultValue={org.country ?? ''}
            />
          </div>
          <div>
            <Label htmlFor="billingContactName">Billing contact name</Label>
            <Input
              id="billingContactName"
              name="billingContactName"
              className="mt-1.5"
              defaultValue={org.billing_contact_name ?? ''}
            />
          </div>
          <div>
            <Label htmlFor="billingContactEmail">Billing contact email</Label>
            <Input
              id="billingContactEmail"
              name="billingContactEmail"
              type="email"
              className="mt-1.5"
              defaultValue={org.billing_contact_email ?? ''}
            />
          </div>
          <div>
            <Label htmlFor="billingAddress">Billing address</Label>
            <Textarea
              id="billingAddress"
              name="billingAddress"
              className="mt-1.5"
              rows={2}
              defaultValue={org.billing_address ?? ''}
            />
          </div>
          <div>
            <Label htmlFor="taxId">Tax ID</Label>
            <Input id="taxId" name="taxId" className="mt-1.5" defaultValue={org.tax_id ?? ''} />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" className="mt-1.5" rows={3} defaultValue={org.notes ?? ''} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Save changes</Button>
            <Button asChild variant="outline">
              <Link href={'/admin/organizations' as '/'}>Cancel</Link>
            </Button>
          </div>
        </form>
      </SectionCard>

      <div className="mt-6 rounded-xl border border-danger-500/30 bg-danger-50 p-5">
        <h2 className="font-semibold text-danger-500">Danger zone</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Deleting is blocked while students are still attached to this organization.
        </p>
        <div className="mt-3">
          <ConfirmForm
            action={deleteOrganizationAction.bind(null, id)}
            message={`Delete organization "${org.name}" permanently?`}
            label="Delete organization"
          />
        </div>
      </div>
    </div>
  )
}

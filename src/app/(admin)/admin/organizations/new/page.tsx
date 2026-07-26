import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { OrganizationForm } from './organization-form'

export const metadata: Metadata = { title: 'New organization' }

export default function NewOrganizationPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New organization"
        description="Used as the payer on student entitlements and payment records."
      />
      <OrganizationForm />
    </div>
  )
}

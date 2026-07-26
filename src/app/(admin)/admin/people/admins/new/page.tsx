import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { AdminForm } from './admin-form'

export const metadata: Metadata = { title: 'Create admin' }

export default function NewAdminPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Create admin"
        description="Deliberately spare. Creating a Super Admin requires typing SUPERADMIN."
      />
      <AdminForm />
    </div>
  )
}

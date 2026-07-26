import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { createAdminDb } from '@/lib/admin/db'
import { StudentForm } from './student-form'

export const metadata: Metadata = { title: 'Create student' }

export default async function NewStudentPage() {
  const db = await createAdminDb()
  const [orgs, teachers, units] = await Promise.all([
    db.from('organizations').select('id, name, type').order('name'),
    db.from('profiles').select('id, full_name').eq('role', 'teacher').eq('is_active', true),
    db.from('units').select('id, title, level_id').order('sort_order'),
  ])

  return (
    <div>
      <PageHeader
        eyebrow="People"
        title="Create student"
        description="Provision an account with a password, grant access, and record payment. No email invite required."
        breadcrumbs={[
          { label: 'People', href: '/admin/people' },
          { label: 'New student' },
        ]}
      />
      <StudentForm
        organizations={orgs.data ?? []}
        teachers={teachers.data ?? []}
        units={units.data ?? []}
      />
    </div>
  )
}

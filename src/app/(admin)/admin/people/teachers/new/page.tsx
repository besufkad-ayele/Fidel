import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { TeacherForm } from './teacher-form'

export const metadata: Metadata = { title: 'Create teacher' }

export default function NewTeacherPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="People"
        title="Create teacher"
        description="Set a password so the teacher can sign in immediately. They connect Google Calendar themselves later."
        breadcrumbs={[
          { label: 'People', href: '/admin/people' },
          { label: 'New teacher' },
        ]}
      />
      <TeacherForm />
    </div>
  )
}

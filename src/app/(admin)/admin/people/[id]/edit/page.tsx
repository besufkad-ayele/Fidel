import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { createAdminDb } from '@/lib/admin/db'
import { PersonEditForm } from './person-edit-form'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const db = await createAdminDb()
  const { data } = await db.from('profiles').select('full_name, email').eq('id', id).maybeSingle()
  return { title: data ? `Edit ${data.full_name || data.email}` : 'Edit person' }
}

export default async function EditPersonPage({ params }: Props) {
  const { id } = await params
  const db = await createAdminDb()
  const { data: profile } = await db
    .from('profiles')
    .select('id, full_name, email, phone, timezone, locale, role')
    .eq('id', id)
    .maybeSingle()

  if (!profile) notFound()

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title={`Edit ${profile.full_name || profile.email}`}
        description={`${profile.role} · ${profile.email}`}
        actions={[{ label: 'Cancel', href: `/admin/people/${id}`, variant: 'outline' }]}
      />
      <PersonEditForm
        id={profile.id}
        fullName={profile.full_name || ''}
        phone={profile.phone || ''}
        timezone={profile.timezone || 'Africa/Addis_Ababa'}
        locale={profile.locale || 'en'}
      />
    </div>
  )
}

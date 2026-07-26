'use server'

import { createCohortAction as createCohort } from '@/app/(admin)/admin/actions'
import { redirect } from 'next/navigation'

export async function createCohortFormAction(formData: FormData) {
  const result = await createCohort(formData)
  if (!result.ok) {
    redirect(`/admin/cohorts?error=${encodeURIComponent(result.error ?? 'Failed')}`)
  }
  redirect('/admin/cohorts')
}

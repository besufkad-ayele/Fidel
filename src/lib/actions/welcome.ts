'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { requireAuth } from '@/lib/auth/guards'
import { homeForRole } from '@/lib/auth/roles'
import { routes } from '@/lib/auth/routes'
import { getCurrentProfile } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export async function completeWelcome() {
  await requireAuth()
  const profile = await getCurrentProfile()
  if (!profile) redirect(routes.login)

  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ welcome_seen_at: new Date().toISOString() })
    .eq('id', profile.id)

  if (error) {
    console.error('[completeWelcome]', error.message)
    throw new Error('Could not finish welcome. Please try again.')
  }

  const destination = homeForRole(profile.role) as Route
  revalidatePath(routes.welcome)
  revalidatePath(destination)
  redirect(destination)
}

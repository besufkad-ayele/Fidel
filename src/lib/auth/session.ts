import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const PROFILE_FIELDS =
  'id, role, admin_title, full_name, avatar_url, email, locale, timezone, is_active, welcome_seen_at' as const

/**
 * Validates the JWT with the auth server. Never use `getSession()` in server code —
 * it trusts the cookie without verifying it.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', user.id)
    .single()

  return data
})

export type CurrentProfile = NonNullable<Awaited<ReturnType<typeof getCurrentProfile>>>

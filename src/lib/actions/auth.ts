'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { destinationForProfile } from '@/lib/auth/destination'
import { homeForRole, isRole } from '@/lib/auth/roles'
import { routes } from '@/lib/auth/routes'
import { clearSessionStarted, markSessionStarted } from '@/lib/auth/session-cookies'
import type { ActionResult } from '@/types/actions'
import type { Route } from 'next'

const loginSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1),
  next: z.string().optional(),
})

function safeNext(next: string | undefined): Route | null {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return null
  return next as Route
}

async function profileDestination(userId: string, fallbackRole?: unknown): Promise<Route> {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, welcome_seen_at, is_active')
    .eq('id', userId)
    .single()

  if (!profile) {
    return homeForRole(isRole(fallbackRole) ? fallbackRole : 'student') as Route
  }
  if (!profile.is_active) {
    return routes.loginInactive
  }
  return destinationForProfile(profile)
}

export async function signIn(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'validation', fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  // Clear any prior session first so logging in as B while A’s cookies remain
  // cannot leave the browser stuck on A’s account.
  await supabase.auth.signOut({ scope: 'local' })

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    // Surface the real auth error in the server log — the UI stays generic so we
    // do not leak whether the account exists.
    console.error('[signIn]', error.status, error.code, error.message)
    if (error.message.toLowerCase().includes('rate') || error.status === 429) {
      return { ok: false, error: 'rateLimited' }
    }
    return { ok: false, error: 'invalidCredentials' }
  }

  if (!data.user) {
    return { ok: false, error: 'invalidCredentials' }
  }

  // Guard against a mismatched cookie race: session email must match the form.
  if (data.user.email?.toLowerCase() !== parsed.data.email.toLowerCase()) {
    await supabase.auth.signOut({ scope: 'local' })
    return { ok: false, error: 'invalidCredentials' }
  }

  await markSessionStarted()

  const next = safeNext(parsed.data.next)
  const destination = next ?? (await profileDestination(data.user.id, data.user.app_metadata?.role))

  redirect(destination)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'global' })
  await clearSessionStarted()
  redirect(routes.login)
}

const forgotSchema = z.object({
  email: z.email().toLowerCase(),
})

export async function requestPasswordReset(input: unknown): Promise<ActionResult> {
  const parsed = forgotSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'validation' }
  }

  // Always return success — do not leak whether the email exists.
  // Creates an admin-facing request instead of sending a Supabase recovery email.
  try {
    const admin = createAdminClient()
    const email = parsed.data.email
    const { data: profile } = await admin
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', email)
      .maybeSingle()

    if (profile) {
      const { data: existing } = await admin
        .from('password_reset_requests')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('status', 'pending')
        .maybeSingle()

      if (!existing) {
        await admin.from('password_reset_requests').insert({
          profile_id: profile.id,
          email: profile.email,
          status: 'pending',
        })
      }
    }
  } catch (err) {
    console.error('[requestPasswordReset]', err)
  }

  return { ok: true, data: undefined }
}

const setPasswordSchema = z.object({
  password: z.string().min(8),
  confirm: z.string().min(8),
  mode: z.enum(['activate', 'reset']).default('activate'),
})

export async function setPassword(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = setPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'validation' }
  }

  if (parsed.data.password !== parsed.data.confirm) {
    return { ok: false, error: 'mismatch' }
  }
  if (parsed.data.password.length < 8) {
    return { ok: false, error: 'tooShort' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'noSession' }
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    console.error('[setPassword]', error.message)
    return { ok: false, error: 'failed' }
  }

  await supabase
    .from('profiles')
    .update({
      activated_at: new Date().toISOString(),
      is_active: true,
    })
    .eq('id', user.id)

  await markSessionStarted()
  redirect(await profileDestination(user.id, user.app_metadata?.role))
}

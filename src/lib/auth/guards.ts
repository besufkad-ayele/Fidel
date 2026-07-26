import 'server-only'
import { redirect } from 'next/navigation'
import { getCurrentProfile, getCurrentUser } from './session'
import { homeForRole, type Role } from './roles'
import { routes } from './routes'
import type { Route } from 'next'

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) redirect(routes.login)
  return user
}

export async function requireRole(role: Role) {
  const user = await requireAuth()
  const profile = await getCurrentProfile()

  if (!profile) redirect(routes.login)
  // Suspension is an administrative act with contractual meaning (a lapsed embassy
  // contract), so it must bite on the next request rather than at session expiry.
  if (!profile.is_active) redirect(routes.loginInactive)
  if (profile.role !== role) redirect(homeForRole(profile.role) as Route)

  return { user, profile }
}

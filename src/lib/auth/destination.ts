import 'server-only'
import type { Route } from 'next'
import { homeForRole, type Role } from './roles'
import { routes } from './routes'

type DestinationProfile = {
  role: Role
  welcome_seen_at: string | null
}

/**
 * Where a signed-in user should land after login / password setup / welcome.
 * Students see /welcome once; teachers and admins go straight to their home.
 */
export function destinationForProfile(profile: DestinationProfile): Route {
  if (profile.role === 'student' && !profile.welcome_seen_at) {
    return routes.welcome
  }
  return homeForRole(profile.role) as Route
}

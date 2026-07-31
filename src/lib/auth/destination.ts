import 'server-only'
import type { Route } from 'next'
import { homeForRole, type Role } from './roles'

type DestinationProfile = {
  role: Role
  welcome_seen_at?: string | null
}

/**
 * Where a signed-in user lands after login / password setup.
 * Admin-provisioned students go straight to the dashboard (no set-password /
 * welcome gate). Forgot-password still uses /reset-password separately.
 */
export function destinationForProfile(profile: DestinationProfile): Route {
  return homeForRole(profile.role) as Route
}

import type { Route } from 'next'

/** Typed route helpers — keeps `typedRoutes` happy with query strings. */
export const routes = {
  home: '/' as Route,
  about: '/about' as Route,
  services: '/services' as Route,
  contact: '/contact' as Route,
  blog: '/blog' as Route,
  login: '/login' as Route,
  loginInactive: '/login?error=inactive' as Route,
  loginNoAccount: '/login?error=no_account' as Route,
  forgotPassword: '/forgot-password' as Route,
  setPassword: '/set-password' as Route,
  resetPassword: '/reset-password' as Route,
  welcome: '/welcome' as Route,
  dashboard: '/dashboard' as Route,
  teach: '/teach' as Route,
  admin: '/admin' as Route,
} as const

export function loginWithNext(next: string): Route {
  return `/login?next=${encodeURIComponent(next)}` as Route
}

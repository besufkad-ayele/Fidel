export const roles = ['student', 'teacher', 'admin'] as const

export type Role = (typeof roles)[number]

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (roles as readonly string[]).includes(value)
}

const roleHome: Record<Role, `/${string}`> = {
  student: '/dashboard',
  teacher: '/teach',
  admin: '/admin',
}

export function homeForRole(role: Role | null | undefined) {
  return role && isRole(role) ? roleHome[role] : '/login'
}

/**
 * Coarse prefixes the proxy uses to decide whether a session is required at all.
 * Authorization by role happens in the layout guards, not here.
 */
export const protectedPrefixes = [
  '/dashboard',
  '/levels',
  '/vocabulary',
  '/sessions',
  '/homework',
  '/progress',
  '/certificates',
  '/account',
  '/welcome',
  '/teach',
  '/admin',
] as const

/** Auth screens a signed-in user should be bounced away from. */
export const authOnlyPaths = ['/login', '/forgot-password'] as const

export function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

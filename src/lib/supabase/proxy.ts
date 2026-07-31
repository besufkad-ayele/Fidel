import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { publicEnv } from '@/lib/env'
import { authOnlyPaths, homeForRole, isProtectedPath, isRole } from '@/lib/auth/roles'
import {
  SESSION_MAX_AGE_MS,
  SESSION_STARTED_COOKIE,
  isSessionExpired,
} from '@/lib/auth/session-timeout'
import type { Database } from '@/types/database.types'

/**
 * Refreshes the Supabase session cookie and performs coarse redirects only.
 *
 * This is a convenience, not a security boundary — it never reads the database.
 * Role checks live in the layout guards (`lib/auth/guards.ts`) and in RLS.
 */
export async function updateSession(request: NextRequest) {
  // This exact response object is the one whose cookies get mutated below, and it
  // is what we return. Copying its headers onto a fresh response silently breaks
  // token refresh — the most common @supabase/ssr bug.
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname, search } = request.nextUrl

  // Absolute 1-week session from login cookie (JWT may still refresh otherwise).
  if (user) {
    const startedRaw = request.cookies.get(SESSION_STARTED_COOKIE)?.value
    const started = startedRaw ? Number(startedRaw) : NaN
    if (Number.isFinite(started) && isSessionExpired(started)) {
      await supabase.auth.signOut({ scope: 'global' })
      response.cookies.set(SESSION_STARTED_COOKIE, '', {
        path: '/',
        maxAge: 0,
      })
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.search = ''
      url.searchParams.set('error', 'session_expired')
      return redirectPreservingCookies(url, response)
    }
    // Existing sessions created before this cookie existed — start the clock now.
    if (!Number.isFinite(started)) {
      response.cookies.set(SESSION_STARTED_COOKIE, String(Date.now()), {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: Math.ceil(SESSION_MAX_AGE_MS / 1000),
      })
    }
  }

  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    url.searchParams.set('next', `${pathname}${search}`)
    return redirectPreservingCookies(url, response)
  }

  if (user && authOnlyPaths.some((path) => pathname === path)) {
    // The role claim is written into the JWT by the custom access token hook, so
    // this stays a zero-query decision. Layout guards correct a missing claim.
    const claimedRole = user.app_metadata?.role
    const url = request.nextUrl.clone()
    url.pathname = homeForRole(isRole(claimedRole) ? claimedRole : 'student')
    url.search = ''
    return redirectPreservingCookies(url, response)
  }

  return response
}

function redirectPreservingCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url)
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
  return redirect
}

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { publicEnv } from '@/lib/env'
import { SESSION_STARTED_COOKIE } from '@/lib/auth/session-timeout'
import type { Database } from '@/types/database.types'

export async function POST(request: NextRequest) {
  const cookiesToApply: { name: string; value: string; options?: Parameters<NextResponse['cookies']['set']>[2] }[] =
    []

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            cookiesToApply.push({ name, value, options }),
          )
        },
      },
    },
  )

  // Global clears refresh tokens server-side so the old session cannot revive.
  await supabase.auth.signOut({ scope: 'global' })

  const error = request.nextUrl.searchParams.get('error')
  const loginPath = error === 'session_expired' ? '/login?error=session_expired' : '/login'
  const res = NextResponse.redirect(new URL(loginPath, request.nextUrl.origin), {
    status: 303,
  })
  cookiesToApply.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, options)
  })
  res.cookies.set(SESSION_STARTED_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}

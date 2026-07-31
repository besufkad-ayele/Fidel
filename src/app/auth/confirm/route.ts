import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { publicEnv } from '@/lib/env'
import type { Database } from '@/types/database.types'

/**
 * Handles invite / recovery / email_change links from Supabase Auth emails.
 * Supports both token_hash OTP links and PKCE `code` exchanges.
 *
 * Always redirects on the same origin as the request (never env localhost).
 * Clears any prior session before exchanging so an invite for user B cannot
 * keep user A's cookies and show the wrong "signed in as" on /set-password.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  const origin = request.nextUrl.origin
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

  // Drop any existing session before accepting invite/recovery tokens.
  await supabase.auth.signOut({ scope: 'local' })

  function redirect(path: string) {
    const res = NextResponse.redirect(new URL(path, origin))
    cookiesToApply.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, options)
    })
    return res
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth/confirm] exchangeCodeForSession', error.message)
      return redirect('/login?error=invalid_link')
    }

    if (type === 'recovery') return redirect('/reset-password')
    if (type === 'invite' || type === 'signup') return redirect('/set-password')
    if (next && next.startsWith('/') && !next.startsWith('//')) return redirect(next)
    return redirect('/set-password')
  }

  if (!token_hash || !type) {
    return redirect('/login?error=invalid_link')
  }

  const { error } = await supabase.auth.verifyOtp({
    type: type as 'invite' | 'recovery' | 'email' | 'email_change' | 'signup',
    token_hash,
  })

  if (error) {
    console.error('[auth/confirm] verifyOtp', error.message)
    return redirect('/login?error=invalid_link')
  }

  if (type === 'invite' || type === 'signup') return redirect('/set-password')
  if (type === 'recovery') return redirect('/reset-password')
  if (next && next.startsWith('/') && !next.startsWith('//')) return redirect(next)
  return redirect('/dashboard')
}

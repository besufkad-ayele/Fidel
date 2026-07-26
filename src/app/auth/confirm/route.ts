import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { publicEnv } from '@/lib/env'

/**
 * Handles invite / recovery / email_change links from Supabase Auth emails.
 * Supports both token_hash OTP links and PKCE `code` exchanges.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  const site = publicEnv.NEXT_PUBLIC_SITE_URL
  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth/confirm] exchangeCodeForSession', error.message)
      return NextResponse.redirect(new URL('/login?error=invalid_link', site))
    }

    // Recovery flows should land on reset-password; invites on set-password.
    if (type === 'recovery') {
      return NextResponse.redirect(new URL('/reset-password', site))
    }
    if (type === 'invite' || type === 'signup') {
      return NextResponse.redirect(new URL('/set-password', site))
    }
    return NextResponse.redirect(
      new URL(next && next.startsWith('/') ? next : '/set-password', site),
    )
  }

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL('/login?error=invalid_link', site))
  }

  const { error } = await supabase.auth.verifyOtp({
    type: type as 'invite' | 'recovery' | 'email' | 'email_change' | 'signup',
    token_hash,
  })

  if (error) {
    console.error('[auth/confirm] verifyOtp', error.message)
    return NextResponse.redirect(new URL('/login?error=invalid_link', site))
  }

  if (type === 'invite' || type === 'signup') {
    return NextResponse.redirect(new URL('/set-password', site))
  }
  if (type === 'recovery') {
    return NextResponse.redirect(new URL('/reset-password', site))
  }

  return NextResponse.redirect(new URL(next && next.startsWith('/') ? next : '/dashboard', site))
}

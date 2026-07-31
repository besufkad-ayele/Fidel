import 'server-only'
import { cookies } from 'next/headers'
import {
  SESSION_MAX_AGE_MS,
  SESSION_STARTED_COOKIE,
} from '@/lib/auth/session-timeout'

export async function markSessionStarted(at = Date.now()) {
  const store = await cookies()
  store.set(SESSION_STARTED_COOKIE, String(at), {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false, // client SessionTimeoutGuard must read it
    maxAge: Math.ceil(SESSION_MAX_AGE_MS / 1000),
  })
}

export async function clearSessionStarted() {
  const store = await cookies()
  store.set(SESSION_STARTED_COOKIE, '', {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
    maxAge: 0,
  })
}

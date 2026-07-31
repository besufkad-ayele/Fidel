'use client'

import { useEffect, useEffectEvent } from 'react'
import {
  LAST_SEEN_STORAGE_KEY,
  SESSION_STARTED_COOKIE,
  isBrowserCloseExpired,
  isSessionExpired,
} from '@/lib/auth/session-timeout'

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function readLastSeen(): number | null {
  try {
    const raw = localStorage.getItem(LAST_SEEN_STORAGE_KEY)
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

function writeLastSeen(at = Date.now()) {
  try {
    localStorage.setItem(LAST_SEEN_STORAGE_KEY, String(at))
  } catch {
    // private mode / quota — ignore
  }
}

function clearLastSeen() {
  try {
    localStorage.removeItem(LAST_SEEN_STORAGE_KEY)
  } catch {
    // ignore
  }
}

async function forceSignOut() {
  clearLastSeen()
  try {
    await fetch('/auth/signout', {
      method: 'POST',
      credentials: 'same-origin',
      redirect: 'manual',
    })
  } catch {
    // fall through to hard navigation
  }
  window.location.assign('/login?error=session_expired')
}

/**
 * Enforces:
 * - absolute 1-week session from login cookie
 * - re-login if the browser/tab was away longer than the same window
 */
export function SessionTimeoutGuard() {
  const enforce = useEffectEvent(() => {
    const startedRaw = readCookie(SESSION_STARTED_COOKIE)
    if (startedRaw) {
      const started = Number(startedRaw)
      if (Number.isFinite(started) && isSessionExpired(started)) {
        void forceSignOut()
        return
      }
    }

    const lastSeen = readLastSeen()
    if (lastSeen != null && isBrowserCloseExpired(lastSeen)) {
      void forceSignOut()
      return
    }

    writeLastSeen()
  })

  useEffect(() => {
    enforce()

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        writeLastSeen()
        return
      }
      enforce()
    }

    const onPageHide = () => writeLastSeen()

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)

    // Heartbeat while the tab is visible so a long idle open tab does not
    // look like a browser-close timeout on the next navigation.
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        const startedRaw = readCookie(SESSION_STARTED_COOKIE)
        if (startedRaw) {
          const started = Number(startedRaw)
          if (Number.isFinite(started) && isSessionExpired(started)) {
            void forceSignOut()
            return
          }
        }
        writeLastSeen()
      }
    }, 60_000)

    // Absolute cap check (every minute).
    const absolute = window.setInterval(() => {
      const startedRaw = readCookie(SESSION_STARTED_COOKIE)
      if (!startedRaw) return
      const started = Number(startedRaw)
      if (Number.isFinite(started) && isSessionExpired(started)) {
        void forceSignOut()
      }
    }, 60_000)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
      window.clearInterval(heartbeat)
      window.clearInterval(absolute)
    }
  }, [enforce])

  return null
}

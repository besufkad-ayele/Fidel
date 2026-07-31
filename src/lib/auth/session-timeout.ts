/** Absolute session lifetime from login (matches cookie maxAge). */
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 1 week

/**
 * If the browser was closed (or tab hidden) longer than this, require re-login.
 * Kept at the same window as the absolute session for now so overnight / multi-day
 * use does not bounce people back to login.
 */
export const BROWSER_CLOSE_TIMEOUT_MS = SESSION_MAX_AGE_MS

export const SESSION_STARTED_COOKIE = 'fidel_sess_started'
export const LAST_SEEN_STORAGE_KEY = 'fidel_last_seen'

export function isSessionExpired(startedAtMs: number, now = Date.now()): boolean {
  return now - startedAtMs >= SESSION_MAX_AGE_MS
}

export function isBrowserCloseExpired(lastSeenMs: number, now = Date.now()): boolean {
  return now - lastSeenMs >= BROWSER_CLOSE_TIMEOUT_MS
}

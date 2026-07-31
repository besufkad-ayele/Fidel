/**
 * Resolve the public site origin for auth emails, absolute redirects, and metadata.
 *
 * On Vercel, never fall back to localhost when `NEXT_PUBLIC_SITE_URL` is missing
 * or still set to a local URL from `.env.example` / a bad deploy env.
 */
function isLocalHost(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return hostname === 'localhost' || hostname === '127.0.0.1'
  } catch {
    return false
  }
}

function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, '')
}

function vercelOrigin(): string | null {
  // Prefer the current deployment host (preview or production), then the
  // production hostname as a last resort when VERCEL_URL is missing.
  const host =
    process.env.VERCEL_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (!host) return null
  const cleaned = host.replace(/^https?:\/\//, '').replace(/\/$/, '')
  return `https://${cleaned}`
}

/**
 * Absolute public origin. Prefer an explicit non-local `NEXT_PUBLIC_SITE_URL`,
 * then Vercel’s host, then localhost for local dev only.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const onVercel = Boolean(process.env.VERCEL)

  if (configured && !(onVercel && isLocalHost(configured))) {
    return normalizeOrigin(configured)
  }

  const fromVercel = vercelOrigin()
  if (fromVercel) return fromVercel

  if (configured) return normalizeOrigin(configured)
  return 'http://localhost:3000'
}

/** Auth email / generateLink redirect target (always goes through `/auth/confirm`). */
export function authConfirmUrl(type: 'invite' | 'recovery'): string {
  return `${getSiteUrl()}/auth/confirm?type=${type}`
}

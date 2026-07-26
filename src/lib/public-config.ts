/**
 * Client-safe public config. Prefer this over `@/lib/env` in client components —
 * zod parsing of the full env module can throw and blank the marketing shell.
 */
export function getRequestAccessUrl(): string {
  return process.env.NEXT_PUBLIC_REQUEST_ACCESS_URL?.trim() ?? ''
}

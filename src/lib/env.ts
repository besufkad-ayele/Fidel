import { z } from 'zod'
import { getSiteUrl } from '@/lib/site-url'

/**
 * `NEXT_PUBLIC_*` variables must be referenced as literal property accesses so the
 * Next.js compiler can inline them into the client bundle. Destructuring
 * `process.env` here would silently ship `undefined` to the browser.
 *
 * `NEXT_PUBLIC_SITE_URL` is resolved via `getSiteUrl()` so Vercel deploys do not
 * silently keep the localhost default from `.env.example`.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_URL: z.url(),
  /** External Typeform / Google Form / etc. Empty string means CTA is hidden until set. */
  NEXT_PUBLIC_REQUEST_ACCESS_URL: z.string().default(''),
})

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: getSiteUrl(),
  NEXT_PUBLIC_REQUEST_ACCESS_URL: process.env.NEXT_PUBLIC_REQUEST_ACCESS_URL ?? '',
})

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
})

/**
 * Read lazily rather than at module load: importing anything from this file in a
 * client component would otherwise throw, and secrets should only be resolved at
 * the moment trusted server code actually needs them.
 */
export function serverEnv() {
  return serverSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })
}

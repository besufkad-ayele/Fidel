import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { publicEnv, serverEnv } from '@/lib/env'
import type { Database } from '@/types/database.types'

/**
 * Service-role client. Bypasses RLS entirely.
 *
 * Permitted uses only: admin user provisioning, certificate generation, signed URL
 * issuance, seeding, and cron. Anything a logged-in user triggers on their own
 * behalf must go through `lib/supabase/server.ts` so RLS still applies.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv().SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

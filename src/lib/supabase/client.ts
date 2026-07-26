'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

/**
 * Browser client. Permitted uses: auth callbacks and Realtime subscriptions.
 * Data reads belong in `lib/data/` on the server — see docs/01-architecture.md §4.1.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

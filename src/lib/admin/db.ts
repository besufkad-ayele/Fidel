import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Service-role DB client for admin tooling.
 *
 * Callers must already have passed `requireRole('admin')` (or equivalent).
 * Using the cookie-bound user client here silently fails: RLS blocks cross-user
 * writes, and `fidel.guard_role_change` rejects role updates unless the request
 * is service_role.
 */
export function createAdminDb() {
  return createAdminClient() as unknown as {
    from: (table: string) => any
    rpc: (fn: string, args?: Record<string, unknown>) => any
  }
}

export async function writeAudit(entry: {
  actorId: string
  actorRole: string
  action: string
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
}) {
  const db = createAdminDb()
  const { error } = await db.from('audit_log').insert({
    actor_id: entry.actorId,
    actor_role: entry.actorRole,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    metadata: entry.metadata ?? {},
  })
  if (error) {
    console.error('[writeAudit]', error.message)
  }
}

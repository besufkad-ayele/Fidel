'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/guards'
import { createAdminDb, writeAudit } from '@/lib/admin/db'

async function resolveRequest(
  id: string,
  status: 'fulfilled' | 'dismissed',
  actorId: string,
) {
  const db = await createAdminDb()
  const now = new Date().toISOString()
  const { data, error } = await db
    .from('password_reset_requests')
    .update({
      status,
      resolved_by: actorId,
      resolved_at: now,
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id, profile_id, email')
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function dismissPasswordResetRequestAction(id: string): Promise<void> {
  const { user, profile } = await requireRole('admin')
  const row = await resolveRequest(id, 'dismissed', user.id)
  if (!row) return

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'password_reset.dismiss',
    entityType: 'password_reset_request',
    entityId: id,
    metadata: { email: row.email, profileId: row.profile_id },
  })

  revalidatePath('/admin/notifications')
  revalidatePath('/admin')
  revalidatePath(`/admin/people/${row.profile_id}`)
}

export async function fulfillPasswordResetRequestForProfile(
  profileId: string,
  actorId: string,
  actorRole: string,
): Promise<void> {
  const db = await createAdminDb()
  const now = new Date().toISOString()
  const { data: rows, error } = await db
    .from('password_reset_requests')
    .update({
      status: 'fulfilled',
      resolved_by: actorId,
      resolved_at: now,
    })
    .eq('profile_id', profileId)
    .eq('status', 'pending')
    .select('id, email')

  if (error) throw new Error(error.message)
  for (const row of rows ?? []) {
    await writeAudit({
      actorId,
      actorRole,
      action: 'password_reset.fulfill',
      entityType: 'password_reset_request',
      entityId: row.id,
      metadata: { email: row.email, profileId },
    })
  }

  revalidatePath('/admin/notifications')
  revalidatePath('/admin')
  revalidatePath(`/admin/people/${profileId}`)
}

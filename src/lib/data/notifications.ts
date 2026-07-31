import 'server-only'

import { cache } from 'react'
import { createAdminDb } from '@/lib/admin/db'

export type PasswordResetRequestItem = {
  id: string
  profileId: string
  email: string
  fullName: string | null
  role: string | null
  status: 'pending' | 'fulfilled' | 'dismissed'
  createdAt: string
  resolvedAt: string | null
}

export const countPendingPasswordResetRequests = cache(async (): Promise<number> => {
  const db = await createAdminDb()
  const { count, error } = await db
    .from('password_reset_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  if (error) {
    console.error('[notifications] count pending reset failed:', error.message)
    return 0
  }
  return count ?? 0
})

export const listPasswordResetRequests = cache(
  async (opts?: { status?: 'pending' | 'all' }): Promise<PasswordResetRequestItem[]> => {
    const db = await createAdminDb()
    let query = db
      .from('password_reset_requests')
      .select('id, profile_id, email, status, created_at, resolved_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (opts?.status === 'pending' || !opts?.status) {
      query = query.eq('status', 'pending')
    }

    const { data, error } = await query
    if (error) {
      console.error('[notifications] list reset requests failed:', error.message)
      return []
    }

    const rows = data ?? []
    const profileIds = [
      ...new Set(
        rows.map((r: { profile_id: string }) => r.profile_id),
      ),
    ]
    const profiles = new Map<string, { full_name: string; role: string }>()

    if (profileIds.length > 0) {
      const { data: profileRows } = await db
        .from('profiles')
        .select('id, full_name, role')
        .in('id', profileIds)
      for (const p of profileRows ?? []) {
        profiles.set(p.id, { full_name: p.full_name, role: p.role })
      }
    }

    return rows.map(
      (row: {
        id: string
        profile_id: string
        email: string
        status: 'pending' | 'fulfilled' | 'dismissed'
        created_at: string
        resolved_at: string | null
      }) => {
      const profile = profiles.get(row.profile_id)
      return {
        id: row.id,
        profileId: row.profile_id,
        email: row.email,
        fullName: profile?.full_name ?? null,
        role: profile?.role ?? null,
        status: row.status,
        createdAt: row.created_at,
        resolvedAt: row.resolved_at,
      }
    },
    )
  },
)

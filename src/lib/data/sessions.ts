import 'server-only'

import { cache } from 'react'
import { createAdminDb } from '@/lib/admin/db'
import { needsHappenedConfirmation } from '@/lib/domain/sessions'

export type ActionableSession = {
  id: string
  student_id: string
  teacher_id: string
  scheduled_at: string
  duration_minutes: number
  status: string
  meet_link: string | null
  student_note: string | null
  session_notes: string | null
}

export const listPendingApprovalsForTeacher = cache(async (teacherId: string): Promise<ActionableSession[]> => {
  const db = createAdminDb()
  const { data, error } = await db
    .from('sessions')
    .select(
      'id, student_id, teacher_id, scheduled_at, duration_minutes, status, meet_link, student_note, session_notes',
    )
    .eq('teacher_id', teacherId)
    .eq('status', 'pending')
    .order('scheduled_at', { ascending: true })
    .limit(20)

  if (error) {
    console.error('[sessions] pending approvals failed:', error.message)
    return []
  }
  return data ?? []
})

export const listUnconfirmedPastSessionsForUser = cache(
  async (opts: { userId: string; role: 'student' | 'teacher' }): Promise<ActionableSession[]> => {
    const db = createAdminDb()
    const column = opts.role === 'student' ? 'student_id' : 'teacher_id'
    const { data, error } = await db
      .from('sessions')
      .select(
        'id, student_id, teacher_id, scheduled_at, duration_minutes, status, meet_link, student_note, session_notes',
      )
      .eq(column, opts.userId)
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: false })
      .limit(40)

    if (error) {
      console.error('[sessions] unconfirmed past failed:', error.message)
      return []
    }

    return (data ?? []).filter((s: ActionableSession) => needsHappenedConfirmation(s))
  },
)

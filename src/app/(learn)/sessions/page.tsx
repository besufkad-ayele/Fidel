import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminDb } from '@/lib/admin/db'
import { getCurrentProfile } from '@/lib/auth/session'
import { Button } from '@/components/ui/button'
import { cancelStudentSessionAction } from './actions'

export const metadata: Metadata = { title: 'Live sessions' }

export default async function Page() {
  const profile = await getCurrentProfile()
  if (!profile) return null

  const db = await createAdminDb()
  const { data: sessions } = await db
    .from('sessions')
    .select('id, teacher_id, scheduled_at, status, student_note, session_notes')
    .eq('student_id', profile.id)
    .order('scheduled_at', { ascending: true })

  const teacherIds = Array.from(new Set((sessions ?? []).map((s: { teacher_id: string }) => s.teacher_id)))
  const { data: teachers } = teacherIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', teacherIds)
    : { data: [] as { id: string; full_name: string; email: string }[] }
  const teacherMap = new Map((teachers ?? []).map((t) => [t.id, t.full_name || t.email]))

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-green-700">Live sessions</h1>
          <p className="text-sm text-muted-foreground">
            Book a session, track approvals, and see updates if your teacher proposes a new time.
          </p>
        </div>
        <Button asChild>
          <Link href={'/sessions/book' as '/'}>Book session</Link>
        </Button>
      </div>

      {(sessions ?? []).length === 0 ? (
        <div className="rounded-xl border border-cream-300 bg-cream-50 p-6 text-sm text-muted-foreground">
          No sessions yet. Book your first session.
        </div>
      ) : (
        <div className="space-y-3">
          {(sessions ?? []).map(
            (session: {
              id: string
              teacher_id: string
              scheduled_at: string
              status: string
              student_note: string | null
              session_notes: string | null
            }) => (
              <div key={session.id} className="rounded-xl border border-cream-300 bg-cream-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Teacher</p>
                    <p className="font-medium text-green-700">{teacherMap.get(session.teacher_id) ?? 'Teacher'}</p>
                    <p className="mt-1 text-sm">{new Date(session.scheduled_at).toLocaleString()}</p>
                  </div>
                  <span className="rounded-full border border-cream-400 bg-cream-100 px-2.5 py-1 text-xs font-medium uppercase tracking-wide">
                    {session.status}
                  </span>
                </div>
                {session.student_note ? <p className="mt-2 text-sm">Your note: {session.student_note}</p> : null}
                {session.session_notes ? (
                  <p className="mt-1 text-sm text-muted-foreground">Teacher/Admin note: {session.session_notes}</p>
                ) : null}
                {session.status !== 'cancelled' ? (
                  <form action={cancelStudentSessionAction} className="mt-3 flex items-center gap-2">
                    <input type="hidden" name="id" value={session.id} />
                    <input
                      name="reason"
                      placeholder="Cancel reason (optional)"
                      className="h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm"
                    />
                    <Button type="submit" variant="outline">
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <p className="mt-3 text-sm text-danger-500">
                    This session is canceled. You can book another time from the calendar.
                  </p>
                )}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  )
}

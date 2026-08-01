export type SessionLike = {
  scheduled_at: string
  duration_minutes: number
  status: string
  meet_link?: string | null
}

export function sessionEndsAt(session: Pick<SessionLike, 'scheduled_at' | 'duration_minutes'>): Date {
  return new Date(new Date(session.scheduled_at).getTime() + session.duration_minutes * 60_000)
}

export function sessionHasEnded(session: Pick<SessionLike, 'scheduled_at' | 'duration_minutes'>, now = new Date()): boolean {
  return sessionEndsAt(session).getTime() <= now.getTime()
}

export function isPendingApproval(session: Pick<SessionLike, 'status'>): boolean {
  return session.status === 'pending'
}

export function isConfirmedUpcoming(
  session: Pick<SessionLike, 'status' | 'scheduled_at' | 'duration_minutes'>,
  now = new Date(),
): boolean {
  return session.status === 'scheduled' && !sessionHasEnded(session, now)
}

export function needsHappenedConfirmation(
  session: Pick<SessionLike, 'status' | 'scheduled_at' | 'duration_minutes'>,
  now = new Date(),
): boolean {
  return session.status === 'scheduled' && sessionHasEnded(session, now)
}

/** Active list: pending or scheduled (including past until confirmed). */
export function isActiveSessionRow(session: Pick<SessionLike, 'status'>): boolean {
  return session.status === 'pending' || session.status === 'scheduled'
}

export function normalizeMeetLink(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

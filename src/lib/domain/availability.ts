/**
 * Pure helpers for teacher weekly availability.
 * Weekday: 0 = Sunday … 6 = Saturday (matches Postgres / docs).
 */

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** Default hours when a teacher has not set weekly availability yet. */
export const FALLBACK_SLOT_HOURS = [9, 11, 14, 16] as const

export type AvailabilityBlock = {
  id?: string
  weekday: number
  start_time: string // HH:MM or HH:MM:SS
  end_time: string
  timezone: string
  is_active?: boolean
}

export type TimeOffRange = {
  id?: string
  starts_at: string
  ends_at: string
  reason?: string | null
}

export function normalizeTime(value: string): string {
  const trimmed = value.trim()
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed
  throw new Error(`Invalid time: ${value}`)
}

export function timeToMinutes(value: string): number {
  const [h, m] = normalizeTime(value).split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function validateBlock(block: Pick<AvailabilityBlock, 'weekday' | 'start_time' | 'end_time'>): string | null {
  if (block.weekday < 0 || block.weekday > 6) return 'Weekday must be Sunday–Saturday'
  try {
    const start = timeToMinutes(block.start_time)
    const end = timeToMinutes(block.end_time)
    if (end <= start) return 'End time must be after start time'
    if (end - start < 30) return 'Blocks must be at least 30 minutes'
  } catch {
    return 'Use times like 09:00'
  }
  return null
}

/** True if two same-weekday ranges overlap (half-open [start, end)). */
export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const as = timeToMinutes(aStart)
  const ae = timeToMinutes(aEnd)
  const bs = timeToMinutes(bStart)
  const be = timeToMinutes(bEnd)
  return as < be && bs < ae
}

/**
 * Generate bookable slot starts (ISO UTC) for a calendar day in `timezone`,
 * from recurring weekly rules minus time-off.
 */
export function slotsForDay(opts: {
  day: Date // any instant on the target civil day
  timezone: string
  blocks: AvailabilityBlock[]
  timeOff: TimeOffRange[]
  durationMinutes?: number
  stepMinutes?: number
}): string[] {
  const duration = opts.durationMinutes ?? 60
  const step = opts.stepMinutes ?? 60
  const weekday = weekdayInTimezone(opts.day, opts.timezone)
  const ymd = civilDateInTimezone(opts.day, opts.timezone)

  const dayBlocks = opts.blocks.filter((b) => b.weekday === weekday && b.is_active !== false)
  const slots: string[] = []

  for (const block of dayBlocks) {
    const startMin = timeToMinutes(block.start_time)
    const endMin = timeToMinutes(block.end_time)
    for (let t = startMin; t + duration <= endMin; t += step) {
      const iso = zonedCivilToUtcIso(ymd, minutesToTime(t), opts.timezone)
      if (!iso) continue
      const start = new Date(iso)
      const end = new Date(start.getTime() + duration * 60_000)
      const onTimeOff = opts.timeOff.some((off) => {
        const os = new Date(off.starts_at)
        const oe = new Date(off.ends_at)
        return start < oe && end > os
      })
      if (!onTimeOff) slots.push(iso)
    }
  }

  return slots
}

/**
 * Bookable slot starts over the next `days` civil days in `timezone`.
 * Uses weekly rules when present; otherwise FALLBACK_SLOT_HOURS in that timezone.
 * Drops slots that have already started.
 */
export function slotsForHorizon(opts: {
  from?: Date
  days?: number
  timezone: string
  blocks: AvailabilityBlock[]
  timeOff: TimeOffRange[]
  durationMinutes?: number
  stepMinutes?: number
}): string[] {
  const from = opts.from ?? new Date()
  const days = opts.days ?? 7
  const duration = opts.durationMinutes ?? 60
  const activeBlocks = opts.blocks.filter((b) => b.is_active !== false)
  const hasRules = activeBlocks.length > 0
  const out: string[] = []

  for (let i = 0; i < days; i++) {
    const day = new Date(from.getTime() + i * 24 * 60 * 60 * 1000)
    if (hasRules) {
      out.push(
        ...slotsForDay({
          day,
          timezone: opts.timezone,
          blocks: activeBlocks,
          timeOff: opts.timeOff,
          durationMinutes: duration,
          stepMinutes: opts.stepMinutes ?? 60,
        }),
      )
      continue
    }

    const ymd = civilDateInTimezone(day, opts.timezone)
    for (const hour of FALLBACK_SLOT_HOURS) {
      const iso = zonedCivilToUtcIso(ymd, minutesToTime(hour * 60), opts.timezone)
      if (iso) out.push(iso)
    }
  }

  return out.filter((iso) => new Date(iso).getTime() >= from.getTime())
}

/** True when `scheduledAt` is an open start for that civil day (rules or fallback). */
export function isOpenSlot(opts: {
  scheduledAt: string
  timezone: string
  blocks: AvailabilityBlock[]
  timeOff: TimeOffRange[]
  durationMinutes?: number
}): boolean {
  const start = new Date(opts.scheduledAt)
  if (Number.isNaN(start.getTime())) return false

  const activeBlocks = opts.blocks.filter((b) => b.is_active !== false)
  const duration = opts.durationMinutes ?? 60
  let slots: string[]

  if (activeBlocks.length > 0) {
    slots = slotsForDay({
      day: start,
      timezone: opts.timezone,
      blocks: activeBlocks,
      timeOff: opts.timeOff,
      durationMinutes: duration,
      stepMinutes: 60,
    })
  } else {
    const ymd = civilDateInTimezone(start, opts.timezone)
    slots = FALLBACK_SLOT_HOURS.map((hour) =>
      zonedCivilToUtcIso(ymd, minutesToTime(hour * 60), opts.timezone),
    ).filter((iso): iso is string => Boolean(iso))
  }

  const target = start.getTime()
  return slots.some((iso) => new Date(iso).getTime() === target)
}

export function weekdayInTimezone(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).formatToParts(date)
  const wd = parts.find((p) => p.type === 'weekday')?.value
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  return map[wd ?? 'Sun'] ?? 0
}

export function civilDateInTimezone(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const y = parts.find((p) => p.type === 'year')?.value
  const m = parts.find((p) => p.type === 'month')?.value
  const d = parts.find((p) => p.type === 'day')?.value
  return `${y}-${m}-${d}`
}

/**
 * Convert a civil YYYY-MM-DD + HH:MM in a timezone to UTC ISO.
 * Uses iterative offset resolution (good enough for availability slots).
 */
export function zonedCivilToUtcIso(ymd: string, hm: string, timezone: string): string | null {
  const [year, month, day] = ymd.split('-').map(Number)
  const [hour, minute] = hm.split(':').map(Number)
  if (![year, month, day, hour, minute].every((n) => Number.isFinite(n))) return null

  // First guess: treat as UTC, then correct by the zone offset at that instant.
  let guess = Date.UTC(year, month - 1, day, hour, minute, 0)
  for (let i = 0; i < 3; i++) {
    const offset = timezoneOffsetMs(new Date(guess), timezone)
    const asUtc = Date.UTC(year, month - 1, day, hour, minute, 0) - offset
    if (asUtc === guess) break
    guess = asUtc
  }
  return new Date(guess).toISOString()
}

function timezoneOffsetMs(date: Date, timezone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  const parts = dtf.formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return asUtc - date.getTime()
}

/** Whether a scheduled session falls inside an availability block (same weekday + time window). */
export function sessionInsideBlock(opts: {
  scheduledAt: string
  durationMinutes: number
  block: AvailabilityBlock
  timezone: string
}): boolean {
  const start = new Date(opts.scheduledAt)
  const end = new Date(start.getTime() + opts.durationMinutes * 60_000)
  if (weekdayInTimezone(start, opts.timezone) !== opts.block.weekday) return false

  const startHm = timeInTimezone(start, opts.timezone)
  const endHm = timeInTimezone(end, opts.timezone)
  return rangesOverlap(opts.block.start_time, opts.block.end_time, startHm, endHm)
}

function timeInTimezone(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const h = parts.find((p) => p.type === 'hour')?.value ?? '00'
  const m = parts.find((p) => p.type === 'minute')?.value ?? '00'
  return `${h}:${m}:00`
}

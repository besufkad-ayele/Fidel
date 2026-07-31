'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WEEKDAY_LABELS, slotsForDay } from '@/lib/domain/availability'
import {
  addTimeOffAction,
  removeAvailabilityBlockAction,
  removeTimeOffAction,
  saveAvailabilityBlockAction,
  updateTeachingTimezoneAction,
} from '@/app/(teach)/teach/availability/actions'

export type AvailabilityBlockRow = {
  id: string
  weekday: number
  start_time: string
  end_time: string
  timezone: string
  is_active: boolean
}

export type TimeOffRow = {
  id: string
  starts_at: string
  ends_at: string
  reason: string | null
}

const COMMON_TIMEZONES = [
  'Africa/Addis_Ababa',
  'Africa/Nairobi',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Toronto',
  'America/Los_Angeles',
  'Asia/Dubai',
  'UTC',
]

function hhmm(value: string) {
  return value.slice(0, 5)
}

type Props = {
  timezone: string
  blocks: AvailabilityBlockRow[]
  timeOff: TimeOffRow[]
}

export function AvailabilityEditor({ timezone: initialTimezone, blocks, timeOff }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [timezone, setTimezone] = useState(initialTimezone)
  const [weekday, setWeekday] = useState(1)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('12:00')
  const [offStart, setOffStart] = useState('')
  const [offEnd, setOffEnd] = useState('')
  const [offReason, setOffReason] = useState('')

  const byDay = useMemo(() => {
    const map = new Map<number, AvailabilityBlockRow[]>()
    for (let d = 0; d < 7; d++) map.set(d, [])
    for (const b of blocks) {
      const list = map.get(b.weekday) ?? []
      list.push(b)
      map.set(b.weekday, list)
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.start_time.localeCompare(b.start_time))
    }
    return map
  }, [blocks])

  const preview = useMemo(() => {
    const days: { key: string; weekdayLabel: string; dateLabel: string; slots: string[] }[] = []
    const now = new Date()
    for (let i = 0; i < 7; i++) {
      const day = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
      const slots = slotsForDay({
        day,
        timezone,
        blocks: blocks.map((b) => ({
          weekday: b.weekday,
          start_time: b.start_time,
          end_time: b.end_time,
          timezone: b.timezone,
          is_active: b.is_active,
        })),
        timeOff: timeOff.map((t) => ({
          starts_at: t.starts_at,
          ends_at: t.ends_at,
          reason: t.reason,
        })),
        durationMinutes: 60,
        stepMinutes: 60,
      })
      days.push({
        key: day.toISOString().slice(0, 10) + '-' + i,
        weekdayLabel: day.toLocaleDateString(undefined, {
          weekday: 'short',
          timeZone: timezone,
        }),
        dateLabel: day.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          timeZone: timezone,
        }),
        slots: slots.map((iso) =>
          new Date(iso).toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: timezone,
          }),
        ),
      })
    }
    return days
  }, [blocks, timeOff, timezone])

  function run(fn: () => Promise<{ ok: boolean; error?: string; warning?: string }>) {
    startTransition(async () => {
      const result = await fn()
      if (!result.ok) {
        toast.error(result.error ?? 'Something went wrong')
        return
      }
      if (result.warning) toast.message(result.warning)
      else toast.success('Saved')
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-cream-300 bg-cream-50 p-5">
        <h2 className="font-semibold text-green-700">Teaching timezone</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Weekly hours are stored in this timezone. Students see slots converted to theirs.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="h-9 min-w-[220px] rounded-md border border-input bg-background px-2 text-sm"
            >
              {Array.from(new Set([timezone, ...COMMON_TIMEZONES])).map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            disabled={pending}
            onClick={() => run(() => updateTeachingTimezoneAction(timezone))}
          >
            Update timezone
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-cream-300 bg-cream-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-green-700">Weekly hours</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add recurring blocks. Booking uses these minus time off and existing sessions.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Day</span>
            <select
              value={weekday}
              onChange={(e) => setWeekday(Number(e.target.value))}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              {WEEKDAY_LABELS.map((label, i) => (
                <option key={label} value={i}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">From</span>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">To</span>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </label>
          <Button
            type="button"
            disabled={pending}
            className="gap-2"
            onClick={() =>
              run(() =>
                saveAvailabilityBlockAction({
                  weekday,
                  startTime,
                  endTime,
                  timezone,
                }),
              )
            }
          >
            <Plus className="size-4" />
            Add block
          </Button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {WEEKDAY_LABELS.map((label, day) => {
            const dayBlocks = byDay.get(day) ?? []
            return (
              <div key={label} className="rounded-lg border border-cream-300 bg-cream-100/40 p-3">
                <p className="text-sm font-semibold text-green-700">{label}</p>
                {dayBlocks.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">No hours set</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {dayBlocks.map((block) => (
                      <li
                        key={block.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-cream-300 bg-cream-50 px-2 py-1.5 text-sm"
                      >
                        <span>
                          {hhmm(block.start_time)} – {hhmm(block.end_time)}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-8 text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                          disabled={pending}
                          aria-label={`Remove ${label} ${hhmm(block.start_time)} block`}
                          onClick={() =>
                            startTransition(async () => {
                              const first = await removeAvailabilityBlockAction({ id: block.id })
                              if (!first.ok && first.warning === 'has_bookings') {
                                const confirmed = window.confirm(first.error)
                                if (!confirmed) return
                                const second = await removeAvailabilityBlockAction({
                                  id: block.id,
                                  force: true,
                                })
                                if (!second.ok) {
                                  toast.error(second.error ?? 'Could not remove')
                                  return
                                }
                                if (second.warning) toast.message(second.warning)
                                else toast.success('Removed')
                                router.refresh()
                                return
                              }
                              if (!first.ok) {
                                toast.error(first.error ?? 'Could not remove')
                                return
                              }
                              toast.success('Removed')
                              router.refresh()
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-xl border border-cream-300 bg-cream-50 p-5">
        <h2 className="font-semibold text-green-700">Time off</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Block specific ranges (travel, leave). These hide slots even if weekly hours include them.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Starts</span>
            <Input
              type="datetime-local"
              value={offStart}
              onChange={(e) => setOffStart(e.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Ends</span>
            <Input type="datetime-local" value={offEnd} onChange={(e) => setOffEnd(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm lg:col-span-1">
            <span className="text-muted-foreground">Reason (optional)</span>
            <Input
              value={offReason}
              onChange={(e) => setOffReason(e.target.value)}
              placeholder="Conference, leave…"
            />
          </label>
          <Button
            type="button"
            disabled={pending || !offStart || !offEnd}
            onClick={() =>
              run(async () => {
                const result = await addTimeOffAction({
                  startsAt: offStart,
                  endsAt: offEnd,
                  reason: offReason,
                })
                if (result.ok) {
                  setOffStart('')
                  setOffEnd('')
                  setOffReason('')
                }
                return result
              })
            }
          >
            Add time off
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {timeOff.length === 0 ? (
            <p className="text-sm text-muted-foreground">No time off scheduled.</p>
          ) : (
            timeOff.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cream-300 bg-cream-100/50 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-green-700">
                    {new Date(row.starts_at).toLocaleString(undefined, { timeZone: timezone })}
                    {' → '}
                    {new Date(row.ends_at).toLocaleString(undefined, { timeZone: timezone })}
                  </p>
                  {row.reason ? <p className="text-xs text-muted-foreground">{row.reason}</p> : null}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => run(() => removeTimeOffAction(row.id))}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-cream-300 bg-cream-50 p-5">
        <h2 className="font-semibold text-green-700">Student calendar · next 7 days</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These open cards are what students tap to book. Add weekly hours above to create them;
          time off hides cards for those ranges.
        </p>
        <div className="mt-4 -mx-1 overflow-x-auto pb-1">
          <div className="grid min-w-[52rem] grid-cols-7 gap-2 px-1 lg:min-w-0">
            {preview.map((day) => (
              <div
                key={day.key}
                className="flex min-h-[12rem] flex-col rounded-xl border border-cream-300 bg-cream-100/40 p-2.5"
              >
                <div className="border-b border-cream-300 pb-2 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {day.weekdayLabel}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-green-700">{day.dateLabel}</p>
                </div>
                <div className="mt-2 flex flex-1 flex-col gap-1.5">
                  {day.slots.length === 0 ? (
                    <p className="mt-2 text-center text-[11px] text-muted-foreground">No slots</p>
                  ) : (
                    day.slots.map((slot) => (
                      <div
                        key={`${day.key}-${slot}`}
                        className="rounded-lg border border-green-200 bg-green-50/80 px-2 py-2 text-center text-xs text-green-800"
                      >
                        <span className="font-medium">{slot}</span>
                        <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-green-700/70">
                          Open
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { bookSessionAction } from '@/app/(learn)/sessions/actions'

export type BookingDaySlot = {
  iso: string
  timeLabel: string
  status: 'free' | 'booked'
}

export type BookingDayColumn = {
  key: string
  weekdayLabel: string
  dateLabel: string
  slots: BookingDaySlot[]
}

type Props = {
  teacherId: string
  teacherName: string
  timezoneNote: string
  days: BookingDayColumn[]
}

export function BookingCalendar({ teacherId, teacherName, timezoneNote, days }: Props) {
  const firstFree = useMemo(
    () => days.flatMap((d) => d.slots).find((s) => s.status === 'free')?.iso ?? '',
    [days],
  )
  const [selectedIso, setSelectedIso] = useState(firstFree)
  const hasAnyFree = days.some((d) => d.slots.some((s) => s.status === 'free'))

  const selectedLabel = useMemo(() => {
    for (const day of days) {
      const slot = day.slots.find((s) => s.iso === selectedIso)
      if (slot) return `${day.weekdayLabel} ${day.dateLabel} · ${slot.timeLabel}`
    }
    return null
  }, [days, selectedIso])

  return (
    <form action={bookSessionAction} className="space-y-5">
      <input type="hidden" name="teacherId" value={teacherId} />
      <input type="hidden" name="scheduledAt" value={selectedIso} required />

      <div className="rounded-xl border border-cream-300 bg-cream-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Booking with</p>
            <p className="mt-0.5 font-semibold text-green-700">{teacherName}</p>
            <p className="mt-1 text-xs text-muted-foreground">{timezoneNote}</p>
          </div>
          {selectedLabel ? (
            <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              Selected: <span className="font-medium">{selectedLabel}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Select an open time below</p>
          )}
        </div>

        <div className="mt-5 -mx-1 overflow-x-auto pb-1">
          <div className="grid min-w-[52rem] grid-cols-7 gap-2 px-1 sm:min-w-0">
            {days.map((day) => (
              <div
                key={day.key}
                className="flex min-h-[14rem] flex-col rounded-xl border border-cream-300 bg-cream-100/40 p-2.5"
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
                    day.slots.map((slot) => {
                      if (slot.status === 'booked') {
                        return (
                          <div
                            key={slot.iso}
                            className="rounded-lg border border-danger-200/70 bg-danger-50/80 px-2 py-2 text-center text-xs text-danger-600"
                            title="Already booked"
                          >
                            <span className="font-medium">{slot.timeLabel}</span>
                            <span className="mt-0.5 block text-[10px] uppercase tracking-wide">
                              Booked
                            </span>
                          </div>
                        )
                      }

                      const selected = selectedIso === slot.iso
                      return (
                        <button
                          key={slot.iso}
                          type="button"
                          onClick={() => setSelectedIso(slot.iso)}
                          className={`rounded-lg border px-2 py-2 text-center text-xs transition ${
                            selected
                              ? 'border-green-700 bg-green-700 text-cream-50 shadow-sm'
                              : 'border-green-200 bg-green-50/80 text-green-800 hover:border-green-600 hover:bg-green-100'
                          }`}
                        >
                          <span className="font-medium">{slot.timeLabel}</span>
                          <span
                            className={`mt-0.5 block text-[10px] uppercase tracking-wide ${
                              selected ? 'text-cream-100/90' : 'text-green-700/70'
                            }`}
                          >
                            Open
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!hasAnyFree ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No free slots in the next 7 days for this teacher.
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-cream-300 bg-cream-50 p-5 space-y-4">
        <div>
          <Label htmlFor="note">Short note (optional)</Label>
          <Textarea
            id="note"
            name="note"
            rows={3}
            placeholder="What would you like to focus on in this session?"
            className="mt-1.5"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!selectedIso}>
            Request booking
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href={'/sessions' as '/'}>Back to sessions</Link>
          </Button>
        </div>
      </div>
    </form>
  )
}

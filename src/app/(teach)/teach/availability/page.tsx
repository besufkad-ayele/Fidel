import Link from 'next/link'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  AvailabilityEditor,
  type AvailabilityBlockRow,
  type TimeOffRow,
} from '@/components/features/teach/availability-editor'

export const metadata: Metadata = { title: 'Availability' }

export default async function AvailabilityPage() {
  const { user, profile } = await requireRole('teacher')
  const supabase = await createClient()
  const timezone = profile.timezone || 'Africa/Addis_Ababa'

  const [blocksRes, timeOffRes] = await Promise.all([
    supabase
      .from('teacher_availability')
      .select('id, weekday, start_time, end_time, timezone, is_active')
      .eq('teacher_id', user.id)
      .eq('is_active', true)
      .order('weekday', { ascending: true })
      .order('start_time', { ascending: true }),
    supabase
      .from('teacher_time_off')
      .select('id, starts_at, ends_at, reason')
      .eq('teacher_id', user.id)
      .gte('ends_at', new Date().toISOString())
      .order('starts_at', { ascending: true }),
  ])

  const schemaMissing =
    blocksRes.error?.message?.includes('teacher_availability') ||
    blocksRes.error?.code === '42P01' ||
    timeOffRes.error?.code === '42P01'

  if (schemaMissing) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="font-display text-3xl text-green-700">Availability</h1>
        <div className="rounded-xl border border-warning-500/30 bg-warning-50 p-5 text-sm text-warning-700">
          <p className="font-medium">Database tables are not set up yet.</p>
          <p className="mt-2 text-muted-foreground">
            Run the migration, then reload this page:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-cream-300 bg-cream-50 p-3 text-xs text-green-800">
            pnpm db:push
          </pre>
          <p className="mt-2 text-xs text-muted-foreground">
            Migration file: supabase/migrations/20260729000024_teacher_availability.sql
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={'/teach' as '/'}>Back to Today</Link>
        </Button>
      </div>
    )
  }

  if (blocksRes.error) {
    console.error('[availability] blocks', blocksRes.error.message)
  }
  if (timeOffRes.error) {
    console.error('[availability] timeOff', timeOffRes.error.message)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-green-700">Availability</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Set the weekly hours students can book, plus any time off. Student booking and your
            schedule both use these rules for free slots.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={'/teach/schedule' as '/'}>Open schedule</Link>
        </Button>
      </div>

      <AvailabilityEditor
        timezone={timezone}
        blocks={(blocksRes.data ?? []) as AvailabilityBlockRow[]}
        timeOff={(timeOffRes.data ?? []) as TimeOffRow[]}
      />
    </div>
  )
}

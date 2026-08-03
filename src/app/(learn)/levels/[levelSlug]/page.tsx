import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { AmharicText } from '@/components/shared/amharic-text'
import { StatusChip, type StatusChipState } from '@/components/shared/status-chip'
import { createClient } from '@/lib/supabase/server'
import { getUnitsForLevel } from '@/lib/data/curriculum'
import { getCurrentStudentProgress } from '@/lib/data/progress'
import { isUnitUnlocked, unitHref } from '@/lib/domain/dashboard-units'

type Props = { params: Promise<{ levelSlug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { levelSlug } = await params
  return { title: `Level ${levelSlug}` }
}

export default async function LevelPage({ params }: Props) {
  const { levelSlug } = await params
  const supabase = await createClient()
  const [{ data: level }, units, progress] = await Promise.all([
    supabase
      .from('levels')
      .select('id, fidel_char, title, subtitle, description, cefr_equivalent, is_coming_soon, status')
      .eq('id', levelSlug)
      .maybeSingle(),
    getUnitsForLevel(levelSlug),
    getCurrentStudentProgress(),
  ])

  if (!level) notFound()

  const progressByUnitId = new Map(
    (progress?.units.filter((u) => u.level?.id === levelSlug) ?? []).map((u) => [u.unit.id, u]),
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <AmharicText size="display" className="text-gold-600">
            {level.fidel_char}
          </AmharicText>
          <div>
            <h1 className="font-display text-3xl text-green-900">{level.title}</h1>
            <p className="text-sm text-green-600">
              CEFR {level.cefr_equivalent}
              {level.subtitle ? ` · ${level.subtitle}` : ''}
            </p>
          </div>
        </div>
        {level.description ? (
          <p className="text-sm leading-relaxed text-green-800">{level.description}</p>
        ) : null}
      </header>

      {units.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cream-400 bg-cream-50 p-8 text-center">
          <p className="font-display text-xl text-green-900">No units yet</p>
          <p className="mt-2 text-sm text-green-700">
            Your teacher will publish units from the admin content studio.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {units.map((unit, index) => {
            const unlocked = isUnitUnlocked(unit)
            const unitProgress = progressByUnitId.get(unit.id)
            const status: StatusChipState = !unlocked
              ? 'locked'
              : unitProgress?.grade.isComplete
                ? 'completed'
                : unitProgress && unitProgress.selfPacedStatus !== 'not_started'
                  ? 'in_progress'
                  : 'not_started'

            const body = (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-gold-700 uppercase">
                    Unit {index + 1}
                    {!unlocked ? ' · Not published' : ''}
                  </p>
                  <h2 className="mt-1 font-display text-xl text-green-900">{unit.title}</h2>
                  {unit.description ? (
                    <p className="mt-1 text-sm text-green-700">{unit.description}</p>
                  ) : null}
                </div>
                <StatusChip state={status} />
              </div>
            )

            if (!unlocked) {
              return (
                <div
                  key={unit.id}
                  className="rounded-xl border border-cream-300 bg-cream-50/70 p-5 opacity-75"
                >
                  {body}
                </div>
              )
            }

            return (
              <Link
                key={unit.id}
                href={unitHref(levelSlug, unit.slug) as '/'}
                className="block rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card transition hover:border-gold-400"
              >
                {body}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

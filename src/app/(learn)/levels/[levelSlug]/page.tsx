import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { AmharicText } from '@/components/shared/amharic-text'
import { StatusChip } from '@/components/shared/status-chip'
import { createClient } from '@/lib/supabase/server'
import { getPublishedUnitsForLevel } from '@/lib/data/curriculum'

type Props = { params: Promise<{ levelSlug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { levelSlug } = await params
  return { title: `Level ${levelSlug}` }
}

export default async function LevelPage({ params }: Props) {
  const { levelSlug } = await params
  const supabase = await createClient()
  const { data: level } = await supabase
    .from('levels')
    .select('id, fidel_char, title, subtitle, description, cefr_equivalent, is_coming_soon, status')
    .eq('id', levelSlug)
    .maybeSingle()

  if (!level) notFound()

  const units =
    level.status === 'published' || level.status === 'draft'
      ? await getPublishedUnitsForLevel(levelSlug)
      : []

  // During content authoring, also show draft units to make testing easier for entitled students
  // once units are published. Empty list shows honest empty state.

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
          <p className="font-display text-xl text-green-900">No published units yet</p>
          <p className="mt-2 text-sm text-green-700">
            Your teacher will publish units from the admin content studio.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {units.map((unit, index) => (
            <Link
              key={unit.id}
              href={`/levels/${levelSlug}/units/${unit.slug}/culture`}
              className="block rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card transition hover:border-gold-400"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-gold-700 uppercase">
                    Unit {index + 1}
                  </p>
                  <h2 className="mt-1 font-display text-xl text-green-900">{unit.title}</h2>
                  {unit.description ? (
                    <p className="mt-1 text-sm text-green-700">{unit.description}</p>
                  ) : null}
                </div>
                <StatusChip state="not_started" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

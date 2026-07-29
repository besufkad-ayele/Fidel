import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { SectionCard } from '@/components/admin/section-card'
import { createAdminDb } from '@/lib/admin/db'
import {
  VocabularyCreateForm,
  VocabularyEditCard,
  type VocabAdminItem,
  type VocabUnitOption,
} from '@/components/admin/vocabulary-forms'

export const metadata: Metadata = { title: 'Vocabulary' }

export default async function VocabularyPage({
  searchParams,
}: {
  searchParams: Promise<{ levelId?: string; unitId?: string }>
}) {
  const { levelId: filterLevel, unitId: filterUnit } = await searchParams
  const db = await createAdminDb()

  const [{ data: items }, { data: units }, { data: links }] = await Promise.all([
    db
      .from('vocabulary_items')
      .select(
        'id, amharic, english, transliteration, level_id, notes, audio_slow_path, audio_normal_path, audio_natural_path, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(300),
    db.from('units').select('id, title, level_id').order('sort_order'),
    db.from('unit_vocabulary').select('vocabulary_id, unit_id'),
  ])

  const unitsByVocab = new Map<string, string[]>()
  for (const row of links ?? []) {
    const list = unitsByVocab.get(row.vocabulary_id) ?? []
    list.push(row.unit_id)
    unitsByVocab.set(row.vocabulary_id, list)
  }

  let filtered = (items ?? []) as VocabAdminItem[]
  if (filterLevel) filtered = filtered.filter((i) => i.level_id === filterLevel)
  if (filterUnit) {
    filtered = filtered.filter((i) => (unitsByVocab.get(i.id) ?? []).includes(filterUnit))
  }

  const enriched = filtered.map((item) => ({
    ...item,
    unitIds: unitsByVocab.get(item.id) ?? [],
  }))

  const unitOptions = (units ?? []) as VocabUnitOption[]

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Vocabulary"
        description="Level bank with multi-unit assignment. Prefer creating words from a unit page so they are linked automatically."
      />

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link
          href={'/admin/vocabulary' as '/'}
          className={!filterLevel && !filterUnit ? 'font-semibold text-green-800' : 'text-green-700 hover:underline'}
        >
          All
        </Link>
        {['ha', 'le', 'hha', 'me', 'sse', 're'].map((level) => (
          <Link
            key={level}
            href={`/admin/vocabulary?levelId=${level}` as '/'}
            className={
              filterLevel === level ? 'font-semibold text-green-800' : 'text-green-700 hover:underline'
            }
          >
            {level}
          </Link>
        ))}
      </div>

      {(units ?? []).length > 0 ? (
        <div className="mb-6 rounded-xl border border-cream-300 bg-cream-50 p-4">
          <p className="mb-2 text-xs font-semibold tracking-wide text-gold-700 uppercase">
            Manage by unit
          </p>
          <div className="flex flex-wrap gap-2">
            {(units as VocabUnitOption[]).slice(0, 24).map((u) => (
              <Link
                key={u.id}
                href={`/admin/units/${u.id}/vocabulary` as '/'}
                className="rounded-md border border-cream-300 bg-white px-2.5 py-1.5 text-sm text-green-800 hover:border-gold-400"
              >
                {u.level_id} · {u.title}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <SectionCard title="Add word">
          <VocabularyCreateForm units={unitOptions} defaultLevelId={filterLevel || 'ha'} />
        </SectionCard>

        <div>
          {enriched.length === 0 ? (
            <EmptyState
              title="Vocabulary bank is empty"
              description="Add a word and assign it to one or more units, or open a unit’s vocabulary page."
            />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Showing {enriched.length} word{enriched.length === 1 ? '' : 's'}
                {filterUnit ? ' for selected unit filter' : filterLevel ? ` in ${filterLevel}` : ''}
              </p>
              {enriched.map((item) => (
                <VocabularyEditCard key={item.id} item={item} units={unitOptions} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

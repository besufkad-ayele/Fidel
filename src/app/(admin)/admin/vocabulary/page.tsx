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
import { AmharicText } from '@/components/shared/amharic-text'

export const metadata: Metadata = { title: 'Vocabulary' }

export default async function VocabularyPage({
  searchParams,
}: {
  searchParams: Promise<{ levelId?: string; unitId?: string; scope?: string }>
}) {
  const { levelId: filterLevel, unitId: filterUnit, scope } = await searchParams
  const db = await createAdminDb()

  const [{ data: items }, { data: units }, { data: links }] = await Promise.all([
    db
      .from('vocabulary_items')
      .select(
        'id, amharic, english, transliteration, level_id, notes, audio_slow_path, audio_normal_path, audio_natural_path, created_at',
      )
      .order('amharic', { ascending: true })
      .limit(500),
    db.from('units').select('id, title, level_id, sort_order').order('sort_order'),
    db.from('unit_vocabulary').select('vocabulary_id, unit_id, is_core'),
  ])

  const unitsByVocab = new Map<string, string[]>()
  const coreByUnitVocab = new Set<string>()
  for (const row of links ?? []) {
    const list = unitsByVocab.get(row.vocabulary_id) ?? []
    list.push(row.unit_id)
    unitsByVocab.set(row.vocabulary_id, list)
    if (row.is_core) coreByUnitVocab.add(`${row.unit_id}:${row.vocabulary_id}`)
  }

  const unitOptions = (units ?? []) as VocabUnitOption[]
  const activeLevel = filterLevel || unitOptions.find((u) => u.id === filterUnit)?.level_id || 'ha'
  const levelUnits = unitOptions.filter((u) => u.level_id === activeLevel)
  const showGeneral = scope === 'general' && !filterUnit
  const selectedUnit = filterUnit
    ? unitOptions.find((u) => u.id === filterUnit) ?? null
    : null

  const allItems = ((items ?? []) as VocabAdminItem[]).map((item) => ({
    ...item,
    unitIds: unitsByVocab.get(item.id) ?? [],
  }))

  const levelItems = allItems.filter((i) => i.level_id === activeLevel)

  const unitWordCounts = new Map<string, number>()
  for (const item of levelItems) {
    for (const uid of item.unitIds) {
      unitWordCounts.set(uid, (unitWordCounts.get(uid) ?? 0) + 1)
    }
  }

  const selectedUnitWords = selectedUnit
    ? levelItems
        .filter((i) => i.unitIds.includes(selectedUnit.id))
        .map((i) => ({
          ...i,
          isCore: coreByUnitVocab.has(`${selectedUnit.id}:${i.id}`),
        }))
    : []

  const generalWords = levelItems
    .filter((i) => i.unitIds.length === 0)
    .slice()
    .sort((a, b) => a.amharic.localeCompare(b.amharic, 'am'))

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Vocabulary"
        description="Create words inside a unit, or keep general level-bank words unassigned until you need them."
      />

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {['ha', 'le', 'hha', 'me', 'sse', 're'].map((level) => (
          <Link
            key={level}
            href={`/admin/vocabulary?levelId=${level}` as '/'}
            className={
              activeLevel === level && !filterUnit && !showGeneral
                ? 'font-semibold text-green-800'
                : 'text-green-700 hover:underline'
            }
          >
            {level}
          </Link>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-cream-300 bg-cream-50 p-4">
        <p className="mb-2 text-xs font-semibold tracking-wide text-gold-700 uppercase">
          Choose where to manage words
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/vocabulary?levelId=${activeLevel}&scope=general` as '/'}
            className={
              showGeneral
                ? 'rounded-md border border-gold-500 bg-gold-50 px-2.5 py-1.5 text-sm font-medium text-green-900'
                : 'rounded-md border border-dashed border-cream-400 bg-white px-2.5 py-1.5 text-sm text-green-800 hover:border-gold-400'
            }
          >
            General (no unit)
            <span className="ml-1.5 text-xs text-muted-foreground">({generalWords.length})</span>
          </Link>
          {levelUnits.map((u) => {
            const count = unitWordCounts.get(u.id) ?? 0
            const active = selectedUnit?.id === u.id
            return (
              <Link
                key={u.id}
                href={`/admin/vocabulary?levelId=${activeLevel}&unitId=${u.id}` as '/'}
                className={
                  active
                    ? 'rounded-md border border-gold-500 bg-gold-50 px-2.5 py-1.5 text-sm font-medium text-green-900'
                    : 'rounded-md border border-cream-300 bg-white px-2.5 py-1.5 text-sm text-green-800 hover:border-gold-400'
                }
              >
                {u.title}
                <span className="ml-1.5 text-xs text-muted-foreground">({count})</span>
              </Link>
            )
          })}
        </div>
        {selectedUnit ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Full unit page:{' '}
            <Link
              href={`/admin/units/${selectedUnit.id}/vocabulary` as '/'}
              className="text-green-700 underline-offset-2 hover:underline"
            >
              {selectedUnit.title} vocabulary →
            </Link>
          </p>
        ) : null}
      </div>

      {!selectedUnit && !showGeneral ? (
        <EmptyState
          title="Choose a section"
          description="Pick General for unassigned level-bank words, or a unit to create and manage unit vocabulary."
        />
      ) : showGeneral ? (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <SectionCard title={`Add general word · ${activeLevel}`}>
            <VocabularyCreateForm
              units={levelUnits}
              defaultLevelId={activeLevel}
              allowUnassigned
            />
          </SectionCard>

          <div className="space-y-4">
            <div>
              <h2 className="font-display text-lg text-green-900">General vocabulary</h2>
              <p className="text-sm text-muted-foreground">
                {generalWords.length} word{generalWords.length === 1 ? '' : 's'} not assigned to any
                unit · sorted A–Z. Assign units on a card when ready.
              </p>
            </div>

            {generalWords.length === 0 ? (
              <EmptyState
                title="No general words yet"
                description="Add words here for the level bank, or create them directly inside a unit."
              />
            ) : (
              <div className="space-y-4">
                {generalWords.map((item) => (
                  <VocabularyEditCard key={item.id} item={item} units={levelUnits} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : selectedUnit ? (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <SectionCard title={`Add word · ${selectedUnit.title}`}>
            <VocabularyCreateForm
              units={levelUnits}
              defaultLevelId={selectedUnit.level_id}
              defaultUnitId={selectedUnit.id}
            />
          </SectionCard>

          <div className="space-y-4">
            <div>
              <h2 className="font-display text-lg text-green-900">{selectedUnit.title}</h2>
              <p className="text-sm text-muted-foreground">
                {selectedUnitWords.length} word
                {selectedUnitWords.length === 1 ? '' : 's'} on this unit
              </p>
            </div>

            {selectedUnitWords.length === 0 ? (
              <EmptyState
                title="No words on this unit yet"
                description="Use the form to create the first word — it will be linked to this unit automatically."
              />
            ) : (
              <div className="space-y-4">
                {selectedUnitWords.map((item) => (
                  <div key={item.id} className="space-y-1">
                    {item.isCore ? (
                      <p className="px-1 text-[11px] font-semibold tracking-wide text-gold-700 uppercase">
                        Core · <AmharicText size="sm">{item.amharic}</AmharicText>
                      </p>
                    ) : null}
                    <VocabularyEditCard
                      item={item}
                      units={levelUnits}
                      currentUnitId={selectedUnit.id}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

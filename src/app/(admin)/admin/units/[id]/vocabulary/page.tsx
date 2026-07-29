import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { SectionCard } from '@/components/admin/section-card'
import { createAdminDb } from '@/lib/admin/db'
import {
  VocabularyCreateForm,
  VocabularyEditCard,
  AssignExistingVocabularyForm,
  type VocabAdminItem,
  type VocabUnitOption,
} from '@/components/admin/vocabulary-forms'
import { AmharicText } from '@/components/shared/amharic-text'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const db = await createAdminDb()
  const { data } = await db.from('units').select('title').eq('id', id).maybeSingle()
  return { title: data ? `Vocabulary · ${data.title}` : 'Unit vocabulary' }
}

export default async function UnitVocabularyPage({ params }: Props) {
  const { id: unitId } = await params
  const db = await createAdminDb()

  const { data: unit } = await db
    .from('units')
    .select('id, title, level_id')
    .eq('id', unitId)
    .maybeSingle()
  if (!unit) notFound()

  const [{ data: links }, { data: levelVocab }, { data: units }] = await Promise.all([
    db
      .from('unit_vocabulary')
      .select('vocabulary_id, sort_order, is_core')
      .eq('unit_id', unitId)
      .order('sort_order'),
    db
      .from('vocabulary_items')
      .select(
        'id, amharic, english, transliteration, level_id, notes, audio_slow_path, audio_normal_path, audio_natural_path, created_at',
      )
      .eq('level_id', unit.level_id)
      .order('amharic'),
    db.from('units').select('id, title, level_id').eq('level_id', unit.level_id).order('sort_order'),
  ])

  const linkedIds = new Set((links ?? []).map((l: { vocabulary_id: string }) => l.vocabulary_id))
  const coreIds = new Set(
    (links ?? [])
      .filter((l: { is_core: boolean }) => l.is_core)
      .map((l: { vocabulary_id: string }) => l.vocabulary_id),
  )

  const allUnitLinks = linkedIds.size
    ? await db
        .from('unit_vocabulary')
        .select('vocabulary_id, unit_id')
        .in('vocabulary_id', [...linkedIds])
    : { data: [] as { vocabulary_id: string; unit_id: string }[] }

  const unitsByVocab = new Map<string, string[]>()
  for (const row of allUnitLinks.data ?? []) {
    const list = unitsByVocab.get(row.vocabulary_id) ?? []
    list.push(row.unit_id)
    unitsByVocab.set(row.vocabulary_id, list)
  }

  const assignedItems: VocabAdminItem[] = (levelVocab ?? [])
    .filter((v: { id: string }) => linkedIds.has(v.id))
    .map((v: VocabAdminItem) => ({
      ...v,
      unitIds: unitsByVocab.get(v.id) ?? [unitId],
      isCore: coreIds.has(v.id),
    }))

  // Preserve unit sort order
  const orderMap = new Map<string, number>(
    (links ?? []).map((l: { vocabulary_id: string; sort_order: number }, i: number) => [
      l.vocabulary_id,
      typeof l.sort_order === 'number' ? l.sort_order : i,
    ]),
  )
  assignedItems.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))

  const candidates = (levelVocab ?? [])
    .filter((v: { id: string }) => !linkedIds.has(v.id))
    .map((v: { id: string; amharic: string; english: string }) => ({
      id: v.id,
      amharic: v.amharic,
      english: v.english,
    }))

  const unitOptions = (units ?? []) as VocabUnitOption[]

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={`Vocabulary · ${unit.title}`}
        description="Create words for this unit, reuse level-bank words, or assign the same word to other units."
        breadcrumbs={[
          { label: 'Levels', href: '/admin/levels' },
          { label: unit.level_id, href: `/admin/levels/${unit.level_id}` },
          { label: unit.title, href: `/admin/units/${unitId}` },
          { label: 'Vocabulary' },
        ]}
        actions={[
          { label: 'Back to unit', href: `/admin/units/${unitId}`, variant: 'outline' },
          { label: 'Full vocabulary bank', href: '/admin/vocabulary', variant: 'outline' },
        ]}
      />

      <div className="mb-4 rounded-lg border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-green-900">
        <p>
          Words created here are stored in the level bank and linked to{' '}
          <strong>{unit.title}</strong>. You can assign the same word to other units without
          duplicating it.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Lesson/practice editors prefer words assigned to this unit when linking flashcards and
          listening items.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <SectionCard title="Create for this unit">
            <VocabularyCreateForm
              units={unitOptions}
              defaultLevelId={unit.level_id}
              defaultUnitId={unitId}
            />
          </SectionCard>
          <SectionCard title="Assign existing words">
            <AssignExistingVocabularyForm unitId={unitId} candidates={candidates} />
          </SectionCard>
        </div>

        <div>
          {assignedItems.length === 0 ? (
            <EmptyState
              title="No vocabulary on this unit yet"
              description="Create a new word or assign existing level words from the left."
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {assignedItems.length} word{assignedItems.length === 1 ? '' : 's'} on this unit
              </p>
              {assignedItems.map((item) => (
                <div key={item.id} className="space-y-1">
                  {item.isCore ? (
                    <p className="px-1 text-[11px] font-semibold tracking-wide text-gold-700 uppercase">
                      Core · <AmharicText size="sm">{item.amharic}</AmharicText>
                    </p>
                  ) : null}
                  <VocabularyEditCard
                    item={item}
                    units={unitOptions}
                    currentUnitId={unitId}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link
          href={`/admin/units/${unitId}/parts/language-lesson` as '/'}
          className="text-green-700 underline-offset-2 hover:underline"
        >
          Open language lesson editor
        </Link>{' '}
        to link these words into vocabulary / flashcard / listening blocks.
      </p>
    </div>
  )
}

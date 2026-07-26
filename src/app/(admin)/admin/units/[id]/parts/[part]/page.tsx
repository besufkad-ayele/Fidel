import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { SectionCard } from '@/components/admin/section-card'
import { PartContentEditor } from '@/components/admin/content-editor/part-content-editor'
import { createAdminDb } from '@/lib/admin/db'
import type { LessonPartKey } from '@/lib/validation/content'

type Props = { params: Promise<{ id: string; part: string }> }

const SLUG_TO_PART: Record<string, LessonPartKey> = {
  'cultural-insight': 'cultural_insight',
  'language-lesson': 'language_lesson',
  practice: 'practice',
}

const PART_TITLES: Record<LessonPartKey, string> = {
  cultural_insight: 'Cultural insight',
  language_lesson: 'Language lesson',
  practice: 'Practice',
}

const PART_HELP: Record<LessonPartKey, string> = {
  cultural_insight:
    'Drag blocks to build a rich cultural essay with images, videos, references, and checks.',
  language_lesson:
    'Assemble objectives, vocabulary flashcards, dialogue, tables, and audio/video clips.',
  practice:
    'Create flashcards, multiple choice, matching, timed speaking/video tasks, and homework.',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { part } = await params
  const key = SLUG_TO_PART[part]
  return { title: key ? PART_TITLES[key] : 'Part editor' }
}

export default async function PartEditorPage({ params }: Props) {
  const { id, part: partSlug } = await params
  const partKey = SLUG_TO_PART[partSlug]
  if (!partKey) notFound()

  const db = await createAdminDb()
  const { data: unit } = await db.from('units').select('id, title, level_id').eq('id', id).maybeSingle()
  if (!unit) notFound()

  const [{ data: part }, { data: vocabulary }] = await Promise.all([
    db.from('lesson_parts').select('*').eq('unit_id', id).eq('part', partKey).maybeSingle(),
    db
      .from('vocabulary_items')
      .select(
        'id, amharic, english, transliteration, example_amharic, example_english, audio_slow_path, audio_normal_path, audio_natural_path',
      )
      .eq('level_id', unit.level_id)
      .order('amharic')
      .limit(200),
  ])

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={`${PART_TITLES[partKey]} · ${unit.title}`}
        description={PART_HELP[partKey]}
        actions={[{ label: 'Back to unit', href: `/admin/units/${id}`, variant: 'outline' }]}
      />

      <div className="mb-4">
        <StatusBadge status={part?.status ?? 'draft'} />
      </div>

      <SectionCard
        title="Content studio"
        description="Drag blocks to reorder. The right panel shows exactly what students will see."
      >
        <PartContentEditor
          unitId={id}
          part={partKey}
          partSlug={partSlug}
          initialContent={part?.content ?? {}}
          initialStatus={part?.status ?? 'draft'}
          partExists={Boolean(part?.id)}
          vocabularyOptions={(vocabulary ?? []).map(
            (v: {
              id: string
              amharic: string
              english: string
              transliteration: string | null
              example_amharic?: string | null
              example_english?: string | null
              audio_slow_path?: string | null
              audio_normal_path?: string | null
              audio_natural_path?: string | null
            }) => ({
              id: v.id,
              amharic: v.amharic,
              english: v.english,
              transliteration: v.transliteration,
              exampleAmharic: v.example_amharic ?? null,
              exampleEnglish: v.example_english ?? null,
              audioSlow: v.audio_slow_path ?? null,
              audioNormal: v.audio_normal_path ?? null,
              audioNatural: v.audio_natural_path ?? null,
            }),
          )}
        />
      </SectionCard>
    </div>
  )
}

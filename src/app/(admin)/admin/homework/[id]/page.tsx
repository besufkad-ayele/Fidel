import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { SectionCard } from '@/components/admin/section-card'
import { PartContentEditor } from '@/components/admin/content-editor/part-content-editor'
import { createAdminDb } from '@/lib/admin/db'
import { Button } from '@/components/ui/button'

type Props = { params: Promise<{ id: string }> }

type VocabOption = {
  id: string
  amharic: string
  english: string
  transliteration: string | null
  exampleAmharic?: string | null
  exampleEnglish?: string | null
  audioSlow?: string | null
  audioNormal?: string | null
  audioNatural?: string | null
  assignedToUnit?: boolean
  units?: { id: string; title: string }[]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const db = await createAdminDb()
  const { data } = await db.from('homework_assignments').select('title').eq('id', id).maybeSingle()
  return { title: data?.title ? `${data.title} · Homework` : 'Homework editor' }
}

export default async function HomeworkEditorPage({ params }: Props) {
  const { id } = await params
  const db = await createAdminDb()

  const { data: assignment } = await db
    .from('homework_assignments')
    .select('id, title, unit_id, status, content, is_unit_default')
    .eq('id', id)
    .maybeSingle()

  if (!assignment) notFound()

  let vocabularyOptions: VocabOption[] = []
  let unitTitle: string | undefined

  if (assignment.unit_id) {
    const { data: unit } = await db
      .from('units')
      .select('id, title, level_id')
      .eq('id', assignment.unit_id)
      .maybeSingle()

    if (unit) {
      unitTitle = unit.title
      const [{ data: levelUnits }, { data: levelVocabulary }] = await Promise.all([
        db.from('units').select('id, title').eq('level_id', unit.level_id).order('sort_order'),
        db
          .from('vocabulary_items')
          .select(
            'id, amharic, english, transliteration, example_amharic, example_english, audio_slow_path, audio_normal_path, audio_natural_path',
          )
          .eq('level_id', unit.level_id)
          .order('amharic')
          .limit(300),
      ])

      const levelUnitIds = (levelUnits ?? []).map((u: { id: string }) => u.id)
      const { data: allLinks } =
        levelUnitIds.length > 0
          ? await db
              .from('unit_vocabulary')
              .select('vocabulary_id, unit_id')
              .in('unit_id', levelUnitIds)
          : { data: [] as { vocabulary_id: string; unit_id: string }[] }

      const unitTitleById = new Map(
        (levelUnits ?? []).map((u: { id: string; title: string }) => [u.id, u.title]),
      )
      const unitsByVocab = new Map<string, { id: string; title: string }[]>()
      for (const row of allLinks ?? []) {
        const title = unitTitleById.get(row.unit_id) ?? row.unit_id
        const list = unitsByVocab.get(row.vocabulary_id) ?? []
        list.push({ id: row.unit_id, title })
        unitsByVocab.set(row.vocabulary_id, list)
      }

      const unitVocabIds = new Set(
        (allLinks ?? [])
          .filter((l: { unit_id: string }) => l.unit_id === unit.id)
          .map((l: { vocabulary_id: string }) => l.vocabulary_id),
      )

      const mapped = (levelVocabulary ?? []).map(
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
          assignedToUnit: unitVocabIds.has(v.id),
          units: unitsByVocab.get(v.id) ?? [],
        }),
      )
      vocabularyOptions = [
        ...mapped.filter((v) => v.assignedToUnit),
        ...mapped.filter((v) => !v.assignedToUnit),
      ]
    }
  } else {
    const { data: levelVocabulary } = await db
      .from('vocabulary_items')
      .select(
        'id, amharic, english, transliteration, example_amharic, example_english, audio_slow_path, audio_normal_path, audio_natural_path',
      )
      .order('amharic')
      .limit(200)

    vocabularyOptions = (levelVocabulary ?? []).map(
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
        assignedToUnit: false,
        units: [],
      }),
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={assignment.title}
        description="Build homework with the same blocks as unit practice — flashcards, MCQ, speaking, video, and more. Publish when ready for students."
        actions={[
          { label: 'Back to homework', href: '/admin/homework' as '/', variant: 'outline' },
          ...(assignment.unit_id
            ? [
                {
                  label: 'Open unit',
                  href: `/admin/units/${assignment.unit_id}` as '/',
                  variant: 'outline' as const,
                },
                {
                  label: 'Unit vocabulary',
                  href: `/admin/units/${assignment.unit_id}/vocabulary` as '/',
                  variant: 'outline' as const,
                },
              ]
            : []),
        ]}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={assignment.status ?? 'draft'} />
        {assignment.is_unit_default ? (
          <span className="text-sm text-muted-foreground">Unit default template</span>
        ) : null}
      </div>

      <SectionCard
        title="Content studio"
        description="Flashcard vocabulary is grouped by unit."
      >
        <PartContentEditor
          assignmentId={assignment.id}
          unitId={assignment.unit_id ?? undefined}
          unitTitle={unitTitle}
          part="practice"
          initialContent={assignment.content ?? {}}
          initialStatus={assignment.status ?? 'draft'}
          partExists
          vocabularyOptions={vocabularyOptions}
        />
      </SectionCard>

      <div className="mt-4">
        <Button asChild variant="outline">
          <Link href={'/admin/homework' as '/'}>Back to list</Link>
        </Button>
      </div>
    </div>
  )
}

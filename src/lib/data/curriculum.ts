import 'server-only'

import { cache } from 'react'
import { unstable_cache, updateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { vocabAudioPublicUrl } from '@/lib/media/urls'
import {
  parsePartContent,
  type LessonPartContent,
  type LessonPartKey,
} from '@/lib/validation/content'

/** Shared tag for published curriculum. Bust with `revalidateCurriculum()`. */
export const CURRICULUM_TAG = 'curriculum'

const CURRICULUM_REVALIDATE_SECONDS = 3600

export type PublishedUnit = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  level_id: string
  sort_order: number
  status: string
}

export type VocabItem = {
  id: string
  amharic: string
  english: string
  transliteration: string | null
  exampleAmharic?: string | null
  exampleEnglish?: string | null
  audioSlow?: string | null
  audioNormal?: string | null
  audioNatural?: string | null
}

const PART_ROUTE: Record<string, LessonPartKey> = {
  culture: 'cultural_insight',
  lesson: 'language_lesson',
  practice: 'practice',
}

export function partKeyFromRoute(route: string): LessonPartKey | null {
  return PART_ROUTE[route] ?? null
}

/**
 * Immediate invalidation for Server Actions after curriculum mutations.
 * Prefer this over `revalidateTag(..., 'max')` so admins see publish results right away.
 */
export function revalidateCurriculum() {
  updateTag(CURRICULUM_TAG)
}

function curriculumCache<T>(keyParts: string[], fn: () => Promise<T>): Promise<T> {
  return unstable_cache(fn, keyParts, {
    tags: [CURRICULUM_TAG],
    revalidate: CURRICULUM_REVALIDATE_SECONDS,
  })()
}

/**
 * Cookie-free reads of published curriculum only.
 * Service role is intentional so results can be cached across authenticated requests
 * without binding the cache entry to a user session cookie.
 */
function curriculumDb() {
  return createAdminClient()
}

const UNIT_COLUMNS =
  'id, slug, title, subtitle, description, level_id, sort_order, status' as const

function mapVocabRow(row: {
  id: string
  amharic: string
  english: string
  transliteration: string | null
  example_amharic: string | null
  example_english: string | null
  audio_slow_path: string | null
  audio_normal_path: string | null
  audio_natural_path: string | null
}): VocabItem {
  return {
    id: row.id,
    amharic: row.amharic,
    english: row.english,
    transliteration: row.transliteration,
    exampleAmharic: row.example_amharic,
    exampleEnglish: row.example_english,
    audioSlow: vocabAudioPublicUrl(row.audio_slow_path),
    audioNormal: vocabAudioPublicUrl(row.audio_normal_path),
    audioNatural: vocabAudioPublicUrl(row.audio_natural_path),
  }
}

export const getPublishedUnitBySlug = cache(async (levelSlug: string, unitSlug: string) => {
  return curriculumCache(
    ['curriculum', 'unit-by-slug', levelSlug, unitSlug],
    async () => {
      const supabase = curriculumDb()
      const { data, error } = await supabase
        .from('units')
        .select(UNIT_COLUMNS)
        .eq('level_id', levelSlug)
        .eq('slug', unitSlug)
        .eq('status', 'published')
        .maybeSingle()

      if (error) throw new Error(error.message)
      return data as PublishedUnit | null
    },
  )
})

export const getPublishedUnitsForLevel = cache(async (levelSlug: string) => {
  return curriculumCache(['curriculum', 'units-for-level', levelSlug], async () => {
    const supabase = curriculumDb()
    const { data, error } = await supabase
      .from('units')
      .select(UNIT_COLUMNS)
      .eq('level_id', levelSlug)
      .eq('status', 'published')
      .order('sort_order')

    if (error) throw new Error(error.message)
    return (data ?? []) as PublishedUnit[]
  })
})

/** All units for a level (including drafts) — for dashboard lock/unlock display. */
export const getUnitsForLevel = cache(async (levelSlug: string) => {
  return curriculumCache(['curriculum', 'all-units-for-level', levelSlug], async () => {
    const supabase = curriculumDb()
    const { data, error } = await supabase
      .from('units')
      .select(UNIT_COLUMNS)
      .eq('level_id', levelSlug)
      .order('sort_order')

    if (error) throw new Error(error.message)
    return (data ?? []) as PublishedUnit[]
  })
})

export const getPublishedPartContent = cache(
  async (unitId: string, part: LessonPartKey): Promise<LessonPartContent | null> => {
    return curriculumCache(['curriculum', 'part', unitId, part], async () => {
      const supabase = curriculumDb()
      const { data, error } = await supabase
        .from('lesson_parts')
        .select('content, status')
        .eq('unit_id', unitId)
        .eq('part', part)
        .eq('status', 'published')
        .maybeSingle()

      if (error) throw new Error(error.message)
      if (!data) return null
      return parsePartContent(data.content)
    })
  },
)

export const getUnitVocabulary = cache(async (unitId: string): Promise<VocabItem[]> => {
  return curriculumCache(['curriculum', 'unit-vocab', unitId], async () => {
    const supabase = curriculumDb()
    const { data, error } = await supabase
      .from('unit_vocabulary')
      .select('sort_order, vocabulary_id')
      .eq('unit_id', unitId)
      .order('sort_order')

    if (error) {
      console.error(error.message)
      return []
    }

    const ids = (data ?? []).map((row) => row.vocabulary_id).filter(Boolean)
    return getVocabularyByIdsUncached(ids)
  })
})

async function getVocabularyByIdsUncached(ids: string[]): Promise<VocabItem[]> {
  if (ids.length === 0) return []
  const supabase = curriculumDb()
  const { data, error } = await supabase
    .from('vocabulary_items')
    .select(
      'id, amharic, english, transliteration, example_amharic, example_english, audio_slow_path, audio_normal_path, audio_natural_path',
    )
    .in('id', ids)

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapVocabRow)
}

export const getVocabularyByIds = cache(async (ids: string[]): Promise<VocabItem[]> => {
  const sorted = [...ids].sort()
  return curriculumCache(['curriculum', 'vocab-by-ids', sorted.join(',')], () =>
    getVocabularyByIdsUncached(sorted),
  )
})

/**
 * One cache entry for the lesson shell: unit + published part in a single DB round-trip,
 * then vocabulary keyed by content references.
 */
export const getPublishedUnitPartPage = cache(
  async (
    levelSlug: string,
    unitSlug: string,
    part: LessonPartKey,
  ): Promise<{
    unit: PublishedUnit
    content: LessonPartContent | null
    vocabulary: Record<string, VocabItem>
  } | null> => {
    return curriculumCache(
      ['curriculum', 'unit-part-page', levelSlug, unitSlug, part],
      async () => {
        const supabase = curriculumDb()
        const { data: unit, error: unitError } = await supabase
          .from('units')
          .select(UNIT_COLUMNS)
          .eq('level_id', levelSlug)
          .eq('slug', unitSlug)
          .eq('status', 'published')
          .maybeSingle()

        if (unitError) throw new Error(unitError.message)
        if (!unit) return null

        const { data: partRow, error: partError } = await supabase
          .from('lesson_parts')
          .select('content, status')
          .eq('unit_id', unit.id)
          .eq('part', part)
          .eq('status', 'published')
          .maybeSingle()

        if (partError) throw new Error(partError.message)

        const content = partRow ? parsePartContent(partRow.content) : null
        if (!content) {
          return {
            unit: unit as PublishedUnit,
            content: null,
            vocabulary: {},
          }
        }

        const vocabIds = collectVocabularyIds(content)
        const vocabRows = await getVocabularyByIdsUncached(vocabIds)
        return {
          unit: unit as PublishedUnit,
          content,
          vocabulary: Object.fromEntries(vocabRows.map((v) => [v.id, v])),
        }
      },
    )
  },
)

/** Collect vocabulary IDs referenced by content blocks. */
export function collectVocabularyIds(content: LessonPartContent): string[] {
  const ids = new Set<string>()
  for (const block of content.blocks) {
    if (
      block.type === 'vocabulary_set' ||
      block.type === 'flashcard_revision' ||
      block.type === 'listening_practice'
    ) {
      for (const id of block.vocabularyIds) ids.add(id)
    }
  }
  return [...ids]
}

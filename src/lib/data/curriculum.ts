import 'server-only'

import { createClient } from '@/lib/supabase/server'
import {
  parsePartContent,
  type LessonPartContent,
  type LessonPartKey,
} from '@/lib/validation/content'

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
}

const PART_ROUTE: Record<string, LessonPartKey> = {
  culture: 'cultural_insight',
  lesson: 'language_lesson',
  practice: 'practice',
}

export function partKeyFromRoute(route: string): LessonPartKey | null {
  return PART_ROUTE[route] ?? null
}

export async function getPublishedUnitBySlug(levelSlug: string, unitSlug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('units')
    .select('id, slug, title, subtitle, description, level_id, sort_order, status')
    .eq('level_id', levelSlug)
    .eq('slug', unitSlug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as PublishedUnit | null
}

export async function getPublishedUnitsForLevel(levelSlug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('units')
    .select('id, slug, title, subtitle, description, level_id, sort_order, status')
    .eq('level_id', levelSlug)
    .eq('status', 'published')
    .order('sort_order')

  if (error) throw new Error(error.message)
  return (data ?? []) as PublishedUnit[]
}

export async function getPublishedPartContent(
  unitId: string,
  part: LessonPartKey,
): Promise<LessonPartContent | null> {
  const supabase = await createClient()
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
}

export async function getUnitVocabulary(unitId: string): Promise<VocabItem[]> {
  const supabase = await createClient()
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
  return getVocabularyByIds(ids)
}

export async function getVocabularyByIds(ids: string[]): Promise<VocabItem[]> {
  if (ids.length === 0) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vocabulary_items')
    .select('id, amharic, english, transliteration')
    .in('id', ids)

  if (error) throw new Error(error.message)
  return (data ?? []) as VocabItem[]
}

/** Collect vocabulary IDs referenced by content blocks. */
export function collectVocabularyIds(content: LessonPartContent): string[] {
  const ids = new Set<string>()
  for (const block of content.blocks) {
    if (block.type === 'vocabulary_set' || block.type === 'flashcard_revision') {
      for (const id of block.vocabularyIds) ids.add(id)
    }
  }
  return [...ids]
}

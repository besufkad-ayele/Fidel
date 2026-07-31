'use server'

import { requireRole } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { applyReviewRating, createInitialReviewState, type ReviewRating } from '@/lib/domain/srs'
import type { ActionResult } from '@/types/actions'

export type RateVocabularyResult = {
  nextReviewAt: string
  box: number
}

export type SessionRatingInput = {
  vocabularyId: string
  rating: ReviewRating
  difficultyWeight?: number
}

export async function rateVocabularyCardAction(input: {
  vocabularyId: string
  rating: ReviewRating
  difficultyWeight?: number
}): Promise<ActionResult<RateVocabularyResult>> {
  const { user } = await requireRole('student')
  const supabase = await createClient()

  if (!input.vocabularyId) {
    return { ok: false, error: 'Missing vocabulary id' }
  }
  if (![1, 2, 3].includes(input.rating)) {
    return { ok: false, error: 'Invalid rating' }
  }

  const { data: existing, error: readError } = await supabase
    .from('vocabulary_reviews')
    .select('*')
    .eq('student_id', user.id)
    .eq('vocabulary_id', input.vocabularyId)
    .maybeSingle()

  if (readError) {
    console.error('vocabulary_reviews read failed', readError)
    return { ok: false, error: readError.message }
  }

  const current = existing
    ? {
        box: existing.box as number,
        ease: Number(existing.ease),
        intervalDays: existing.interval_days as number,
        repetitions: existing.repetitions as number,
        nextReviewAt: new Date(existing.next_review_at as string),
      }
    : createInitialReviewState()

  const next = applyReviewRating(current, input.rating, input.difficultyWeight ?? 1)
  const nowIso = new Date().toISOString()

  const row = {
    student_id: user.id,
    vocabulary_id: input.vocabularyId,
    box: next.box,
    ease: next.ease,
    interval_days: next.intervalDays,
    repetitions: next.repetitions,
    last_rating: input.rating,
    last_reviewed_at: nowIso,
    next_review_at: next.nextReviewAt.toISOString(),
    updated_at: nowIso,
  }

  const { error: writeError } = await supabase
    .from('vocabulary_reviews')
    .upsert(row, { onConflict: 'student_id,vocabulary_id' })

  if (writeError) {
    console.error('vocabulary_reviews upsert failed', writeError)
    return { ok: false, error: writeError.message }
  }

  // No revalidatePath — refreshing remounts the study deck mid-session.
  return {
    ok: true,
    data: { nextReviewAt: next.nextReviewAt.toISOString(), box: next.box },
  }
}

export async function saveVocabularySessionAction(
  ratings: SessionRatingInput[],
): Promise<ActionResult<{ saved: number }>> {
  const { user } = await requireRole('student')
  const supabase = await createClient()

  if (!ratings.length) return { ok: true, data: { saved: 0 } }

  for (const item of ratings) {
    if (!item.vocabularyId) return { ok: false, error: 'Missing vocabulary id' }
    if (![1, 2, 3].includes(item.rating)) return { ok: false, error: 'Invalid rating' }
  }

  const vocabIds = [...new Set(ratings.map((r) => r.vocabularyId))]
  const { data: existingRows, error: readError } = await supabase
    .from('vocabulary_reviews')
    .select('*')
    .eq('student_id', user.id)
    .in('vocabulary_id', vocabIds)

  if (readError) {
    console.error('vocabulary_reviews read failed', readError)
    return { ok: false, error: readError.message }
  }

  const stateByVocab = new Map<
    string,
    {
      box: number
      ease: number
      intervalDays: number
      repetitions: number
      nextReviewAt: Date
      lastRating: ReviewRating
    }
  >()

  for (const row of existingRows ?? []) {
    stateByVocab.set(row.vocabulary_id, {
      box: row.box as number,
      ease: Number(row.ease),
      intervalDays: row.interval_days as number,
      repetitions: row.repetitions as number,
      nextReviewAt: new Date(row.next_review_at as string),
      lastRating: (row.last_rating ?? 2) as ReviewRating,
    })
  }

  for (const item of ratings) {
    const current = stateByVocab.get(item.vocabularyId) ?? {
      ...createInitialReviewState(),
      lastRating: item.rating,
    }
    const next = applyReviewRating(current, item.rating, item.difficultyWeight ?? 1)
    stateByVocab.set(item.vocabularyId, {
      box: next.box,
      ease: next.ease,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      nextReviewAt: next.nextReviewAt,
      lastRating: item.rating,
    })
  }

  const nowIso = new Date().toISOString()
  const rows = [...stateByVocab.entries()].map(([vocabularyId, s]) => ({
    student_id: user.id,
    vocabulary_id: vocabularyId,
    box: s.box,
    ease: s.ease,
    interval_days: s.intervalDays,
    repetitions: s.repetitions,
    last_rating: s.lastRating,
    last_reviewed_at: nowIso,
    next_review_at: s.nextReviewAt.toISOString(),
    updated_at: nowIso,
  }))

  const { error: writeError } = await supabase
    .from('vocabulary_reviews')
    .upsert(rows, { onConflict: 'student_id,vocabulary_id' })

  if (writeError) {
    console.error('vocabulary_reviews upsert failed', writeError)
    return { ok: false, error: writeError.message }
  }

  return { ok: true, data: { saved: rows.length } }
}

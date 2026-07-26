'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { applyReviewRating, createInitialReviewState, type ReviewRating } from '@/lib/domain/srs'

export async function rateVocabularyCardAction(input: {
  vocabularyId: string
  rating: ReviewRating
  difficultyWeight?: number
}) {
  const { user } = await requireRole('student')
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('vocabulary_reviews')
    .select('*')
    .eq('student_id', user.id)
    .eq('vocabulary_id', input.vocabularyId)
    .maybeSingle()

  const current = existing
    ? {
        box: existing.box as number,
        ease: Number(existing.ease),
        intervalDays: existing.interval_days as number,
        repetitions: existing.repetitions as number,
        nextReviewAt: new Date(existing.next_review_at as string),
      }
    : createInitialReviewState()

  const next = applyReviewRating(
    current,
    input.rating,
    input.difficultyWeight ?? 1,
  )

  const payload = {
    box: next.box,
    ease: next.ease,
    interval_days: next.intervalDays,
    repetitions: next.repetitions,
    last_rating: input.rating,
    last_reviewed_at: new Date().toISOString(),
    next_review_at: next.nextReviewAt.toISOString(),
  }

  if (existing?.id) {
    const { error } = await supabase
      .from('vocabulary_reviews')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('vocabulary_reviews').insert({
      student_id: user.id,
      vocabulary_id: input.vocabularyId,
      ...payload,
    })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/vocabulary')
  revalidatePath('/vocabulary/flashcards')
  return { ok: true as const, nextReviewAt: next.nextReviewAt.toISOString(), box: next.box }
}

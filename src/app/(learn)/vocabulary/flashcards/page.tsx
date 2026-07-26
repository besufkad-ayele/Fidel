import Link from 'next/link'
import type { Metadata } from 'next'
import { AmharicText } from '@/components/shared/amharic-text'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { FlashcardStudyClient } from './flashcard-study-client'

export const metadata: Metadata = { title: 'Flashcards' }

export default async function FlashcardsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; due?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let query = supabase
    .from('vocabulary_items')
    .select(
      'id, amharic, english, transliteration, difficulty_weight, level_id, audio_slow_path, audio_normal_path, audio_natural_path',
    )
    .order('amharic')
    .limit(100)

  if (sp.level) query = query.eq('level_id', sp.level)

  const { data: words } = await query

  const { data: reviews } = user
    ? await supabase
        .from('vocabulary_reviews')
        .select('vocabulary_id, next_review_at, box')
        .eq('student_id', user.id)
    : { data: [] as { vocabulary_id: string; next_review_at: string; box: number }[] }

  const reviewMap = new Map((reviews ?? []).map((r) => [r.vocabulary_id, r]))
  const now = Date.now()

  const cards = (words ?? [])
    .map((w) => {
      const review = reviewMap.get(w.id)
      const due = !review || new Date(review.next_review_at).getTime() <= now
      return {
        id: w.id,
        front: w.amharic,
        back: w.english,
        transliteration: w.transliteration ?? undefined,
        english: w.english,
        audio: {
          slow: w.audio_slow_path,
          normal: w.audio_normal_path,
          natural: w.audio_natural_path,
        },
        difficultyWeight: w.difficulty_weight ?? 1,
        due,
        box: review?.box ?? 1,
      }
    })
    .filter((c) => (sp.due === '1' ? c.due : true))

  // Harder / lower-box cards first when due-only
  cards.sort((a, b) => a.box - b.box || a.difficultyWeight - b.difficultyWeight)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
            Vocabulary
          </p>
          <h1 className="font-display text-3xl text-green-900">Flashcards</h1>
          <p className="mt-1 text-sm text-green-700">
            Rate cards Again / Good / Easy. Harder words return sooner.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/vocabulary">Bank</Link>
          </Button>
          <Button asChild variant={sp.due === '1' ? 'default' : 'outline'} size="sm">
            <Link href="/vocabulary/flashcards?due=1">Due only</Link>
          </Button>
        </div>
      </header>

      {cards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cream-400 bg-cream-50 p-8 text-center">
          <AmharicText size="xl" className="text-gold-500">
            ሀ
          </AmharicText>
          <p className="mt-3 font-display text-xl text-green-900">No cards yet</p>
          <p className="mt-1 text-sm text-green-700">
            Add vocabulary in admin, then return here to study.
          </p>
        </div>
      ) : (
        <FlashcardStudyClient cards={cards} />
      )}
    </div>
  )
}

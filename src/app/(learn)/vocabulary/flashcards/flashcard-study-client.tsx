'use client'

import { InteractiveFlashcards } from '@/components/content/interactive/flashcards'
import { AudioPlaybackProvider } from '@/components/shared/audio-player'
import { rateVocabularyCardAction } from '@/lib/actions/vocabulary-reviews'
import type { AudioSources } from '@/components/shared/audio-player'

type Card = {
  id: string
  front: string
  back: string
  transliteration?: string
  english?: string
  audio?: AudioSources
  difficultyWeight: number
}

export function FlashcardStudyClient({ cards }: { cards: Card[] }) {
  return (
    <AudioPlaybackProvider>
      <InteractiveFlashcards
        cards={cards}
        title="Study deck"
        mode="student"
        onRate={async (cardId, rating) => {
          const card = cards.find((c) => c.id === cardId)
          await rateVocabularyCardAction({
            vocabularyId: cardId,
            rating,
            difficultyWeight: card?.difficultyWeight ?? 1,
          })
        }}
      />
    </AudioPlaybackProvider>
  )
}

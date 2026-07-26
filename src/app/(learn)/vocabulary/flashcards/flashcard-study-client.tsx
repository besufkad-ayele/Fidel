'use client'

import { InteractiveFlashcards } from '@/components/content/interactive/flashcards'
import { rateVocabularyCardAction } from '@/lib/actions/vocabulary-reviews'

type Card = {
  id: string
  front: string
  back: string
  difficultyWeight: number
}

export function FlashcardStudyClient({ cards }: { cards: Card[] }) {
  return (
    <InteractiveFlashcards
      cards={cards}
      title="Study deck"
      mode="student"
      onRate={(cardId, rating) => {
        const card = cards.find((c) => c.id === cardId)
        void rateVocabularyCardAction({
          vocabularyId: cardId,
          rating,
          difficultyWeight: card?.difficultyWeight ?? 1,
        })
      }}
    />
  )
}

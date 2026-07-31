'use client'

import { useMemo, useState, useTransition } from 'react'
import { InteractiveFlashcards } from '@/components/content/interactive/flashcards'
import { AudioPlaybackProvider, type AudioSources } from '@/components/shared/audio-player'
import { saveVocabularySessionAction } from '@/lib/actions/vocabulary-reviews'

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
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [sessionSaved, setSessionSaved] = useState(false)
  const [savePending, startSave] = useTransition()
  const weights = useMemo(() => new Map(cards.map((c) => [c.id, c.difficultyWeight ?? 1])), [cards])

  return (
    <AudioPlaybackProvider>
      <InteractiveFlashcards
        cards={cards}
        title="Study deck"
        mode="student"
        onSessionComplete={(events) => {
          startSave(async () => {
            const result = await saveVocabularySessionAction(
              events.map((e) => ({
                vocabularyId: e.cardId,
                rating: e.rating,
                difficultyWeight: weights.get(e.cardId) ?? 1,
              })),
            )
            if (!result.ok) {
              setSessionError(result.error || 'Could not save study progress')
              setSessionSaved(false)
              return
            }
            setSessionSaved(true)
            setSessionError(null)
          })
        }}
        completePending={savePending}
        completeSaved={sessionSaved}
        completeError={sessionError}
        onResetSessionState={() => {
          setSessionSaved(false)
          setSessionError(null)
        }}
      />
    </AudioPlaybackProvider>
  )
}

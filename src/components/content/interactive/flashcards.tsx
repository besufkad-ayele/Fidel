'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AmharicText } from '@/components/shared/amharic-text'
import { cn } from '@/lib/utils'

export type FlashcardItem = {
  id: string
  front: string
  back: string
}

export function InteractiveFlashcards({
  cards,
  title,
  mode = 'student',
  onRate,
}: {
  cards: FlashcardItem[]
  title?: string
  mode?: 'student' | 'preview'
  onRate?: (cardId: string, rating: 1 | 2 | 3) => void
}) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)

  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-cream-400 bg-cream-100 px-4 py-6 text-center text-sm text-green-600">
        No flashcards yet.
      </div>
    )
  }

  const card = cards[Math.min(index, cards.length - 1)]

  function rate(rating: 1 | 2 | 3) {
    onRate?.(card.id, rating)
    if (index >= cards.length - 1) {
      setDone(true)
      return
    }
    setIndex((i) => i + 1)
    setFlipped(false)
  }

  if (done) {
    return (
      <div className="rounded-xl border border-cream-300 bg-cream-50 p-6 text-center">
        <p className="font-display text-xl text-green-900">Deck complete</p>
        <p className="mt-1 text-sm text-green-700">
          Reviewed {cards.length} card{cards.length === 1 ? '' : 's'}
          {mode === 'preview' ? ' (preview)' : ''}.
        </p>
        <Button
          type="button"
          className="mt-4"
          variant="outline"
          onClick={() => {
            setIndex(0)
            setFlipped(false)
            setDone(false)
          }}
        >
          Study again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {title ? (
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">{title}</p>
      ) : null}
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={cn(
          'flex min-h-[160px] w-full flex-col items-center justify-center rounded-xl border border-cream-300 bg-cream-50 p-6 text-center shadow-card transition',
          flipped && 'bg-gold-50 border-gold-300',
        )}
      >
        {!flipped ? (
          /[ሀ-፼]/.test(card.front) ? (
            <AmharicText size="display">{card.front}</AmharicText>
          ) : (
            <p className="font-display text-2xl text-green-900">{card.front}</p>
          )
        ) : (
          <p className="text-lg text-green-900">{card.back}</p>
        )}
        <span className="mt-3 text-[11px] tracking-wide text-green-600 uppercase">
          {flipped ? 'Tap to flip back' : 'Tap to flip'}
        </span>
      </button>
      <div className="flex items-center justify-between gap-2 text-xs text-green-600">
        <span>
          {index + 1} / {cards.length}
        </span>
        {flipped ? (
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => rate(1)}>
              Again
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => rate(2)}>
              Good
            </Button>
            <Button type="button" size="sm" onClick={() => rate(3)}>
              Easy
            </Button>
          </div>
        ) : (
          <Button type="button" size="sm" variant="ghost" onClick={() => setFlipped(true)}>
            Reveal
          </Button>
        )}
      </div>
    </div>
  )
}

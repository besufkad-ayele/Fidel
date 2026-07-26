'use client'

import { useCallback, useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AmharicText } from '@/components/shared/amharic-text'
import { AudioPlayer, type AudioSources } from '@/components/shared/audio-player'
import { cn } from '@/lib/utils'

export type FlashcardItem = {
  id: string
  front: string
  back: string
  transliteration?: string
  english?: string
  exampleAm?: string
  exampleEn?: string
  audio?: AudioSources
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
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const card = cards[Math.min(index, Math.max(cards.length - 1, 0))]

  const goNext = useCallback(
    (rating?: 1 | 2 | 3) => {
      if (!card) return
      if (rating) onRate?.(card.id, rating)
      if (index >= cards.length - 1) {
        setDone(true)
        return
      }
      setIndex((i) => i + 1)
      setFlipped(false)
    },
    [card, cards.length, index, onRate],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done || !card) return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.code === 'Space') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (flipped && e.key === '1') {
        goNext(1)
      } else if (flipped && e.key === '2') {
        goNext(2)
      } else if (flipped && e.key === '3') {
        goNext(3)
      } else if (e.key === 'ArrowLeft' && index > 0) {
        setIndex((i) => i - 1)
        setFlipped(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [card, done, flipped, goNext, index])

  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-cream-400 bg-cream-100 px-4 py-10 text-center text-sm text-green-600">
        No flashcards yet.
      </div>
    )
  }

  if (done) {
    return (
      <div className="mx-auto max-w-[420px] rounded-2xl border border-cream-300 bg-cream-50 p-8 text-center shadow-modal">
        <p className="font-display text-2xl text-green-900">Deck complete</p>
        <p className="mt-2 text-sm text-green-700">
          Reviewed {cards.length} card{cards.length === 1 ? '' : 's'}
          {mode === 'preview' ? ' (preview)' : ''}.
        </p>
        <Button
          type="button"
          className="mt-5"
          variant="outline"
          onClick={() => {
            setIndex(0)
            setFlipped(false)
            setDone(false)
          }}
        >
          <RotateCcw className="mr-1.5 size-3.5" />
          Study again
        </Button>
      </div>
    )
  }

  const progress = ((index + (flipped ? 0.5 : 0)) / cards.length) * 100
  const backEnglish = card.english || card.back
  const backTranslit = card.transliteration
  const hasAudio =
    Boolean(card.audio?.url || card.audio?.normal || card.audio?.slow || card.audio?.natural) ||
    /[ሀ-፼]/.test(card.front)

  return (
    <div className="mx-auto w-full max-w-[420px] space-y-4">
      {title ? (
        <p className="text-center text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
          {title}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <div className="h-1 overflow-hidden rounded-full bg-cream-200">
          <div
            className="h-full rounded-full bg-gold-500 transition-[width] duration-300"
            style={{ width: `${Math.max(8, progress)}%` }}
          />
        </div>
        <p className="text-center text-xs tabular-nums text-green-600">
          {index + 1} / {cards.length}
        </p>
      </div>

      {/* Stacked deck depth */}
      <div className="relative mx-auto aspect-[3/4] w-full">
        <div
          aria-hidden
          className="absolute inset-x-3 top-2 bottom-0 rounded-2xl border border-cream-300 bg-cream-100 shadow-card"
        />
        <div
          aria-hidden
          className="absolute inset-x-1.5 top-1 bottom-0 rounded-2xl border border-cream-300 bg-cream-50 shadow-card"
        />

        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-label={flipped ? 'Flip card back' : 'Reveal answer'}
          className="absolute inset-0 [perspective:1200px]"
        >
          <div
            className={cn(
              'relative h-full w-full rounded-2xl transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] [transform-style:preserve-3d]',
              flipped && 'rotate-y-180',
              reducedMotion && 'duration-0',
            )}
            style={
              reducedMotion
                ? undefined
                : { transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }
            }
          >
            {/* Front */}
            <div
              className={cn(
                'absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-cream-300 bg-cream-50 p-8 text-center shadow-modal [backface-visibility:hidden]',
                reducedMotion && flipped && 'invisible',
              )}
            >
              <div className="pointer-events-none absolute inset-4 rounded-xl border border-dashed border-cream-300/80" />
              {/[ሀ-፼]/.test(card.front) ? (
                <AmharicText size="hero" className="relative text-gold-700">
                  {card.front}
                </AmharicText>
              ) : (
                <p className="relative font-display text-4xl text-gold-700 sm:text-5xl">
                  {card.front}
                </p>
              )}
              <span className="relative mt-8 text-[11px] font-medium tracking-wide text-green-600 uppercase">
                Tap or press space to reveal
              </span>
            </div>

            {/* Back */}
            <div
              className={cn(
                'absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-gold-300 bg-gradient-to-b from-gold-50 to-cream-50 p-8 text-center shadow-modal [backface-visibility:hidden] [transform:rotateY(180deg)]',
                reducedMotion && !flipped && 'invisible',
                reducedMotion && flipped && '[transform:none]',
              )}
            >
              {backTranslit ? (
                <p className="text-lg italic text-green-600">{backTranslit}</p>
              ) : null}
              <p className="font-display text-2xl text-green-900 sm:text-3xl">{backEnglish}</p>
              {card.exampleAm ? (
                <div className="mt-2 space-y-1 rounded-xl bg-white/70 px-4 py-3 ring-1 ring-cream-300">
                  <AmharicText size="md" className="block text-green-950">
                    {card.exampleAm}
                  </AmharicText>
                  {card.exampleEn ? (
                    <p className="text-sm text-green-700">{card.exampleEn}</p>
                  ) : null}
                </div>
              ) : null}
              {hasAudio ? (
                <div
                  className="mt-2"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <AudioPlayer
                    variant="inline"
                    label="Listen"
                    showSpeed
                    sources={card.audio ?? {}}
                    speakText={/[ሀ-፼]/.test(card.front) ? card.front : undefined}
                  />
                </div>
              ) : null}
              <span className="mt-2 text-[11px] tracking-wide text-green-600 uppercase">
                Rate how well you knew it
              </span>
            </div>
          </div>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {flipped ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-danger-500/30 bg-danger-50 text-danger-500 hover:bg-danger-50"
              onClick={() => goNext(1)}
            >
              Again
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="bg-cream-200 text-green-700 hover:bg-cream-300"
              onClick={() => goNext(2)}
            >
              Good
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-success-50 text-success-500 hover:bg-success-50"
              onClick={() => goNext(3)}
            >
              Easy
            </Button>
          </>
        ) : (
          <Button type="button" size="sm" variant="ghost" onClick={() => setFlipped(true)}>
            Reveal
          </Button>
        )}
      </div>

      <p className="hidden text-center text-[11px] text-green-600 sm:block">
        Keyboard: Space flip · 1 Again · 2 Good · 3 Easy · ← previous
      </p>
    </div>
  )
}

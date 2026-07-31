'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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

export type FlashcardRatingEvent = {
  cardId: string
  rating: 1 | 2 | 3
}

type ForcedReview = {
  untilEasy: boolean
  remainingShows: number
}

type InteractiveFlashcardsProps = {
  cards: FlashcardItem[]
  title?: string
  mode?: 'student' | 'preview'
  onSessionComplete?: (events: FlashcardRatingEvent[]) => void | Promise<void>
  completePending?: boolean
  completeSaved?: boolean
  completeError?: string | null
  onResetSessionState?: () => void
}

function insertWithGap(queue: number[], cardIdx: number, preferredGap = 3): number[] {
  if (queue.length === 0) return [cardIdx]
  const gap = Math.min(preferredGap, queue.length)
  const pos = Math.max(1, gap)
  const next = [...queue]
  next.splice(pos, 0, cardIdx)
  return next
}

export function InteractiveFlashcards({
  cards,
  title = 'Flashcards',
  mode = 'student',
  onSessionComplete,
  completePending = false,
  completeSaved = false,
  completeError = null,
  onResetSessionState,
}: InteractiveFlashcardsProps) {
  const cardsKey = useMemo(() => cards.map((c) => c.id).join('|'), [cards])
  const [queue, setQueue] = useState<number[]>(() => cards.map((_, i) => i))
  const [flipped, setFlipped] = useState(false)
  const [forced, setForced] = useState<Record<string, ForcedReview>>({})
  const [stats, setStats] = useState({ again: 0, good: 0, easy: 0 })
  const [ratingEvents, setRatingEvents] = useState<FlashcardRatingEvent[]>([])
  const completionTriggeredRef = useRef(false)

  useEffect(() => {
    setQueue(cards.map((_, i) => i))
    setFlipped(false)
    setForced({})
    setStats({ again: 0, good: 0, easy: 0 })
    setRatingEvents([])
    completionTriggeredRef.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardsKey])

  const currentIdx = queue[0]
  const current = currentIdx !== undefined ? cards[currentIdx] : undefined
  const remainingUnique = useMemo(() => new Set(queue).size, [queue])
  const mastered = Math.max(0, cards.length - remainingUnique)
  const progressPct = cards.length ? Math.round((mastered / cards.length) * 100) : 0
  const done = queue.length === 0

  useEffect(() => {
    if (!done || !onSessionComplete || completionTriggeredRef.current) return
    completionTriggeredRef.current = true
    void onSessionComplete(ratingEvents)
  }, [done, onSessionComplete, ratingEvents])

  function advanceAfterRate(rating: 1 | 2 | 3) {
    if (currentIdx === undefined || !current) return

    const rest = queue.slice(1)
    const cardId = current.id
    const otherCount = rest.length

    if (rating === 1) {
      setForced((prev) => ({
        ...prev,
        [cardId]: {
          untilEasy: true,
          remainingShows: Math.max(prev[cardId]?.remainingShows ?? 0, 3),
        },
      }))
      setQueue(otherCount === 0 ? [currentIdx] : insertWithGap(rest, currentIdx, 3))
      setStats((s) => ({ ...s, again: s.again + 1 }))
      return
    }

    if (rating === 3) {
      setForced((prev) => {
        const next = { ...prev }
        delete next[cardId]
        return next
      })
      setQueue(rest)
      setStats((s) => ({ ...s, easy: s.easy + 1 }))
      return
    }

    const req = forced[cardId]
    if (req?.untilEasy) {
      if (otherCount === 0) {
        setQueue([currentIdx])
      } else {
        const remainingShows = req.remainingShows - 1
        if (remainingShows <= 0) {
          setForced((prev) => {
            const next = { ...prev }
            delete next[cardId]
            return next
          })
          setQueue(rest)
        } else {
          setForced((prev) => ({
            ...prev,
            [cardId]: { untilEasy: true, remainingShows },
          }))
          setQueue(insertWithGap(rest, currentIdx, 3))
        }
      }
    } else {
      setQueue(rest)
    }
    setStats((s) => ({ ...s, good: s.good + 1 }))
  }

  function rate(rating: 1 | 2 | 3) {
    if (!current || completePending) return
    setRatingEvents((prev) => [...prev, { cardId: current.id, rating }])
    setFlipped(false)
    advanceAfterRate(rating)
  }

  useEffect(() => {
    if (done || completePending) return
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.code === 'Space') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (flipped && e.key === '1') rate(1)
      else if (flipped && e.key === '2') rate(2)
      else if (flipped && e.key === '3') rate(3)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, flipped, completePending, current?.id, queue])

  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-cream-400 bg-cream-50 p-6 text-center text-sm text-green-600">
        No flashcards in this set.
      </div>
    )
  }

  if (done) {
    return (
      <div className="space-y-4 rounded-2xl border border-cream-300 bg-gradient-to-br from-cream-50 via-gold-50 to-cream-100 p-6 text-center shadow-card">
        <p className="font-display text-xl font-semibold text-green-900">Session complete</p>
        <p className="text-sm text-green-700">
          Again {stats.again} · Good {stats.good} · Easy {stats.easy}
        </p>
        <Progress value={100} className="h-2" />
        {completePending ? (
          <p className="text-xs text-green-700">Saving session progress…</p>
        ) : completeSaved ? (
          <p className="text-xs text-green-700">Progress saved.</p>
        ) : completeError ? (
          <p className="text-xs text-danger-500">{completeError}</p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="border-green-300 bg-white text-green-800 hover:bg-green-50"
          disabled={completePending}
          onClick={() => {
            setQueue(cards.map((_, i) => i))
            setForced({})
            setStats({ again: 0, good: 0, easy: 0 })
            setFlipped(false)
            setRatingEvents([])
            completionTriggeredRef.current = false
            onResetSessionState?.()
          }}
        >
          Study again
        </Button>
      </div>
    )
  }

  const needsRetry = current ? Boolean(forced[current.id]?.untilEasy) : false
  const looksAmharic = current ? /[ሀ-፼]/.test(current.front) : false
  const showAnswer = flipped && !completePending

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-green-900">{title}</p>
          <p className="text-xs text-green-600">
            {mastered} of {cards.length} done · {remainingUnique} left
            {needsRetry ? ' · reviewing again' : ''}
          </p>
        </div>
        {mode === 'preview' ? (
          <span className="rounded-full border border-gold-300 bg-gold-100 px-2 py-0.5 text-[10px] font-medium text-gold-800">
            Preview
          </span>
        ) : null}
      </div>

      <Progress value={progressPct} className="h-2" />

      <div
        className="relative mx-auto w-full max-w-lg"
        style={{ perspective: '1400px', perspectiveOrigin: '50% 45%' }}
      >
        {queue.length > 2 ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-5 h-[calc(100%-1.25rem)] rounded-2xl border border-green-800/30 bg-green-900/25 shadow-lg"
            style={{ transform: 'translateZ(-48px) rotateX(6deg) scale(0.94)' }}
          />
        ) : null}
        {queue.length > 1 ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-3 top-2.5 h-[calc(100%-0.65rem)] rounded-2xl border border-gold-400/40 bg-gradient-to-br from-gold-200/80 to-cream-200/90 shadow-md"
            style={{ transform: 'translateZ(-24px) rotateX(3deg) scale(0.97)' }}
          />
        ) : null}

        {/* key remounts each card face-down so advance never animates through the answer */}
        <button
          key={current?.id ?? 'card'}
          type="button"
          onClick={() => {
            if (!completePending) setFlipped((v) => !v)
          }}
          disabled={completePending}
          aria-pressed={showAnswer}
          aria-label={showAnswer ? 'Show front of card' : 'Flip card to reveal answer'}
          className={cn(
            'relative z-[1] block h-[260px] w-full cursor-pointer rounded-2xl border-0 bg-transparent p-0 text-left',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100',
            completePending && 'cursor-wait',
            !showAnswer && !completePending && 'transition-[filter] duration-300 hover:brightness-[1.03]',
          )}
          style={{
            transformStyle: 'preserve-3d',
            transform: showAnswer ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-green-600/50 px-8 py-8 text-center shadow-[0_18px_40px_-12px_rgba(15,32,32,0.55),inset_0_1px_0_rgba(224,186,111,0.25)]"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg) translateZ(1px)',
              background:
                'radial-gradient(120% 90% at 15% 10%, rgba(224,186,111,0.22), transparent 45%), linear-gradient(155deg, #2a4a48 0%, #1a3636 48%, #0f2020 100%)',
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent"
            />
            {looksAmharic ? (
              <AmharicText size="hero" className="text-cream-50 drop-shadow-sm">
                {current?.front}
              </AmharicText>
            ) : (
              <p className="text-4xl font-semibold tracking-wide text-cream-50 drop-shadow-sm sm:text-5xl">
                {current?.front}
              </p>
            )}
            {current?.transliteration ? (
              <p className="text-sm text-gold-300/90">{current.transliteration}</p>
            ) : null}
            {completePending ? (
              <p className="mt-1 text-[11px] font-medium tracking-[0.16em] text-gold-300 uppercase">
                Saving…
              </p>
            ) : (
              <p className="mt-1 text-[11px] font-medium tracking-[0.16em] text-gold-400/80 uppercase">
                Tap to flip
              </p>
            )}
          </div>

          {/* Back — only meaningful when flipped; still in DOM for 3D */}
          <div
            aria-hidden={!showAnswer}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-gold-300/80 px-8 py-8 text-center shadow-[0_18px_40px_-12px_rgba(78,59,30,0.28),inset_0_1px_0_rgba(255,255,255,0.7)]"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg) translateZ(1px)',
              background:
                'radial-gradient(110% 80% at 85% 15%, rgba(214,173,96,0.35), transparent 42%), linear-gradient(160deg, #fefdfb 0%, #faf0da 55%, #f3dfb2 100%)',
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-green-600/25 to-transparent"
            />
            <p className="text-2xl font-semibold text-green-900 sm:text-3xl">{current?.back}</p>
            {current?.english && current.english !== current.back ? (
              <p className="text-sm text-green-600">{current.english}</p>
            ) : null}
            {current?.exampleAm || current?.exampleEn ? (
              <div className="mt-1 max-w-sm space-y-0.5 text-sm text-green-700">
                {current.exampleAm ? (
                  <AmharicText size="sm" className="block text-green-800">
                    {current.exampleAm}
                  </AmharicText>
                ) : null}
                {current.exampleEn ? <p className="italic">{current.exampleEn}</p> : null}
              </div>
            ) : null}
            <p className="mt-1 text-[11px] font-medium tracking-[0.16em] text-gold-700/70 uppercase">
              Tap to flip back
            </p>
          </div>
        </button>
      </div>

      {showAnswer && current ? (
        <div className="mx-auto flex w-full max-w-lg justify-center">
          <AudioPlayer
            sources={current.audio ?? {}}
            variant="inline"
            label="Listen"
            showSpeed
            speakText={looksAmharic ? current.front : undefined}
          />
        </div>
      ) : null}

      {showAnswer ? (
        <div className="mx-auto grid w-full max-w-lg grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full border-danger-500/30 bg-danger-50 text-danger-500 hover:bg-danger-50/80"
            disabled={completePending}
            onClick={() => rate(1)}
          >
            Again
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full border border-cream-300 bg-cream-100 text-green-800 hover:bg-cream-200"
            disabled={completePending}
            onClick={() => rate(2)}
          >
            Good
          </Button>
          <Button
            type="button"
            className="w-full bg-green-700 text-cream-50 hover:bg-green-600"
            disabled={completePending}
            onClick={() => rate(3)}
          >
            Easy
          </Button>
        </div>
      ) : (
        <p className="text-center text-xs text-green-600">
          {completePending
            ? 'Saving session progress…'
            : 'Flip the card, then rate how it felt. Space flips · 1 Again · 2 Good · 3 Easy'}
        </p>
      )}
    </div>
  )
}

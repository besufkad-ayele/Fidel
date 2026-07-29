'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { z } from 'zod'
import type { matchingCardsBlockSchema } from '@/lib/validation/content'
import { cn } from '@/lib/utils'
import { AmharicText } from '@/components/shared/amharic-text'

type Block = z.infer<typeof matchingCardsBlockSchema>

type RightChip = {
  id: string
  text: string
  /** Index of the left item this chip correctly belongs to */
  correctLeftIndex: number
}

function hasAmharic(text: string) {
  return /[ሀ-፼]/.test(text)
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function TextLabel({ text }: { text: string }) {
  return hasAmharic(text) ? <AmharicText size="sm">{text}</AmharicText> : <>{text}</>
}

export function InteractiveMatching({
  block,
  mode = 'student',
}: {
  block: Block
  mode?: 'student' | 'preview'
}) {
  const pairs = block.pairs.filter((p) => p.left.trim() || p.right.trim())

  const pairsKey = useMemo(
    () => pairs.map((p) => `${p.left}::${p.right}`).join('|'),
    [pairs],
  )

  const [rightChips, setRightChips] = useState<RightChip[]>([])
  /** leftIndex → right chip id */
  const [matches, setMatches] = useState<Record<number, string>>({})
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null)
  const [selectedRightId, setSelectedRightId] = useState<string | null>(null)
  const [draggingRightId, setDraggingRightId] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const chips: RightChip[] = pairs.map((pair, i) => ({
      id: `right-${i}-${pair.right}`,
      text: pair.right,
      correctLeftIndex: i,
    }))
    setRightChips(shuffle(chips))
    setMatches({})
    setSelectedLeft(null)
    setSelectedRightId(null)
    setChecked(false)
    // Reset when pair content changes (not on every parent render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairsKey])

  const chipById = useMemo(() => {
    const map = new Map<string, RightChip>()
    for (const chip of rightChips) map.set(chip.id, chip)
    return map
  }, [rightChips])

  const usedRightIds = useMemo(() => new Set(Object.values(matches)), [matches])

  const locked = checked && mode === 'student'

  function assign(leftIndex: number, rightId: string) {
    if (locked) return
    setMatches((prev) => {
      const next = { ...prev }
      // Free any left that already held this chip
      for (const [left, id] of Object.entries(next)) {
        if (id === rightId) delete next[Number(left)]
      }
      next[leftIndex] = rightId
      return next
    })
    setSelectedLeft(null)
    setSelectedRightId(null)
  }

  function clearMatch(leftIndex: number) {
    if (locked) return
    setMatches((prev) => {
      const next = { ...prev }
      delete next[leftIndex]
      return next
    })
  }

  function onPickLeft(leftIndex: number) {
    if (locked) return
    if (selectedRightId) {
      assign(leftIndex, selectedRightId)
      return
    }
    setSelectedLeft((prev) => (prev === leftIndex ? null : leftIndex))
  }

  function onPickRight(rightId: string) {
    if (locked || usedRightIds.has(rightId)) return
    if (selectedLeft !== null) {
      assign(selectedLeft, rightId)
      return
    }
    setSelectedRightId((prev) => (prev === rightId ? null : rightId))
  }

  const allMatched = pairs.length > 0 && Object.keys(matches).length >= pairs.length

  const score = pairs.reduce((acc, _pair, i) => {
    const chipId = matches[i]
    if (!chipId) return acc
    const chip = chipById.get(chipId)
    return acc + (chip?.correctLeftIndex === i ? 1 : 0)
  }, 0)

  if (pairs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-cream-400 bg-cream-100 px-4 py-6 text-center text-sm text-green-600">
        No matching pairs yet.
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-xl border border-cream-300 bg-cream-50 p-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
          Matching
        </p>
        {block.prompt ? (
          <p className="mt-1 font-medium text-green-900">{block.prompt}</p>
        ) : (
          <p className="mt-1 text-sm text-green-700">
            Match each item on the left with the correct answer on the right.
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Tip: tap one side then the other, or drag an answer onto a left card.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold tracking-wide text-green-700 uppercase">
            Items
          </p>
          {pairs.map((pair, i) => {
            const matchedId = matches[i]
            const matchedChip = matchedId ? chipById.get(matchedId) : null
            const isCorrect =
              checked && matchedChip && matchedChip.correctLeftIndex === i
            const isWrong = checked && matchedChip && matchedChip.correctLeftIndex !== i
            return (
              <div
                key={`left-${i}`}
                onDragOver={(e) => {
                  if (locked) return
                  e.preventDefault()
                }}
                onDrop={(e) => {
                  if (locked) return
                  e.preventDefault()
                  const rightId = e.dataTransfer.getData('text/plain')
                  if (rightId) assign(i, rightId)
                  setDraggingRightId(null)
                }}
                className={cn(
                  'rounded-lg border bg-white p-3 transition-colors',
                  selectedLeft === i && 'border-gold-500 ring-2 ring-gold-300',
                  draggingRightId && !locked && 'border-gold-400 border-dashed',
                  isCorrect && 'border-green-600 bg-green-50',
                  isWrong && 'border-danger-400 bg-danger-50',
                  !isCorrect && !isWrong && selectedLeft !== i && 'border-cream-300',
                )}
              >
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => onPickLeft(i)}
                  className="w-full text-left text-sm text-green-900"
                >
                  <span className="mr-2 text-xs font-semibold text-green-600">{i + 1}.</span>
                  <TextLabel text={pair.left || '—'} />
                </button>

                <div
                  className={cn(
                    'mt-2 min-h-10 rounded-md border border-dashed px-2.5 py-2 text-sm',
                    matchedChip
                      ? 'border-green-300 bg-green-50/70 text-green-900'
                      : 'border-cream-300 bg-cream-50 text-muted-foreground',
                  )}
                >
                  {matchedChip ? (
                    <div className="flex items-center justify-between gap-2">
                      <TextLabel text={matchedChip.text} />
                      {!locked ? (
                        <button
                          type="button"
                          className="shrink-0 text-[11px] font-medium text-danger-500 hover:underline"
                          onClick={() => clearMatch(i)}
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <span>Drop answer here</span>
                  )}
                </div>

                {checked && isWrong ? (
                  <p className="mt-1.5 text-xs text-green-700">
                    Correct: <TextLabel text={pair.right} />
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold tracking-wide text-green-700 uppercase">
            Answers
          </p>
          {rightChips.map((chip) => {
            const used = usedRightIds.has(chip.id)
            return (
              <button
                key={chip.id}
                type="button"
                draggable={!locked && !used}
                disabled={locked || used}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', chip.id)
                  setDraggingRightId(chip.id)
                  setSelectedRightId(chip.id)
                }}
                onDragEnd={() => setDraggingRightId(null)}
                onClick={() => onPickRight(chip.id)}
                className={cn(
                  'w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                  used
                    ? 'cursor-default border-cream-200 bg-cream-100 text-green-500 opacity-60'
                    : 'cursor-grab border-cream-300 bg-white hover:bg-cream-100 active:cursor-grabbing',
                  selectedRightId === chip.id && !used && 'border-gold-500 ring-2 ring-gold-300',
                )}
              >
                <TextLabel text={chip.text} />
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!allMatched || checked}
          onClick={() => setChecked(true)}
        >
          Submit &amp; Check
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setMatches({})
            setSelectedLeft(null)
            setSelectedRightId(null)
            setChecked(false)
            setRightChips((prev) => shuffle(prev))
          }}
        >
          Try again
        </Button>
      </div>

      {checked ? (
        <p
          className={cn(
            'rounded-lg px-3 py-2 text-sm font-medium',
            score === pairs.length
              ? 'bg-green-100 text-green-800'
              : 'bg-gold-50 text-green-900',
          )}
        >
          {score}/{pairs.length} correct
          {score === pairs.length ? ' — nice work!' : ' — clear wrong ones and try again.'}
          {mode === 'preview' ? ' (preview)' : ''}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Matched {Object.keys(matches).length}/{pairs.length}
        </p>
      )}
    </div>
  )
}

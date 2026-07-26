'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { z } from 'zod'
import type { matchingCardsBlockSchema } from '@/lib/validation/content'
import { cn } from '@/lib/utils'
import { AmharicText } from '@/components/shared/amharic-text'

type Block = z.infer<typeof matchingCardsBlockSchema>

function hasAmharic(text: string) {
  return /[ሀ-፼]/.test(text)
}

export function InteractiveMatching({
  block,
  mode = 'student',
}: {
  block: Block
  mode?: 'student' | 'preview'
}) {
  const rights = useMemo(() => {
    const values = block.pairs.map((p) => p.right)
    return [...values].sort(() => Math.random() - 0.5)
  }, [block.pairs])

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null)
  const [matches, setMatches] = useState<Record<number, string>>({})
  const [checked, setChecked] = useState(false)

  function pickRight(right: string) {
    if (selectedLeft === null || checked) return
    setMatches((prev) => ({ ...prev, [selectedLeft]: right }))
    setSelectedLeft(null)
  }

  const score = block.pairs.reduce((acc, pair, i) => {
    return acc + (matches[i] === pair.right ? 1 : 0)
  }, 0)

  return (
    <div className="space-y-4 rounded-xl border border-cream-300 bg-cream-50 p-5">
      <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
        Matching
      </p>
      {block.prompt ? <p className="font-medium text-green-900">{block.prompt}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          {block.pairs.map((pair, i) => (
            <button
              key={i}
              type="button"
              disabled={checked}
              onClick={() => setSelectedLeft(i)}
              className={cn(
                'w-full rounded-lg border px-3 py-2.5 text-left text-sm',
                selectedLeft === i
                  ? 'border-gold-500 bg-gold-50'
                  : 'border-cream-300 bg-white hover:bg-cream-100',
                checked && matches[i] === pair.right && 'border-green-600 bg-green-50',
                checked && matches[i] && matches[i] !== pair.right && 'border-danger-400 bg-danger-50',
              )}
            >
              {hasAmharic(pair.left) ? <AmharicText size="sm">{pair.left}</AmharicText> : pair.left}
              {matches[i] ? (
                <span className="mt-1 block text-xs text-green-600">→ {matches[i]}</span>
              ) : null}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {rights.map((right) => {
            const used = Object.values(matches).includes(right)
            return (
              <button
                key={right}
                type="button"
                disabled={checked || used || selectedLeft === null}
                onClick={() => pickRight(right)}
                className={cn(
                  'w-full rounded-lg border px-3 py-2.5 text-left text-sm',
                  used
                    ? 'border-cream-200 bg-cream-100 text-green-500'
                    : 'border-cream-300 bg-white hover:bg-cream-100',
                )}
              >
                {hasAmharic(right) ? <AmharicText size="sm">{right}</AmharicText> : right}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={Object.keys(matches).length < block.pairs.length}
          onClick={() => setChecked(true)}
        >
          Check matches
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setMatches({})
            setSelectedLeft(null)
            setChecked(false)
          }}
        >
          Reset
        </Button>
      </div>
      {checked ? (
        <p className="text-sm text-green-800">
          {score}/{block.pairs.length} correct
          {mode === 'preview' ? ' (preview)' : ''}
        </p>
      ) : null}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { z } from 'zod'
import type { multipleChoiceBlockSchema } from '@/lib/validation/content'
import { cn } from '@/lib/utils'

type Block = z.infer<typeof multipleChoiceBlockSchema>

export function InteractiveMultipleChoice({
  block,
  mode = 'student',
}: {
  block: Block
  mode?: 'student' | 'preview'
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [attemptsUsed, setAttemptsUsed] = useState(0)

  const correct = block.options.find((o) => o.correct)
  const maxAttempts = Math.max(1, block.maxAttempts ?? 2)
  const isCorrect = checked && selected === correct?.id
  const isFinalAttempt = attemptsUsed >= maxAttempts
  const revealAnswer = isCorrect || isFinalAttempt
  const canRetry = checked && !isCorrect && attemptsUsed < maxAttempts
  const canRetake = checked && !isCorrect && isFinalAttempt && (block.allowRetake ?? false)

  return (
    <div className="space-y-3 rounded-xl border border-cream-300 bg-cream-50 p-5">
      <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
        Multiple choice
      </p>
      <p className="font-medium text-green-900">{block.prompt}</p>
      <div className="space-y-2">
        {block.options.map((opt) => {
          const isSelected = selected === opt.id
          const showCorrect = checked && revealAnswer && opt.correct
          const showWrong = checked && isSelected && !opt.correct
          return (
            <button
              key={opt.id}
              type="button"
              disabled={checked && mode === 'student'}
              onClick={() => setSelected(opt.id)}
              className={cn(
                'w-full rounded-lg border px-3 py-2.5 text-left text-sm transition',
                isSelected ? 'border-gold-500 bg-gold-50' : 'border-cream-300 bg-white hover:bg-cream-100',
                showCorrect && 'border-green-600 bg-green-50',
                showWrong && 'border-danger-400 bg-danger-50',
              )}
            >
              {opt.text}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!selected || checked}
          onClick={() => {
            setChecked(true)
            setAttemptsUsed((n) => n + 1)
          }}
        >
          Check answer ({attemptsUsed}/{maxAttempts})
        </Button>
        {canRetry ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelected(null)
              setChecked(false)
            }}
          >
            Try final attempt
          </Button>
        ) : null}
        {canRetake ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelected(null)
              setChecked(false)
              setAttemptsUsed(0)
            }}
          >
            Retake
          </Button>
        ) : null}
      </div>
      {checked ? (
        <p className="text-sm text-green-800">
          {isCorrect ? 'Correct. ' : 'Not quite. '}
          {attemptsUsed >= maxAttempts && !isCorrect
            ? 'Final attempt reached. '
            : `Attempt ${attemptsUsed} of ${maxAttempts}. `}
          {revealAnswer && block.explanation ? block.explanation : null}
        </p>
      ) : null}
      {mode === 'preview' && !checked ? (
        <p className="text-xs text-green-600">Preview: correct option is marked after Check.</p>
      ) : null}
    </div>
  )
}

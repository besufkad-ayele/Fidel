'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AmharicText } from '@/components/shared/amharic-text'
import type { z } from 'zod'
import type { meaningFillBlockSchema } from '@/lib/validation/content'
import { cn } from '@/lib/utils'

type Block = z.infer<typeof meaningFillBlockSchema>

function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function looksAmharic(text: string) {
  return /[ሀ-፼]/.test(text)
}

export function InteractiveMeaningFill({
  block,
  mode = 'student',
}: {
  block: Block
  mode?: 'student' | 'preview'
}) {
  const items = block.items ?? []
  const wordBank = block.wordBank.filter(Boolean)
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((item) => [item.id, ''])),
  )
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [attemptsUsed, setAttemptsUsed] = useState(0)
  const [draggingWord, setDraggingWord] = useState<string | null>(null)
  const maxAttempts = Math.max(1, block.maxAttempts ?? 2)
  const locked = revealed && mode === 'student'

  const usedWords = useMemo(() => {
    const used = new Set<string>()
    for (const answer of Object.values(answers)) {
      if (answer) used.add(answer)
    }
    return used
  }, [answers])

  function assignWord(itemId: string, word: string) {
    if (locked) return
    setAnswers((prev) => ({ ...prev, [itemId]: word }))
    setSelectedWord(null)
  }

  function clearAnswer(itemId: string) {
    if (locked) return
    setAnswers((prev) => ({ ...prev, [itemId]: '' }))
  }

  function submitAndCheck() {
    setRevealed(true)
    setSelectedWord(null)
    setAttemptsUsed((n) => n + 1)
  }

  function reset() {
    setAnswers(Object.fromEntries(items.map((item) => [item.id, ''])))
    setRevealed(false)
    setSelectedWord(null)
  }

  const correctCount = items.filter(
    (item) => normalizeAnswer(answers[item.id] ?? '') === normalizeAnswer(item.answer),
  ).length
  const allCorrect = revealed && correctCount === items.length
  const isFinalAttempt = attemptsUsed >= maxAttempts
  const revealAnswers = allCorrect || isFinalAttempt
  const canRetry = revealed && !allCorrect && attemptsUsed < maxAttempts
  const canRetake = revealed && !allCorrect && isFinalAttempt && (block.allowRetake ?? false)

  return (
    <div className="space-y-4 rounded-xl border border-cream-300 bg-cream-50 p-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
          English meaning
        </p>
        {block.title ? (
          <h3 className="mt-1 font-display text-lg text-green-900">{block.title}</h3>
        ) : null}
        {block.prompt ? <p className="mt-1 text-sm text-green-700">{block.prompt}</p> : null}
      </div>

      {wordBank.length > 0 ? (
        <div className="rounded-lg border border-gold-200 bg-gold-50/80 p-3">
          <p className="mb-2 text-[11px] font-semibold tracking-wide text-gold-700 uppercase">
            Words — select, then tap a blank (or drag)
          </p>
          <ul className="flex flex-wrap gap-2">
            {wordBank.map((word, i) => {
              const isSelected = selectedWord === word
              const isUsed = usedWords.has(word)
              return (
                <li
                  key={`${word}-${i}`}
                  draggable={!locked}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', word)
                    setDraggingWord(word)
                    setSelectedWord(word)
                  }}
                  onDragEnd={() => setDraggingWord(null)}
                  onClick={() => {
                    if (locked) return
                    setSelectedWord((prev) => (prev === word ? null : word))
                  }}
                  className={cn(
                    'cursor-pointer rounded-md border px-2.5 py-1.5 text-sm text-green-900 transition-colors',
                    isSelected
                      ? 'border-green-700 bg-green-100 ring-2 ring-green-600/30'
                      : 'border-gold-300 bg-white hover:border-gold-500',
                    isUsed && !isSelected && 'opacity-45',
                  )}
                >
                  {looksAmharic(word) ? <AmharicText size="sm">{word}</AmharicText> : word}
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      <ol className="space-y-4">
        {items.map((item, index) => {
          const value = answers[item.id] ?? ''
          const isCorrect =
            revealed && normalizeAnswer(value) === normalizeAnswer(item.answer)
          const isWrong = revealed && !isCorrect
          return (
            <li key={item.id} className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-sm font-semibold text-green-600">{index + 1}.</span>
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-gold-700 uppercase">
                    Meaning
                  </p>
                  <p className="text-base font-medium text-green-900">
                    {item.meaning || 'Untitled meaning'}
                  </p>
                </div>
              </div>
              <div
                role="button"
                tabIndex={0}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const dropped = e.dataTransfer.getData('text/plain') || draggingWord
                  if (dropped) assignWord(item.id, dropped)
                }}
                onClick={() => {
                  if (selectedWord) assignWord(item.id, selectedWord)
                }}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && selectedWord) {
                    e.preventDefault()
                    assignWord(item.id, selectedWord)
                  }
                }}
                className={cn(
                  'flex min-h-14 items-center justify-between gap-2 rounded-lg border-2 border-dashed bg-white px-4 py-3 text-sm text-green-900',
                  isCorrect && 'border-solid border-green-600 bg-green-50',
                  isWrong && 'border-solid border-danger-400 bg-danger-50',
                  !revealed && selectedWord && 'border-gold-500 bg-gold-50/40',
                  !revealed && !selectedWord && 'border-cream-300 hover:border-gold-400',
                )}
              >
                {value ? (
                  looksAmharic(value) ? (
                    <AmharicText size="md">{value}</AmharicText>
                  ) : (
                    <span className="text-base">{value}</span>
                  )
                ) : (
                  <span className="text-green-500">
                    {selectedWord ? 'Tap to insert selected word' : 'Blank — select a word above'}
                  </span>
                )}
                {value ? (
                  <button
                    type="button"
                    className="shrink-0 text-xs text-green-600 underline-offset-2 hover:underline"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearAnswer(item.id)
                    }}
                    disabled={locked}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              {revealed && revealAnswers && isWrong ? (
                <p className="text-xs text-green-700">
                  Answer:{' '}
                  {looksAmharic(item.answer) ? (
                    <AmharicText size="sm">{item.answer}</AmharicText>
                  ) : (
                    item.answer
                  )}
                </p>
              ) : null}
            </li>
          )
        })}
      </ol>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={submitAndCheck} disabled={revealed}>
          Check answers ({attemptsUsed}/{maxAttempts})
        </Button>
        {canRetry ? (
          <Button type="button" size="sm" variant="ghost" onClick={reset}>
            Try again
          </Button>
        ) : null}
        {canRetake ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              reset()
              setAttemptsUsed(0)
            }}
          >
            Retake
          </Button>
        ) : null}
      </div>

      {revealed ? (
        <p className="text-sm text-green-800">
          {correctCount} of {items.length} correct.
          {!allCorrect && isFinalAttempt
            ? ' Final attempt reached; answers are now shown.'
            : null}
        </p>
      ) : null}

      {mode === 'preview' && !revealed ? (
        <p className="text-xs text-green-600">
          Preview: students select words into blanks, then check.
        </p>
      ) : null}
    </div>
  )
}

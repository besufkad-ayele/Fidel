'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AmharicText } from '@/components/shared/amharic-text'
import type { z } from 'zod'
import type { fillBlankBlockSchema } from '@/lib/validation/content'
import { cn } from '@/lib/utils'

type Block = z.infer<typeof fillBlankBlockSchema>

function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function looksAmharic(text: string) {
  return /[ሀ-፼]/.test(text)
}

export function InteractiveFillBlank({
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
  const [revealed, setRevealed] = useState(false)
  const [draggingWord, setDraggingWord] = useState<string | null>(null)

  const usedWords = useMemo(() => {
    const used = new Set<string>()
    for (const answer of Object.values(answers)) {
      if (answer) used.add(answer)
    }
    return used
  }, [answers])

  function assignWord(questionId: string, word: string) {
    if (revealed && mode === 'student') return
    setAnswers((prev) => ({ ...prev, [questionId]: word }))
  }

  function clearAnswer(questionId: string) {
    if (revealed && mode === 'student') return
    setAnswers((prev) => ({ ...prev, [questionId]: '' }))
  }

  function submitAndCheck() {
    setRevealed(true)
  }

  function reset() {
    setAnswers(Object.fromEntries(items.map((item) => [item.id, ''])))
    setRevealed(false)
  }

  const correctCount = items.filter(
    (item) => normalizeAnswer(answers[item.id] ?? '') === normalizeAnswer(item.answer),
  ).length

  return (
    <div className="space-y-4 rounded-xl border border-cream-300 bg-cream-50 p-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
          Fill in the blank
        </p>
        {block.title ? (
          <h3 className="mt-1 font-display text-lg text-green-900">{block.title}</h3>
        ) : null}
        {block.prompt ? <p className="mt-1 text-sm text-green-700">{block.prompt}</p> : null}
      </div>

      {wordBank.length > 0 ? (
        <div className="rounded-lg border border-gold-200 bg-gold-50/80 p-3">
          <p className="mb-2 text-[11px] font-semibold tracking-wide text-gold-700 uppercase">
            Word list (drag to a question)
          </p>
          <ul className="flex flex-wrap gap-2">
            {wordBank.map((word, i) => (
              <li
                key={`${word}-${i}`}
                draggable={!revealed || mode === 'preview'}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', word)
                  setDraggingWord(word)
                }}
                onDragEnd={() => setDraggingWord(null)}
                onClick={() => {
                  if (revealed && mode === 'student') return
                  const firstEmpty = items.find((it) => !answers[it.id])
                  if (firstEmpty) assignWord(firstEmpty.id, word)
                }}
                className={cn(
                  'cursor-grab rounded-md border border-gold-300 bg-white px-2.5 py-1 text-sm text-green-900 active:cursor-grabbing',
                  usedWords.has(word) && 'opacity-50',
                )}
              >
                {looksAmharic(word) ? <AmharicText size="sm">{word}</AmharicText> : word}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ol className="space-y-3">
        {items.map((item, index) => {
          const value = answers[item.id] ?? ''
          const isCorrect =
            revealed && normalizeAnswer(value) === normalizeAnswer(item.answer)
          const isWrong = revealed && !isCorrect
          return (
            <li key={item.id} className="space-y-1.5">
              <p className="text-sm font-medium text-green-900">
                <span className="mr-2 text-green-600">{index + 1}.</span>
                {item.question || 'Untitled question'}
              </p>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const dropped = e.dataTransfer.getData('text/plain') || draggingWord
                  if (dropped) assignWord(item.id, dropped)
                }}
                className={cn(
                  'flex min-h-11 items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-green-900',
                  isCorrect && 'border-green-600 bg-green-50',
                  isWrong && 'border-danger-400 bg-danger-50',
                  !revealed && 'border-cream-300 hover:border-gold-400',
                )}
              >
                {value ? (
                  looksAmharic(value) ? (
                    <AmharicText size="sm">{value}</AmharicText>
                  ) : (
                    <span>{value}</span>
                  )
                ) : (
                  <span className="text-green-500">Drop answer here</span>
                )}
                {value ? (
                  <button
                    type="button"
                    className="text-xs text-green-600 underline-offset-2 hover:underline"
                    onClick={() => clearAnswer(item.id)}
                    disabled={revealed && mode === 'student'}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              {revealed && isWrong ? (
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
          Submit & Check
        </Button>
        {revealed ? (
          <Button type="button" size="sm" variant="ghost" onClick={reset}>
            Try again
          </Button>
        ) : null}
      </div>

      {revealed ? (
        <p className="text-sm text-green-800">
          Submission checked: {correctCount} of {items.length} correct.
        </p>
      ) : null}

      {mode === 'preview' && !revealed ? (
        <p className="text-xs text-green-600">Preview: answers check after the student submits.</p>
      ) : null}
    </div>
  )
}

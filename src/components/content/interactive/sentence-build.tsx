'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AmharicText } from '@/components/shared/amharic-text'
import type { z } from 'zod'
import type { sentenceBuildBlockSchema } from '@/lib/validation/content'
import { cn } from '@/lib/utils'

type Block = z.infer<typeof sentenceBuildBlockSchema>
type Item = Block['items'][number]

type Token = { id: string; text: string }

function looksAmharic(text: string) {
  return /[ሀ-፼]/.test(text)
}

function normalizeSentence(parts: string[]) {
  return parts
    .map((p) => p.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function WordChip({ text, className }: { text: string; className?: string }) {
  return looksAmharic(text) ? (
    <AmharicText size="sm" className={className}>
      {text}
    </AmharicText>
  ) : (
    <span className={className}>{text}</span>
  )
}

function buildBank(item: Item): Token[] {
  const texts = [...item.words, ...(item.distractors ?? [])].filter((w) => w.trim())
  return shuffle(
    texts.map((text, i) => ({
      id: `${item.id}-tok-${i}-${text}`,
      text,
    })),
  )
}

function SentenceItem({
  item,
  index,
  locked,
  revealed,
  revealAnswer,
  onCorrectChange,
}: {
  item: Item
  index: number
  locked: boolean
  revealed: boolean
  revealAnswer: boolean
  onCorrectChange: (itemId: string, correct: boolean) => void
}) {
  const correctWords = item.words.map((w) => w.trim()).filter(Boolean)
  const correctKey = correctWords.join('|')

  const [bank, setBank] = useState<Token[]>(() => buildBank(item))
  const [sentence, setSentence] = useState<Token[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragFrom, setDragFrom] = useState<'bank' | 'sentence' | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  useEffect(() => {
    setBank(buildBank(item))
    setSentence([])
    setDraggingId(null)
    setDragFrom(null)
    setDropIndex(null)
    // Reset when the item wording changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, correctKey, (item.distractors ?? []).join('|')])

  const isCorrect =
    normalizeSentence(sentence.map((t) => t.text)) === normalizeSentence(correctWords)

  useEffect(() => {
    onCorrectChange(item.id, isCorrect)
  }, [item.id, isCorrect, onCorrectChange])

  function findToken(id: string): Token | undefined {
    return bank.find((t) => t.id === id) ?? sentence.find((t) => t.id === id)
  }

  function removeFromBoth(id: string) {
    setBank((prev) => prev.filter((t) => t.id !== id))
    setSentence((prev) => prev.filter((t) => t.id !== id))
  }

  function appendFromBank(tokenId: string) {
    if (locked) return
    const token = bank.find((t) => t.id === tokenId)
    if (!token) return
    setBank((prev) => prev.filter((t) => t.id !== tokenId))
    setSentence((prev) => [...prev, token])
  }

  function insertAt(tokenId: string, at: number) {
    if (locked) return
    const token = findToken(tokenId)
    if (!token) return
    removeFromBoth(tokenId)
    setSentence((prev) => {
      const next = prev.filter((t) => t.id !== tokenId)
      const clamped = Math.max(0, Math.min(at, next.length))
      next.splice(clamped, 0, token)
      return next
    })
  }

  function returnToBank(tokenId: string) {
    if (locked) return
    const token = sentence.find((t) => t.id === tokenId)
    if (!token) return
    setSentence((prev) => prev.filter((t) => t.id !== tokenId))
    setBank((prev) => [...prev, token])
  }

  const showWrong = revealed && !isCorrect
  const showRight = revealed && isCorrect

  return (
    <li className="space-y-3 rounded-lg border border-cream-200 bg-white/70 p-4">
      <div>
        <p className="text-sm font-semibold text-green-900">
          <span className="mr-2 text-green-600">{index + 1}.</span>
          Build the sentence
        </p>
        {item.hint ? (
          <p className="mt-1 text-sm text-green-700">
            <span className="text-[11px] font-semibold tracking-wide text-gold-700 uppercase">
              Meaning ·{' '}
            </span>
            {item.hint}
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border border-gold-200 bg-gold-50/80 p-3">
        <p className="mb-2 text-[11px] font-semibold tracking-wide text-gold-700 uppercase">
          Word list — drag or tap to add
        </p>
        <ul className="flex min-h-10 flex-wrap gap-2">
          {bank.length === 0 ? (
            <li className="text-xs text-green-500">All words used — reorder below if needed</li>
          ) : (
            bank.map((token) => (
              <li key={token.id}>
                <button
                  type="button"
                  draggable={!locked}
                  disabled={locked}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', token.id)
                    e.dataTransfer.effectAllowed = 'move'
                    setDraggingId(token.id)
                    setDragFrom('bank')
                  }}
                  onDragEnd={() => {
                    setDraggingId(null)
                    setDragFrom(null)
                    setDropIndex(null)
                  }}
                  onClick={() => appendFromBank(token.id)}
                  className={cn(
                    'cursor-grab rounded-md border border-gold-300 bg-white px-2.5 py-1.5 text-sm text-green-900 active:cursor-grabbing',
                    draggingId === token.id && 'opacity-50',
                  )}
                >
                  <WordChip text={token.text} />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold tracking-wide text-gold-700 uppercase">
          Your sentence
        </p>
        <div
          onDragOver={(e) => {
            e.preventDefault()
            if (sentence.length === 0) setDropIndex(0)
          }}
          onDrop={(e) => {
            e.preventDefault()
            const id = e.dataTransfer.getData('text/plain') || draggingId
            if (!id) return
            insertAt(id, dropIndex ?? sentence.length)
            setDropIndex(null)
            setDraggingId(null)
            setDragFrom(null)
          }}
          className={cn(
            'flex min-h-14 flex-wrap items-center gap-2 rounded-lg border-2 border-dashed px-3 py-3',
            showRight && 'border-solid border-green-600 bg-green-50',
            showWrong && 'border-solid border-danger-400 bg-danger-50',
            !revealed && 'border-cream-300 bg-cream-50/50',
          )}
        >
          {sentence.length === 0 ? (
            <span className="text-sm text-green-500">Drop words here to build the sentence</span>
          ) : (
            sentence.map((token, i) => (
              <div key={token.id} className="flex items-center gap-1">
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDropIndex(i)
                  }}
                  className={cn(
                    'h-8 w-1 rounded-full transition-colors',
                    dropIndex === i && dragFrom ? 'bg-gold-500' : 'bg-transparent',
                  )}
                />
                <button
                  type="button"
                  draggable={!locked}
                  disabled={locked}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', token.id)
                    e.dataTransfer.effectAllowed = 'move'
                    setDraggingId(token.id)
                    setDragFrom('sentence')
                  }}
                  onDragEnd={() => {
                    setDraggingId(null)
                    setDragFrom(null)
                    setDropIndex(null)
                  }}
                  onClick={() => returnToBank(token.id)}
                  title="Click to return to word list"
                  className={cn(
                    'cursor-grab rounded-md border border-green-300 bg-white px-2.5 py-1.5 text-sm text-green-900 shadow-sm active:cursor-grabbing',
                    draggingId === token.id && 'opacity-50',
                  )}
                >
                  <WordChip text={token.text} />
                </button>
                {i === sentence.length - 1 ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setDropIndex(sentence.length)
                    }}
                    className={cn(
                      'h-8 w-1 rounded-full transition-colors',
                      dropIndex === sentence.length && dragFrom ? 'bg-gold-500' : 'bg-transparent',
                    )}
                  />
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      {revealed && revealAnswer && !isCorrect ? (
        <p className="text-xs text-green-700">
          Answer:{' '}
          {looksAmharic(correctWords.join(' ')) ? (
            <AmharicText size="sm">{correctWords.join(' ')}</AmharicText>
          ) : (
            correctWords.join(' ')
          )}
        </p>
      ) : null}
    </li>
  )
}

export function InteractiveSentenceBuild({
  block,
  mode = 'student',
}: {
  block: Block
  mode?: 'student' | 'preview'
}) {
  const items = block.items ?? []
  const [revealed, setRevealed] = useState(false)
  const [attemptsUsed, setAttemptsUsed] = useState(0)
  const [correctMap, setCorrectMap] = useState<Record<string, boolean>>({})
  const [resetKey, setResetKey] = useState(0)
  const maxAttempts = Math.max(1, block.maxAttempts ?? 2)
  const locked = revealed && mode === 'student'

  const onCorrectChange = useMemo(
    () => (itemId: string, correct: boolean) => {
      setCorrectMap((prev) => {
        if (prev[itemId] === correct) return prev
        return { ...prev, [itemId]: correct }
      })
    },
    [],
  )

  const correctCount = items.filter((item) => correctMap[item.id]).length
  const allCorrect = revealed && correctCount === items.length
  const isFinalAttempt = attemptsUsed >= maxAttempts
  const revealAnswers = allCorrect || isFinalAttempt
  const canRetry = revealed && !allCorrect && attemptsUsed < maxAttempts
  const canRetake = revealed && !allCorrect && isFinalAttempt && (block.allowRetake ?? false)

  function reset() {
    setRevealed(false)
    setCorrectMap({})
    setResetKey((k) => k + 1)
  }

  return (
    <div className="space-y-4 rounded-xl border border-cream-300 bg-cream-50 p-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
          Sentence builder
        </p>
        {block.title ? (
          <h3 className="mt-1 font-display text-lg text-green-900">{block.title}</h3>
        ) : null}
        {block.prompt ? <p className="mt-1 text-sm text-green-700">{block.prompt}</p> : null}
      </div>

      <ol className="space-y-4">
        {items.map((item, index) => (
          <SentenceItem
            key={`${item.id}-${resetKey}`}
            item={item}
            index={index}
            locked={locked}
            revealed={revealed}
            revealAnswer={revealAnswers}
            onCorrectChange={onCorrectChange}
          />
        ))}
      </ol>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setRevealed(true)
            setAttemptsUsed((n) => n + 1)
          }}
          disabled={revealed}
        >
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
          Preview: students drag words into order, then check.
        </p>
      ) : null}
    </div>
  )
}

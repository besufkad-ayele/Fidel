'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AmharicText } from '@/components/shared/amharic-text'
import { AudioPlayer } from '@/components/shared/audio-player'
import { lessonMediaPublicUrl } from '@/lib/media/urls'
import type { z } from 'zod'
import type { dialogueMcqBlockSchema } from '@/lib/validation/content'
import { cn } from '@/lib/utils'

type Block = z.infer<typeof dialogueMcqBlockSchema>

function looksAmharic(text: string) {
  return /[ሀ-፼]/.test(text)
}

function OptionLabel({ text }: { text: string }) {
  return looksAmharic(text) ? (
    <AmharicText size="sm" className="text-green-900">
      {text}
    </AmharicText>
  ) : (
    <span className="text-green-900">{text}</span>
  )
}

/**
 * Dialogue listen & choose: scene image + one conversation audio,
 * then labeled multiple-choice groups (Goethe phone-number style).
 */
export function InteractiveDialogueMcq({
  block,
  mode = 'student',
}: {
  block: Block
  mode?: 'student' | 'preview'
}) {
  const questions = block.questions ?? []
  const maxAttempts = Math.max(1, block.maxAttempts ?? 2)
  const imageSrc = lessonMediaPublicUrl(block.imageUrl) || block.imageUrl || null
  const audioSrc = lessonMediaPublicUrl(block.audioUrl) || block.audioUrl || null

  const [selected, setSelected] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(questions.map((q) => [q.id, null])),
  )
  const [checked, setChecked] = useState(false)
  const [attemptsUsed, setAttemptsUsed] = useState(0)

  useEffect(() => {
    setSelected(Object.fromEntries(questions.map((q) => [q.id, null])))
    setChecked(false)
    setAttemptsUsed(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.map((q) => q.id).join('|')])

  function submit() {
    setChecked(true)
    setAttemptsUsed((n) => n + 1)
  }

  function resetSoft() {
    setChecked(false)
  }

  function resetFull() {
    setSelected(Object.fromEntries(questions.map((q) => [q.id, null])))
    setChecked(false)
    setAttemptsUsed(0)
  }

  const answeredCount = questions.filter((q) => selected[q.id] != null).length
  const correctCount = questions.filter(
    (q) => selected[q.id] === q.correctIndex,
  ).length
  const allCorrect = checked && correctCount === questions.length
  const isFinalAttempt = attemptsUsed >= maxAttempts
  const revealAnswers = allCorrect || isFinalAttempt
  const canRetry = checked && !allCorrect && attemptsUsed < maxAttempts
  const canRetake = checked && !allCorrect && isFinalAttempt && (block.allowRetake ?? false)
  const canSubmit = answeredCount === questions.length && !checked && mode !== 'preview'

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
          Listen & choose
        </p>
        {block.title ? (
          <p className="mt-1 font-display text-2xl text-green-900">{block.title}</p>
        ) : null}
      </div>

      {(imageSrc || audioSrc) && (
        <div className="overflow-hidden rounded-xl border border-cream-300 bg-cream-50">
          {imageSrc ? (
            <figure className="border-b border-cream-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={block.imageCaption || block.title || 'Dialogue scene'}
                className="w-full object-contain"
              />
              {block.imageCaption ? (
                <figcaption className="px-3 py-1.5 text-center text-xs text-green-600">
                  {block.imageCaption}
                </figcaption>
              ) : null}
            </figure>
          ) : null}
          {audioSrc ? (
            <div className="px-3 py-3">
              <AudioPlayer
                variant="full"
                sources={{ url: audioSrc }}
                label={block.audioLabel || 'Listen to the conversation'}
                className="border-0 bg-transparent p-0"
              />
            </div>
          ) : (
            <p className="px-4 py-3 text-xs text-green-500">
              Upload conversation audio in the editor to enable listening.
            </p>
          )}
        </div>
      )}

      {block.prompt ? (
        <p className="text-sm font-medium leading-relaxed text-green-800">{block.prompt}</p>
      ) : null}

      <div className="space-y-6">
        {questions.map((q) => {
          const choice = selected[q.id]
          const isItemCorrect = checked && choice === q.correctIndex
          const isItemWrong = checked && choice != null && choice !== q.correctIndex

          return (
            <div
              key={q.id}
              className={cn(
                'space-y-2 rounded-lg border bg-white/80 p-4',
                isItemCorrect && 'border-success-500',
                isItemWrong && 'border-danger-500',
                !isItemCorrect && !isItemWrong && 'border-cream-300',
              )}
            >
              <p className="text-sm font-semibold text-green-900">
                {looksAmharic(q.label) ? (
                  <AmharicText size="sm" className="text-green-900">
                    {q.label}
                  </AmharicText>
                ) : (
                  <>{q.label}{q.label && !q.label.endsWith(':') ? ':' : ''}</>
                )}
              </p>
              <div
                className="space-y-2"
                role="radiogroup"
                aria-label={`Options for ${q.label || 'question'}`}
              >
                {q.options.map((opt, oi) => {
                  const isSelected = choice === oi
                  const showCorrect = checked && revealAnswers && oi === q.correctIndex
                  const showWrong = checked && isSelected && oi !== q.correctIndex
                  return (
                    <label
                      key={`${q.id}-${oi}`}
                      className={cn(
                        'flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm transition',
                        isSelected
                          ? 'border-gold-500 bg-gold-50'
                          : 'border-cream-300 bg-cream-50 hover:bg-cream-100',
                        showCorrect && 'border-success-500 bg-success-50',
                        showWrong && 'border-danger-500 bg-danger-50',
                        checked && mode === 'student' && 'cursor-default',
                      )}
                    >
                      <input
                        type="radio"
                        name={`dialogue-mcq-${q.id}`}
                        className="size-4 accent-green-800"
                        checked={isSelected}
                        disabled={checked && mode === 'student'}
                        onChange={() =>
                          setSelected((prev) => ({ ...prev, [q.id]: oi }))
                        }
                      />
                      <OptionLabel text={opt || `Option ${oi + 1}`} />
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!checked ? (
          <Button type="button" onClick={submit} disabled={!canSubmit}>
            Submit
          </Button>
        ) : null}
        {canRetry ? (
          <Button type="button" variant="outline" onClick={resetSoft}>
            Try again
          </Button>
        ) : null}
        {canRetake ? (
          <Button type="button" variant="outline" onClick={resetFull}>
            Retake
          </Button>
        ) : null}
        <p className="text-xs text-green-600">
          {checked
            ? `${correctCount} / ${questions.length} correct · Attempt ${attemptsUsed} / ${maxAttempts}`
            : `${answeredCount} / ${questions.length} answered`}
          {mode === 'preview' ? ' · Preview' : ''}
        </p>
      </div>
    </div>
  )
}

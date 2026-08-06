'use client'

import { useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AmharicText } from '@/components/shared/amharic-text'
import { lessonMediaPublicUrl } from '@/lib/media/urls'
import type { z } from 'zod'
import type { voiceMcqBlockSchema } from '@/lib/validation/content'
import { cn } from '@/lib/utils'

type Block = z.infer<typeof voiceMcqBlockSchema>
type Item = Block['items'][number]

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
 * Voice multiple choice: grid of listen → radio options, one submit for all.
 */
export function InteractiveVoiceMcq({
  block,
  mode = 'student',
}: {
  block: Block
  mode?: 'student' | 'preview'
}) {
  const items = block.items ?? []
  const columns = Math.min(4, Math.max(1, block.columns ?? 2))
  const maxAttempts = Math.max(1, block.maxAttempts ?? 2)

  const [selected, setSelected] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(items.map((item) => [item.id, null])),
  )
  const [checked, setChecked] = useState(false)
  const [attemptsUsed, setAttemptsUsed] = useState(0)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})

  useEffect(() => {
    setSelected(Object.fromEntries(items.map((item) => [item.id, null])))
    setChecked(false)
    setAttemptsUsed(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => i.id).join('|')])

  function playItem(item: Item) {
    const src = lessonMediaPublicUrl(item.audioUrl) || item.audioUrl || null
    if (!src) return

    setPlayingId(item.id)

    for (const [id, el] of Object.entries(audioRefs.current)) {
      if (id !== item.id && el) {
        el.pause()
        el.currentTime = 0
      }
    }

    const el = audioRefs.current[item.id]
    if (!el) return
    el.src = src
    void el.play().catch(() => setPlayingId(null))
  }

  function submit() {
    setChecked(true)
    setAttemptsUsed((n) => n + 1)
  }

  function resetSoft() {
    setChecked(false)
  }

  function resetFull() {
    setSelected(Object.fromEntries(items.map((item) => [item.id, null])))
    setChecked(false)
    setAttemptsUsed(0)
  }

  const answeredCount = items.filter((item) => selected[item.id] != null).length
  const correctCount = items.filter(
    (item) => selected[item.id] === item.correctIndex,
  ).length
  const allCorrect = checked && correctCount === items.length
  const isFinalAttempt = attemptsUsed >= maxAttempts
  const revealAnswers = allCorrect || isFinalAttempt
  const canRetry = checked && !allCorrect && attemptsUsed < maxAttempts
  const canRetake = checked && !allCorrect && isFinalAttempt && (block.allowRetake ?? false)
  const canSubmit = answeredCount === items.length && !checked && mode !== 'preview'

  const contextImages = (block.contextImages ?? []).filter((img) => img.url?.trim())

  return (
    <div className="space-y-4 rounded-xl border border-cream-300 bg-cream-50 p-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
          Voice multiple choice
        </p>
        {block.title ? (
          <p className="mt-1 font-display text-xl text-green-900">{block.title}</p>
        ) : null}
        {block.prompt ? <p className="mt-1 text-sm text-green-700">{block.prompt}</p> : null}
      </div>

      {contextImages.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {contextImages.map((img, i) => {
            const src = lessonMediaPublicUrl(img.url) || img.url
            return (
              <figure
                key={`${img.url}-${i}`}
                className="overflow-hidden rounded-lg border border-cream-300 bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={img.caption || `Context ${i + 1}`}
                  className="aspect-[4/3] w-full object-cover"
                />
                {img.caption ? (
                  <figcaption className="px-2 py-1 text-center text-[11px] text-green-600">
                    {img.caption}
                  </figcaption>
                ) : null}
              </figure>
            )
          })}
        </div>
      ) : null}

      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item, index) => {
          const choice = selected[item.id]
          const isItemCorrect = checked && choice === item.correctIndex
          const isItemWrong = checked && choice != null && choice !== item.correctIndex

          return (
            <div
              key={item.id}
              className={cn(
                'space-y-3 rounded-lg border bg-white/90 p-4',
                isItemCorrect && 'border-success-500',
                isItemWrong && 'border-danger-500',
                !isItemCorrect && !isItemWrong && 'border-cream-300',
              )}
            >
              <audio
                ref={(el) => {
                  audioRefs.current[item.id] = el
                }}
                preload="none"
                className="hidden"
                onEnded={() => setPlayingId(null)}
                onPause={() => setPlayingId((id) => (id === item.id ? null : id))}
              />

              <div className="flex items-center gap-3">
                {(() => {
                  const hasAudio = Boolean(
                    lessonMediaPublicUrl(item.audioUrl) || item.audioUrl,
                  )
                  return (
                    <button
                      type="button"
                      onClick={() => playItem(item)}
                      disabled={!hasAudio}
                      className={cn(
                        'inline-flex size-10 shrink-0 items-center justify-center rounded-md border transition',
                        !hasAudio && 'cursor-not-allowed opacity-40',
                        hasAudio &&
                          (playingId === item.id
                            ? 'border-gold-500 bg-gold-500 text-white'
                            : 'border-green-800 bg-green-800 text-cream-50 hover:bg-green-700'),
                      )}
                      aria-label={
                        hasAudio
                          ? `Play audio ${index + 1}`
                          : `No audio uploaded for question ${index + 1}`
                      }
                      title={hasAudio ? undefined : 'Upload audio in the editor to enable play'}
                    >
                      <Play className="size-4 fill-current" />
                    </button>
                  )
                })()}
                <span className="text-[11px] font-semibold tracking-wide text-green-600 uppercase">
                  Listen {index + 1}
                </span>
              </div>

              <div className="space-y-2" role="radiogroup" aria-label={`Options for audio ${index + 1}`}>
                {item.options.map((opt, oi) => {
                  const isSelected = choice === oi
                  const showCorrect = checked && revealAnswers && oi === item.correctIndex
                  const showWrong = checked && isSelected && oi !== item.correctIndex
                  return (
                    <label
                      key={`${item.id}-${oi}`}
                      className={cn(
                        'flex cursor-pointer items-center gap-2.5 rounded-md border px-2.5 py-2 text-sm transition',
                        isSelected ? 'border-gold-500 bg-gold-50' : 'border-cream-300 bg-cream-50 hover:bg-cream-100',
                        showCorrect && 'border-success-500 bg-success-50',
                        showWrong && 'border-danger-500 bg-danger-50',
                        checked && mode === 'student' && 'cursor-default',
                      )}
                    >
                      <input
                        type="radio"
                        name={`voice-mcq-${item.id}`}
                        className="size-4 accent-green-800"
                        checked={isSelected}
                        disabled={checked && mode === 'student'}
                        onChange={() =>
                          setSelected((prev) => ({ ...prev, [item.id]: oi }))
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
            ? `${correctCount} / ${items.length} correct · Attempt ${attemptsUsed} / ${maxAttempts}`
            : `${answeredCount} / ${items.length} answered`}
          {mode === 'preview' ? ' · Preview' : ''}
        </p>
      </div>
    </div>
  )
}

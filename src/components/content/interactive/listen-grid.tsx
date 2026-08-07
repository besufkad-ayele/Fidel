'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AmharicText } from '@/components/shared/amharic-text'
import { lessonMediaPublicUrl } from '@/lib/media/urls'
import type { z } from 'zod'
import type { listenGridBlockSchema } from '@/lib/validation/content'
import { cn } from '@/lib/utils'

type Block = z.infer<typeof listenGridBlockSchema>
type Item = Block['items'][number]

function looksAmharic(text: string) {
  return /[ሀ-፼]/.test(text)
}

function LabelText({ text, emphasize }: { text: string; emphasize?: boolean }) {
  if (!text) return <span className="text-green-400">—</span>
  const cls = cn(
    'leading-none',
    emphasize ? 'font-semibold text-green-900' : 'font-medium text-green-700',
  )
  return looksAmharic(text) ? (
    <AmharicText size="md" className={cls}>
      {text}
    </AmharicText>
  ) : (
    <span className={cn(cls, emphasize ? 'text-lg' : 'text-base')}>{text}</span>
  )
}

function itemAudioSrc(item: Item) {
  return lessonMediaPublicUrl(item.audioUrl) || item.audioUrl || null
}

function answerPlaceholder(format: Block['answerFormat']) {
  if (format === 'number') return 'Number…'
  if (format === 'image') return 'Describe / label…'
  return 'Write here…'
}

/**
 * Listen grid:
 * - write — play buttons + answer blanks
 * - mark_understood — hover/tap plays that cell’s uploaded audio; one button to confirm understanding
 */
export function InteractiveListenGrid({
  block,
  mode = 'student',
}: {
  block: Block
  mode?: 'student' | 'preview'
}) {
  const items = block.items ?? []
  const columns = Math.min(12, Math.max(2, block.columns ?? 8))
  const activityMode = block.activityMode ?? 'write'
  const isMarkMode = activityMode === 'mark_understood'
  /** Admin-controlled; when false, no play UI. Uploaded audio only — no TTS. */
  const listenEnabled = block.allowListen ?? true
  /** Optional for write practice — when false, listen-only (no answer blanks). */
  const writeEnabled = !isMarkMode && (block.allowWrite ?? true)

  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((item) => [item.id, ''])),
  )
  const [imageAnswers, setImageAnswers] = useState<Record<string, string>>({})
  const [completed, setCompleted] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current)
      for (const el of Object.values(audioRefs.current)) el?.pause()
    }
  }, [])

  function stopAll() {
    for (const el of Object.values(audioRefs.current)) {
      if (el) {
        el.pause()
        el.currentTime = 0
      }
    }
    setActiveId(null)
  }

  function playItem(item: Item) {
    if (!listenEnabled) return
    const src = itemAudioSrc(item)
    if (!src) return
    stopAll()
    setActiveId(item.id)
    const el = audioRefs.current[item.id]
    if (!el) return
    el.src = src
    void el.play().catch(() => setActiveId(null))
  }

  function onHoverEnter(item: Item, pointerType: string) {
    if (!isMarkMode || !listenEnabled) return
    // Touch uses tap-to-play; hover is mouse/pen only
    if (pointerType === 'touch') return
    if (!itemAudioSrc(item)) return
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    // Small delay avoids rapid play/stop when skimming across cells
    hoverTimer.current = setTimeout(() => playItem(item), 80)
  }

  function onCellActivate(item: Item) {
    if (!isMarkMode) return
    // Touch/keyboard: play on activate. Mouse hover already started playback.
    if (listenEnabled && itemAudioSrc(item) && activeId !== item.id) {
      playItem(item)
    }
  }

  function onImagePick(itemId: string, file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) {
      setImageAnswers((prev) => {
        const next = { ...prev }
        delete next[itemId]
        return next
      })
      return
    }
    const url = URL.createObjectURL(file)
    setImageAnswers((prev) => {
      if (prev[itemId]) URL.revokeObjectURL(prev[itemId]!)
      return { ...prev, [itemId]: url }
    })
  }

  const eyebrow = isMarkMode
    ? 'Listen & mark'
    : writeEnabled
      ? 'Listen & write'
      : 'Listen'

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
          {eyebrow}
        </p>
        {block.title ? (
          <p className="mt-1 font-display text-2xl text-green-800">{block.title}</p>
        ) : null}
        {block.prompt ? <p className="mt-1 text-sm text-green-700">{block.prompt}</p> : null}
        {isMarkMode ? (
          <p className="mt-1 text-xs text-green-600">
            Hover a cell to hear its audio
            {mode === 'preview' ? ' (preview)' : ''}.
          </p>
        ) : null}
      </div>

      <div
        className={cn(
          'overflow-x-auto rounded-xl border bg-cream-50',
          completed ? 'border-success-500' : 'border-cream-400',
        )}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(4.5rem, 1fr))`,
        }}
      >
        {items.map((item) => {
          const src = lessonMediaPublicUrl(item.imageUrl) || item.imageUrl || null
          const audioSrc = itemAudioSrc(item)
          const canPlay = listenEnabled && Boolean(audioSrc)
          const isActive = activeId === item.id

          return (
            <div
              key={item.id}
              className={cn(
                'flex flex-col items-center gap-2 border border-cream-300 px-2 py-3',
                writeEnabled ? 'min-h-[6.5rem]' : 'min-h-[4.5rem]',
                'transition-colors',
                isActive ? 'bg-gold-50' : completed ? 'bg-success-50/50' : 'bg-cream-50',
                isMarkMode && canPlay && 'cursor-pointer',
              )}
              onPointerEnter={(e) => onHoverEnter(item, e.pointerType)}
              onClick={() => onCellActivate(item)}
              role={isMarkMode && canPlay ? 'button' : undefined}
              tabIndex={isMarkMode && canPlay ? 0 : undefined}
              onKeyDown={(e) => {
                if (!isMarkMode) return
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onCellActivate(item)
                }
              }}
              aria-label={
                isMarkMode
                  ? `${item.label || 'Item'}${canPlay ? ', hover or tap to play' : ''}`
                  : undefined
              }
            >
              <audio
                ref={(el) => {
                  audioRefs.current[item.id] = el
                }}
                preload="none"
                className="hidden"
                onEnded={() => setActiveId(null)}
              />

              <div className="flex w-full flex-col items-center gap-1.5">
                {item.display === 'image' ? (
                  src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt={item.label || ''}
                      className="h-12 w-12 rounded-md border border-cream-300 object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-cream-400 text-[10px] text-green-500 uppercase">
                      Image
                    </span>
                  )
                ) : (
                  <LabelText text={item.label} emphasize={item.emphasize} />
                )}

                {/* Write mode: explicit play button. Mark mode: hover/tap plays — subtle cue only. */}
                {!isMarkMode && canPlay ? (
                  <button
                    type="button"
                    onClick={() => playItem(item)}
                    className={cn(
                      'inline-flex size-7 items-center justify-center rounded-md border transition',
                      isActive
                        ? 'border-gold-500 bg-gold-500 text-white'
                        : 'border-cream-300 bg-white text-green-700 hover:border-gold-500',
                    )}
                    aria-label={`Play ${item.label || 'item'}`}
                  >
                    <Volume2 className="size-3.5" />
                  </button>
                ) : null}
                {isMarkMode && canPlay ? (
                  <Volume2
                    className={cn(
                      'size-3.5',
                      isActive ? 'text-gold-600' : 'text-green-400',
                    )}
                    aria-hidden
                  />
                ) : null}
              </div>

              {writeEnabled ? (
                block.answerFormat === 'image' ? (
                  <label className="w-full space-y-1">
                    <span className="sr-only">Upload answer image for {item.label}</span>
                    {imageAnswers[item.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageAnswers[item.id]}
                        alt=""
                        className="mx-auto h-10 w-10 rounded border border-cream-300 object-cover"
                      />
                    ) : null}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={mode === 'preview'}
                      onChange={(e) => onImagePick(item.id, e.target.files?.[0])}
                      className="w-full text-[10px] text-green-700 file:mr-1 file:rounded file:border-0 file:bg-cream-200 file:px-1.5 file:py-0.5 file:text-[10px]"
                    />
                  </label>
                ) : (
                  <input
                    type="text"
                    inputMode={block.answerFormat === 'number' ? 'numeric' : 'text'}
                    value={answers[item.id] ?? ''}
                    disabled={mode === 'preview'}
                    placeholder={answerPlaceholder(block.answerFormat)}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    className={cn(
                      'w-full border-0 border-b border-cream-400 bg-transparent',
                      'px-0 py-1 text-center text-xs text-green-900',
                      'placeholder:text-green-400/70 outline-none focus:border-gold-500',
                    )}
                  />
                )
              ) : null}
            </div>
          )
        })}
      </div>

      {isMarkMode ? (
        <div className="flex flex-wrap items-center gap-3">
          {completed ? (
            <p className="inline-flex items-center gap-2 text-sm font-medium text-success-500">
              <Check className="size-4" strokeWidth={3} />
              Marked as understood
            </p>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={mode === 'preview'}
              onClick={() => setCompleted(true)}
            >
              I understand
            </Button>
          )}
          {mode === 'preview' && !completed ? (
            <span className="text-xs text-green-500">Preview — button disabled</span>
          ) : null}
        </div>
      ) : null}

      <p className="text-[10px] tracking-wide text-green-600 uppercase">
        {mode === 'preview' ? 'Preview · ' : ''}
        {isMarkMode
          ? 'Hover to listen · Confirm with one button · '
          : writeEnabled
            ? `Write ${block.answerFormat} below · `
            : 'Listen only · '}
        {items.length} items
      </p>
    </div>
  )
}

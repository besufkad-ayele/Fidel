'use client'

import { useEffect, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
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
 * Listen & write grid: model listen only when admin enabled + audio uploaded; write below.
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
  /** Admin-controlled; when false, no play UI. Uploaded audio only — no TTS. */
  const listenEnabled = block.allowListen ?? true
  /** Optional for practice — when false, listen-only (no answer blanks). */
  const writeEnabled = block.allowWrite ?? true

  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((item) => [item.id, ''])),
  )
  const [imageAnswers, setImageAnswers] = useState<Record<string, string>>({})
  const [activeId, setActiveId] = useState<string | null>(null)
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})

  useEffect(() => {
    return () => {
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

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
          {writeEnabled ? 'Listen & write' : 'Listen'}
        </p>
        {block.title ? (
          <p className="mt-1 font-display text-2xl text-green-800">{block.title}</p>
        ) : null}
        {block.prompt ? <p className="mt-1 text-sm text-green-700">{block.prompt}</p> : null}
      </div>

      <div
        className="overflow-x-auto rounded-xl border border-cream-400 bg-cream-50"
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
                isActive ? 'bg-gold-50' : 'bg-cream-50',
              )}
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
                {canPlay ? (
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

      <p className="text-[10px] tracking-wide text-green-600 uppercase">
        {mode === 'preview' ? 'Preview · ' : ''}
        {writeEnabled ? `Write ${block.answerFormat} below · ` : 'Listen only · '}
        {items.length} items
      </p>
    </div>
  )
}

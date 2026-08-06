'use client'

import { useEffect, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { AmharicText } from '@/components/shared/amharic-text'
import { RecordingAssignment } from '@/components/content/interactive/recording-assignment'
import { lessonMediaPublicUrl } from '@/lib/media/urls'
import type { z } from 'zod'
import type { readAloudBlockSchema } from '@/lib/validation/content'
import { cn } from '@/lib/utils'

type Block = z.infer<typeof readAloudBlockSchema>
type Line = Block['lines'][number]

function looksAmharic(text: string) {
  return /[ሀ-፼]/.test(text)
}

function LineText({ text }: { text: string }) {
  if (!text) return <span className="text-green-400">—</span>
  return looksAmharic(text) ? (
    <AmharicText size="md" className="text-green-900">
      {text}
    </AmharicText>
  ) : (
    <span className="text-base text-green-900">{text}</span>
  )
}

function lineAudioSrc(line: Line) {
  return lessonMediaPublicUrl(line.audioUrl) || line.audioUrl || null
}

/**
 * Read-aloud practice: show lines to read, optional model listen (admin-enabled + uploaded audio), then record.
 */
export function InteractiveReadAloud({
  block,
  mode = 'student',
  assignmentId,
  alreadySubmitted,
}: {
  block: Block
  mode?: 'student' | 'preview'
  assignmentId?: string
  alreadySubmitted?: boolean
}) {
  const lines = block.lines ?? []
  /** Admin toggle: when true and a line has uploaded audio, show play. No TTS. */
  const listenEnabled = block.allowHoverListen ?? true

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

  function playLine(line: Line) {
    if (!listenEnabled) return
    const src = lineAudioSrc(line)
    if (!src) return

    stopAll()
    setActiveId(line.id)
    const el = audioRefs.current[line.id]
    if (!el) return
    el.src = src
    void el.play().catch(() => setActiveId(null))
  }

  const recordPrompt = block.title?.trim() || 'Record yourself reading the lines above.'

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
          Read aloud
        </p>
        {block.title ? (
          <p className="mt-1 font-display text-xl text-green-900">{block.title}</p>
        ) : null}
        {block.prompt ? (
          <p className="mt-2 text-sm leading-relaxed text-green-800">{block.prompt}</p>
        ) : null}
        {block.instructions ? (
          <p className="mt-1 text-sm text-green-700">{block.instructions}</p>
        ) : null}
      </div>

      <div className="rounded-xl border-2 border-info-500/40 bg-info-50/40 px-5 py-4">
        <ul className="space-y-2.5">
          {lines.map((line) => {
            const imgSrc = lessonMediaPublicUrl(line.imageUrl) || line.imageUrl || null
            const audioSrc = lineAudioSrc(line)
            const canPlay = listenEnabled && Boolean(audioSrc)
            const isActive = activeId === line.id

            return (
              <li key={line.id}>
                <audio
                  ref={(el) => {
                    audioRefs.current[line.id] = el
                  }}
                  preload="none"
                  className="hidden"
                  onEnded={() => setActiveId(null)}
                />
                <div
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left',
                    isActive && 'bg-gold-100',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    {line.display === 'image' ? (
                      imgSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imgSrc}
                          alt={line.text || ''}
                          className="h-12 max-w-[12rem] rounded border border-cream-300 object-contain"
                        />
                      ) : (
                        <span className="text-xs text-green-500 uppercase">Image</span>
                      )
                    ) : (
                      <LineText text={line.text} />
                    )}
                  </div>
                  {canPlay ? (
                    <button
                      type="button"
                      onClick={() => playLine(line)}
                      className={cn(
                        'inline-flex size-8 shrink-0 items-center justify-center rounded-md border transition',
                        isActive
                          ? 'border-gold-500 bg-gold-500 text-white'
                          : 'border-cream-300 bg-white text-green-700 hover:border-gold-500',
                      )}
                      aria-label={`Play model for: ${line.text || 'line'}`}
                    >
                      <Volume2 className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <RecordingAssignment
        kind="audio"
        prompt={recordPrompt}
        instructions={
          mode === 'preview'
            ? 'Preview — students record themselves reading the lines above.'
            : 'Record yourself reading the lines. You may re-record before finishing.'
        }
        maxSeconds={block.maxSeconds ?? 90}
        minSeconds={block.minSeconds ?? 5}
        mode={mode}
        assignmentId={assignmentId}
        alreadySubmitted={alreadySubmitted}
      />
    </div>
  )
}

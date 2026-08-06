'use client'

import { useEffect, useMemo, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AmharicText } from '@/components/shared/amharic-text'
import { AudioPlayer } from '@/components/shared/audio-player'
import { lessonMediaPublicUrl } from '@/lib/media/urls'
import { toVideoEmbedUrl } from '@/lib/media/embed'
import type { z } from 'zod'
import type { dialogueDragBlockSchema } from '@/lib/validation/content'
import { cn } from '@/lib/utils'

type Block = z.infer<typeof dialogueDragBlockSchema>
type Turn = Block['turns'][number]

function looksAmharic(text: string) {
  return /[ሀ-፼]/.test(text)
}

function normalize(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function LineText({ text, className }: { text: string; className?: string }) {
  if (!text) return null
  return looksAmharic(text) ? (
    <AmharicText size="sm" className={className}>
      {text}
    </AmharicText>
  ) : (
    <span className={className}>{text}</span>
  )
}

/**
 * Dialogue drag-fill: video/audio + sentence bank → drop into dialogue slots.
 */
export function InteractiveDialogueDrag({
  block,
  mode = 'student',
}: {
  block: Block
  mode?: 'student' | 'preview'
}) {
  const turns = block.turns ?? []
  const slots = turns.filter((t) => t.kind === 'slot')
  const maxAttempts = Math.max(1, block.maxAttempts ?? 2)

  const videoRaw = lessonMediaPublicUrl(block.videoUrl) || block.videoUrl || ''
  const audioSrc = lessonMediaPublicUrl(block.audioUrl) || block.audioUrl || null
  const isFileVideo =
    Boolean(videoRaw) &&
    (/\.(mp4|webm|ogg)(\?|$)/i.test(videoRaw) ||
      videoRaw.includes('/storage/') ||
      videoRaw.startsWith('blob:'))
  const videoEmbed = videoRaw && !isFileVideo ? toVideoEmbedUrl(videoRaw) : null
  const videoFile = isFileVideo ? videoRaw : null

  const bankKey = (block.bank ?? []).join('|')
  const [bank, setBank] = useState<string[]>(() => shuffle((block.bank ?? []).filter(Boolean)))
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(slots.map((s) => [s.id, ''])),
  )
  const [dragging, setDragging] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [attemptsUsed, setAttemptsUsed] = useState(0)

  useEffect(() => {
    setBank(shuffle((block.bank ?? []).filter(Boolean)))
    setAnswers(Object.fromEntries(slots.map((s) => [s.id, ''])))
    setChecked(false)
    setAttemptsUsed(0)
    setDragging(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankKey, slots.map((s) => s.id).join('|')])

  const used = useMemo(() => new Set(Object.values(answers).filter(Boolean)), [answers])

  function place(slotId: string, word: string) {
    if (checked && mode === 'student') return
    setAnswers((prev) => ({ ...prev, [slotId]: word }))
    setDragging(null)
  }

  function clearSlot(slotId: string) {
    if (checked && mode === 'student') return
    setAnswers((prev) => ({ ...prev, [slotId]: '' }))
  }

  function submit() {
    setChecked(true)
    setAttemptsUsed((n) => n + 1)
  }

  function resetSoft() {
    setChecked(false)
  }

  function resetFull() {
    setBank(shuffle((block.bank ?? []).filter(Boolean)))
    setAnswers(Object.fromEntries(slots.map((s) => [s.id, ''])))
    setChecked(false)
    setAttemptsUsed(0)
  }

  const answeredCount = slots.filter((s) => answers[s.id]).length
  const correctCount = slots.filter(
    (s) => normalize(answers[s.id] ?? '') === normalize(s.answer ?? ''),
  ).length
  const allCorrect = checked && correctCount === slots.length
  const isFinalAttempt = attemptsUsed >= maxAttempts
  const revealAnswers = allCorrect || isFinalAttempt
  const canRetry = checked && !allCorrect && attemptsUsed < maxAttempts
  const canRetake = checked && !allCorrect && isFinalAttempt && (block.allowRetake ?? false)
  const canSubmit = answeredCount === slots.length && !checked && mode !== 'preview'
  const locked = checked && mode === 'student'

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
          Dialogue fill
        </p>
        {block.title ? (
          <p className="mt-1 font-display text-2xl text-green-900">{block.title}</p>
        ) : null}
      </div>

      {(videoFile || videoEmbed || audioSrc) && (
        <div className="overflow-hidden rounded-xl border border-cream-300 bg-cream-50">
          {videoFile ? (
            <video
              controls
              src={videoFile}
              className="aspect-video w-full bg-green-950"
              preload="metadata"
            >
              Your browser does not support video.
            </video>
          ) : videoEmbed ? (
            <div className="aspect-video bg-green-950">
              <iframe
                src={videoEmbed}
                title={block.title || 'Dialogue video'}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}
          {audioSrc ? (
            <div className="border-t border-cream-300 px-3 py-3">
              <AudioPlayer
                variant="full"
                sources={{ url: audioSrc }}
                label={block.audioLabel || 'Listen to the conversation'}
                className="border-0 bg-transparent p-0"
              />
            </div>
          ) : null}
        </div>
      )}

      {block.prompt ? (
        <p className="text-sm font-medium leading-relaxed text-green-800">{block.prompt}</p>
      ) : null}

      <div className="space-y-2">
        <p className="text-[11px] font-semibold tracking-wide text-green-600 uppercase">
          Sentences — drag into the dialogue
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {bank.map((chip, i) => {
            const isUsed = used.has(chip)
            return (
              <button
                key={`${chip}-${i}`}
                type="button"
                draggable={!isUsed && !locked && mode !== 'preview'}
                disabled={isUsed || locked || mode === 'preview'}
                onDragStart={(e) => {
                  if (isUsed || locked) return
                  setDragging(chip)
                  e.dataTransfer.setData('text/plain', chip)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                onDragEnd={() => setDragging(null)}
                className={cn(
                  'rounded-md border px-3 py-2.5 text-left text-sm transition',
                  isUsed
                    ? 'cursor-default border-cream-200 bg-cream-100 text-green-400'
                    : 'cursor-grab border-info-500/40 bg-info-50 text-green-900 active:cursor-grabbing hover:border-info-500',
                  dragging === chip && 'opacity-50',
                )}
              >
                <LineText text={chip} />
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-cream-300 bg-cream-50/80 p-4">
        {turns.map((turn) =>
          turn.kind === 'prompt' ? (
            <PromptLine key={turn.id} turn={turn} />
          ) : (
            <SlotLine
              key={turn.id}
              turn={turn}
              value={answers[turn.id] ?? ''}
              locked={locked}
              checked={checked}
              revealAnswers={revealAnswers}
              dragging={dragging}
              onDropWord={(word) => place(turn.id, word)}
              onClear={() => clearSlot(turn.id)}
            />
          ),
        )}
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
            ? `${correctCount} / ${slots.length} correct · Attempt ${attemptsUsed} / ${maxAttempts}`
            : `${answeredCount} / ${slots.length} filled`}
          {mode === 'preview' ? ' · Preview' : ''}
        </p>
      </div>
    </div>
  )
}

function PromptLine({ turn }: { turn: Turn }) {
  return (
    <div className="flex items-start gap-2 px-1 py-1.5">
      <MessageCircle className="mt-0.5 size-4 shrink-0 text-green-600" aria-hidden />
      <div className="min-w-0">
        {turn.speaker ? (
          <p className="text-[11px] font-semibold tracking-wide text-gold-700 uppercase">
            {turn.speaker}
          </p>
        ) : null}
        <p className="text-sm leading-relaxed text-green-900">
          <LineText text={turn.text || ''} />
        </p>
      </div>
    </div>
  )
}

function SlotLine({
  turn,
  value,
  locked,
  checked,
  revealAnswers,
  dragging,
  onDropWord,
  onClear,
}: {
  turn: Turn
  value: string
  locked: boolean
  checked: boolean
  revealAnswers: boolean
  dragging: string | null
  onDropWord: (word: string) => void
  onClear: () => void
}) {
  const isCorrect = checked && normalize(value) === normalize(turn.answer ?? '')
  const isWrong = checked && value && !isCorrect
  const showAnswer = checked && revealAnswers && !isCorrect

  return (
    <div className="space-y-1">
      <div
        onDragOver={(e) => {
          if (locked) return
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }}
        onDrop={(e) => {
          e.preventDefault()
          if (locked) return
          const word = e.dataTransfer.getData('text/plain') || dragging
          if (word) onDropWord(word)
        }}
        className={cn(
          'min-h-[2.75rem] rounded-md border-2 border-dashed px-3 py-2.5 transition',
          value
            ? 'border-solid border-info-500/50 bg-info-50'
            : 'border-cream-400 bg-cream-100/80',
          dragging && !locked && 'border-gold-500 bg-gold-50',
          isCorrect && 'border-success-500 bg-success-50',
          isWrong && 'border-danger-500 bg-danger-50',
        )}
      >
        {value ? (
          <button
            type="button"
            disabled={locked}
            onClick={onClear}
            className={cn(
              'w-full text-left text-sm text-green-900',
              !locked && 'hover:opacity-80',
            )}
            title={locked ? undefined : 'Click to return to bank'}
          >
            <LineText text={value} />
          </button>
        ) : (
          <span className="text-sm text-green-400">Drop sentence here</span>
        )}
      </div>
      {showAnswer ? (
        <p className="px-1 text-xs text-success-700">
          Answer: <LineText text={turn.answer || ''} className="text-success-800" />
        </p>
      ) : null}
    </div>
  )
}

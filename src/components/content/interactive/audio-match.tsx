'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Mic, Play, Square, Type, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AmharicText } from '@/components/shared/amharic-text'
import { lessonMediaPublicUrl } from '@/lib/media/urls'
import type { z } from 'zod'
import type { audioMatchBlockSchema } from '@/lib/validation/content'
import { cn } from '@/lib/utils'

type Block = z.infer<typeof audioMatchBlockSchema>
type Item = Block['items'][number]
type AnswerMode = 'bank' | 'text' | 'voice'

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

function ChipText({ text }: { text: string }) {
  return looksAmharic(text) ? <AmharicText size="sm">{text}</AmharicText> : <>{text}</>
}

function SlotRecorder({
  maxSeconds,
  disabled,
  onReady,
}: {
  maxSeconds: number
  disabled?: boolean
  onReady: (blob: Blob | null, url: string | null) => void
}) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [url, setUrl] = useState<string | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])

  async function start() {
    if (disabled) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        if (url) URL.revokeObjectURL(url)
        const objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
        onReady(blob, objectUrl)
        stream.getTracks().forEach((t) => t.stop())
      }
      mediaRef.current = recorder
      recorder.start()
      setRecording(true)
      setSeconds(0)
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= maxSeconds) {
            stop()
            return maxSeconds
          }
          return s + 1
        })
      }, 1000)
    } catch {
      onReady(null, null)
    }
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current)
    setRecording(false)
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop()
    }
  }

  function clear() {
    if (url) URL.revokeObjectURL(url)
    setUrl(null)
    setSeconds(0)
    onReady(null, null)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {!recording ? (
          <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={start}>
            <Mic className="mr-1 size-3" />
            Record
          </Button>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={stop}>
            <Square className="mr-1 size-3" />
            Stop ({seconds}s)
          </Button>
        )}
        {url ? (
          <Button type="button" size="sm" variant="ghost" onClick={clear}>
            Clear
          </Button>
        ) : null}
      </div>
      {url ? <audio controls src={url} className="h-8 w-full" /> : null}
    </div>
  )
}

/**
 * Listen & match: play each audio, then answer via bank chip, text, or voice.
 */
export function InteractiveAudioMatch({
  block,
  mode = 'student',
}: {
  block: Block
  mode?: 'student' | 'preview'
}) {
  const items = block.items ?? []
  const allowedModes = useMemo(() => {
    const modes: AnswerMode[] = []
    if (block.allowBank) modes.push('bank')
    if (block.allowText) modes.push('text')
    if (block.allowVoice) modes.push('voice')
    return modes.length > 0 ? modes : (['text'] as AnswerMode[])
  }, [block.allowBank, block.allowText, block.allowVoice])

  const bankKey = (block.bank ?? []).join('|')
  const [bankChips, setBankChips] = useState<string[]>([])
  const [slotMode, setSlotMode] = useState<Record<string, AnswerMode>>(() =>
    Object.fromEntries(items.map((item) => [item.id, allowedModes[0]!])),
  )
  const [bankAnswers, setBankAnswers] = useState<Record<string, string>>({})
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((item) => [item.id, ''])),
  )
  const [voiceReady, setVoiceReady] = useState<Record<string, boolean>>({})
  const [dragging, setDragging] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [attemptsUsed, setAttemptsUsed] = useState(0)
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})
  const maxAttempts = Math.max(1, block.maxAttempts ?? 2)

  useEffect(() => {
    setBankChips(shuffle((block.bank ?? []).filter(Boolean)))
    setBankAnswers({})
    setTextAnswers(Object.fromEntries(items.map((item) => [item.id, ''])))
    setVoiceReady({})
    setChecked(false)
    setAttemptsUsed(0)
    setSlotMode(Object.fromEntries(items.map((item) => [item.id, allowedModes[0]!])))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankKey, items.map((i) => i.id).join('|'), allowedModes.join('|')])

  const usedBankValues = useMemo(() => {
    return new Set(Object.values(bankAnswers).filter(Boolean))
  }, [bankAnswers])

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

  function setMode(itemId: string, modeNext: AnswerMode) {
    if (checked) return
    setSlotMode((prev) => ({ ...prev, [itemId]: modeNext }))
    // Clear other modalities for this slot when switching
    setBankAnswers((prev) => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })
    setTextAnswers((prev) => ({ ...prev, [itemId]: '' }))
    setVoiceReady((prev) => ({ ...prev, [itemId]: false }))
  }

  function placeBank(itemId: string, value: string) {
    if (checked || mode === 'preview') return
    setBankAnswers((prev) => {
      const next = { ...prev }
      // If this chip was in another slot, free it
      for (const [id, v] of Object.entries(next)) {
        if (v === value) delete next[id]
      }
      next[itemId] = value
      return next
    })
    setSlotMode((prev) => ({ ...prev, [itemId]: 'bank' }))
  }

  function clearBankSlot(itemId: string) {
    if (checked) return
    setBankAnswers((prev) => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })
  }

  function resolvedText(item: Item): string {
    const m = slotMode[item.id] ?? allowedModes[0]
    if (m === 'bank') return bankAnswers[item.id] ?? ''
    if (m === 'text') return textAnswers[item.id] ?? ''
    return ''
  }

  function submitAndCheck() {
    setChecked(true)
    setAttemptsUsed((n) => n + 1)
  }

  function reset() {
    setBankChips(shuffle((block.bank ?? []).filter(Boolean)))
    setBankAnswers({})
    setTextAnswers(Object.fromEntries(items.map((item) => [item.id, ''])))
    setVoiceReady({})
    setChecked(false)
  }

  const checkableItems = items.filter((item) => {
    const m = slotMode[item.id]
    return m === 'bank' || m === 'text'
  })
  const correctCount = checkableItems.filter(
    (item) => normalize(resolvedText(item)) === normalize(item.answer),
  ).length
  const voiceSlots = items.filter((item) => (slotMode[item.id] ?? '') === 'voice').length
  const allTextCorrect =
    checked && checkableItems.length > 0 && correctCount === checkableItems.length
  const isFinalAttempt = attemptsUsed >= maxAttempts
  const canRetry = checked && !allTextCorrect && attemptsUsed < maxAttempts
  const canRetake = checked && !allTextCorrect && isFinalAttempt && (block.allowRetake ?? false)

  return (
    <div className="space-y-4 rounded-xl border border-cream-300 bg-cream-50 p-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
          Listen & match
        </p>
        {block.title ? (
          <p className="mt-1 font-display text-xl text-green-900">{block.title}</p>
        ) : null}
        {block.prompt ? <p className="mt-1 text-sm text-green-700">{block.prompt}</p> : null}
      </div>

      {block.allowBank && bankChips.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold tracking-wide text-green-700 uppercase">
            Option bank — drag into a slot
          </p>
          <div className="flex flex-wrap gap-2">
            {bankChips.map((chip) => {
              const used = usedBankValues.has(chip)
              return (
                <button
                  key={chip}
                  type="button"
                  draggable={!used && !checked && mode !== 'preview'}
                  disabled={used || checked || mode === 'preview'}
                  onDragStart={() => setDragging(chip)}
                  onDragEnd={() => setDragging(null)}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-sm font-medium transition',
                    used
                      ? 'border-cream-300 bg-cream-200/60 text-green-400'
                      : 'border-green-300 bg-green-50 text-green-900 hover:border-gold-500 hover:bg-gold-50',
                    dragging === chip && 'opacity-60',
                  )}
                >
                  <ChipText text={chip} />
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {items.map((item, index) => {
          const currentMode = slotMode[item.id] ?? allowedModes[0]!
          const bankValue = bankAnswers[item.id]
          const textOk =
            checked &&
            (currentMode === 'bank' || currentMode === 'text') &&
            normalize(resolvedText(item)) === normalize(item.answer)
          const textBad =
            checked &&
            (currentMode === 'bank' || currentMode === 'text') &&
            Boolean(resolvedText(item)) &&
            !textOk

          return (
            <div
              key={item.id}
              className={cn(
                'space-y-2 rounded-lg border bg-white/80 p-3',
                textOk && 'border-success-500',
                textBad && 'border-danger-500',
                !textOk && !textBad && 'border-cream-300',
              )}
              onDragOver={(e) => {
                if (block.allowBank && !checked) e.preventDefault()
              }}
              onDrop={(e) => {
                e.preventDefault()
                if (!dragging || checked) return
                placeBank(item.id, dragging)
                setDragging(null)
              }}
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

              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold tracking-wide text-green-600 uppercase">
                  #{index + 1}
                </span>
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
                        'inline-flex size-9 items-center justify-center rounded-md border transition',
                        !hasAudio && 'cursor-not-allowed opacity-40',
                        hasAudio &&
                          (playingId === item.id
                            ? 'border-gold-500 bg-gold-500 text-white'
                            : 'border-green-700 bg-green-800 text-cream-50 hover:bg-green-700'),
                      )}
                      aria-label={
                        hasAudio
                          ? `Play audio ${index + 1}`
                          : `No audio uploaded for slot ${index + 1}`
                      }
                      title={hasAudio ? undefined : 'Upload audio in the editor to enable play'}
                    >
                      <Play className="size-3.5 fill-current" />
                    </button>
                  )
                })()}
              </div>

              {allowedModes.length > 1 ? (
                <div className="flex flex-wrap gap-1">
                  {allowedModes.map((m) => (
                    <button
                      key={m}
                      type="button"
                      disabled={checked || mode === 'preview'}
                      onClick={() => setMode(item.id, m)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        currentMode === m
                          ? 'bg-gold-100 text-gold-800'
                          : 'bg-cream-100 text-green-600 hover:bg-cream-200',
                      )}
                    >
                      {m === 'bank' ? <LayoutGrid className="size-2.5" /> : null}
                      {m === 'text' ? <Type className="size-2.5" /> : null}
                      {m === 'voice' ? <Mic className="size-2.5" /> : null}
                      {m}
                    </button>
                  ))}
                </div>
              ) : null}

              {currentMode === 'bank' ? (
                <button
                  type="button"
                  disabled={checked || mode === 'preview'}
                  onClick={() => clearBankSlot(item.id)}
                  className={cn(
                    'flex min-h-10 w-full items-center justify-center rounded-md border border-dashed px-2 text-sm',
                    bankValue
                      ? 'border-green-400 bg-green-50 text-green-900'
                      : 'border-cream-400 bg-cream-100 text-green-500',
                  )}
                >
                  {bankValue ? <ChipText text={bankValue} /> : 'Drop here'}
                </button>
              ) : null}

              {currentMode === 'text' ? (
                <input
                  type="text"
                  value={textAnswers[item.id] ?? ''}
                  disabled={checked || mode === 'preview'}
                  placeholder="Type your answer…"
                  onChange={(e) =>
                    setTextAnswers((prev) => ({ ...prev, [item.id]: e.target.value }))
                  }
                  className="w-full rounded-md border border-cream-300 bg-white px-2 py-2 text-sm text-green-900 outline-none focus:border-gold-500"
                />
              ) : null}

              {currentMode === 'voice' ? (
                mode === 'preview' ? (
                  <p className="text-[11px] text-green-600">Preview — voice recording simulated.</p>
                ) : (
                  <SlotRecorder
                    maxSeconds={block.maxVoiceSeconds ?? 15}
                    disabled={checked}
                    onReady={(blob) =>
                      setVoiceReady((prev) => ({ ...prev, [item.id]: Boolean(blob && blob.size > 0) }))
                    }
                  />
                )
              ) : null}

              {checked && (currentMode === 'bank' || currentMode === 'text') ? (
                <p className={cn('text-[11px]', textOk ? 'text-success-500' : 'text-danger-500')}>
                  {textOk ? 'Correct' : `Answer: ${item.answer}`}
                </p>
              ) : null}
              {checked && currentMode === 'voice' ? (
                <p className="text-[11px] text-green-600">
                  {voiceReady[item.id] ? 'Voice saved for teacher review' : 'No recording'}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!checked ? (
          <Button type="button" onClick={submitAndCheck} disabled={mode === 'preview'}>
            Submit & check
          </Button>
        ) : null}
        {canRetry ? (
          <Button type="button" variant="outline" onClick={() => setChecked(false)}>
            Try again
          </Button>
        ) : null}
        {canRetake ? (
          <Button type="button" variant="outline" onClick={reset}>
            Retake
          </Button>
        ) : null}
        {checked ? (
          <p className="text-xs text-green-700">
            {checkableItems.length > 0
              ? `${correctCount} / ${checkableItems.length} text matches correct`
              : null}
            {voiceSlots > 0
              ? `${checkableItems.length > 0 ? ' · ' : ''}${voiceSlots} voice answer${voiceSlots === 1 ? '' : 's'}`
              : null}
            {' · '}
            Attempt {attemptsUsed} / {maxAttempts}
          </p>
        ) : (
          <p className="text-xs text-green-600">
            Choose bank, text, or voice for each slot
            {mode === 'preview' ? ' · Preview' : ''}
          </p>
        )}
      </div>
    </div>
  )
}

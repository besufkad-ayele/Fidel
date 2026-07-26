'use client'

import { useMemo, useState } from 'react'
import { Ear, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AmharicText } from '@/components/shared/amharic-text'
import { AudioPlayer, type AudioSources } from '@/components/shared/audio-player'
import { cn } from '@/lib/utils'

export type ListeningItem = {
  id: string
  prompt?: string
  audio: AudioSources
  speakText?: string
  options: string[]
  correctIndex: number
  revealAmharic?: string
  revealEnglish?: string
}

export function ListeningPractice({
  title = 'Listening practice',
  items,
  mode = 'student',
}: {
  title?: string
  items: ListeningItem[]
  mode?: 'student' | 'preview'
}) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const item = items[Math.min(index, Math.max(items.length - 1, 0))]

  const shuffledOptions = useMemo(() => {
    if (!item) return [] as { text: string; originalIndex: number }[]
    return item.options.map((text, originalIndex) => ({ text, originalIndex }))
  }, [item])

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-cream-400 bg-cream-100 px-4 py-6 text-center text-sm text-green-600">
        No listening items yet. Add vocabulary audio or a listening block.
      </div>
    )
  }

  if (finished) {
    return (
      <div className="rounded-xl border border-cream-300 bg-cream-50 p-6 text-center">
        <Ear className="mx-auto size-8 text-gold-600" />
        <p className="mt-3 font-display text-xl text-green-900">Listening round complete</p>
        <p className="mt-1 text-sm text-green-700">
          {score}/{items.length} correct
          {mode === 'preview' ? ' (preview)' : ''}
        </p>
        <Button
          type="button"
          className="mt-4"
          variant="outline"
          onClick={() => {
            setIndex(0)
            setSelected(null)
            setChecked(false)
            setScore(0)
            setFinished(false)
          }}
        >
          Practice again
        </Button>
      </div>
    )
  }

  function check() {
    if (selected === null || !item) return
    setChecked(true)
    if (selected === item.correctIndex) setScore((s) => s + 1)
  }

  function next() {
    if (index >= items.length - 1) {
      setFinished(true)
      return
    }
    setIndex((i) => i + 1)
    setSelected(null)
    setChecked(false)
  }

  return (
    <div className="space-y-4 rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-gold-100 text-gold-800">
            <Ear className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
              {title}
            </p>
            <p className="text-xs tabular-nums text-green-600">
              {index + 1} / {items.length}
            </p>
          </div>
        </div>
      </div>

      <p className="font-medium text-green-900">
        {item.prompt ?? 'Listen carefully, then choose what you heard.'}
      </p>

      <div className="flex justify-center py-2">
        <AudioPlayer
          variant="full"
          label="Play recording"
          showSpeed
          sources={item.audio}
          speakText={item.speakText}
        />
      </div>

      <div className="space-y-2">
        {shuffledOptions.map((opt) => {
          const isSelected = selected === opt.originalIndex
          const isCorrect = checked && opt.originalIndex === item.correctIndex
          const isWrong = checked && isSelected && opt.originalIndex !== item.correctIndex
          return (
            <button
              key={opt.originalIndex}
              type="button"
              disabled={checked}
              onClick={() => setSelected(opt.originalIndex)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition',
                isSelected ? 'border-gold-500 bg-gold-50' : 'border-cream-300 bg-white hover:bg-cream-100',
                isCorrect && 'border-success-500 bg-success-50',
                isWrong && 'border-danger-500 bg-danger-50',
              )}
            >
              <span>{opt.text}</span>
              {isCorrect ? <CheckCircle2 className="size-4 text-success-500" /> : null}
              {isWrong ? <XCircle className="size-4 text-danger-500" /> : null}
            </button>
          )
        })}
      </div>

      {checked && (item.revealAmharic || item.revealEnglish) ? (
        <div className="rounded-lg bg-white/80 px-3 py-2 ring-1 ring-cream-300">
          {item.revealAmharic ? (
            <AmharicText size="md" className="block text-green-950">
              {item.revealAmharic}
            </AmharicText>
          ) : null}
          {item.revealEnglish ? (
            <p className="text-sm text-green-700">{item.revealEnglish}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {!checked ? (
          <Button type="button" size="sm" disabled={selected === null} onClick={check}>
            Check
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={next}>
            {index >= items.length - 1 ? 'Finish' : 'Next'}
          </Button>
        )}
      </div>
    </div>
  )
}

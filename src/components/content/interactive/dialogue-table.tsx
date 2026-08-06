'use client'

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Ear, Eye, EyeOff } from 'lucide-react'
import { AmharicText } from '@/components/shared/amharic-text'
import { AudioPlayer } from '@/components/shared/audio-player'
import { Button } from '@/components/ui/button'
import { lessonMediaPublicUrl } from '@/lib/media/urls'
import type { z } from 'zod'
import type { dialogueTableBlockSchema } from '@/lib/validation/content'
import { cn } from '@/lib/utils'

type Block = z.infer<typeof dialogueTableBlockSchema>

function looksAmharic(text: string) {
  return /[ሀ-፼]/.test(text)
}

function CellLabel({ value }: { value: string }) {
  if (!value) return <span className="text-green-400">—</span>
  return looksAmharic(value) ? (
    <AmharicText size="sm" className="break-words text-green-900">
      {value}
    </AmharicText>
  ) : (
    <span className="break-words text-green-900">{value}</span>
  )
}

function emptyGrid(rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''))
}

function normalizePrefill(block: Block): string[][] {
  const rows = block.rowLabels.length
  const cols = block.columnHeaders.length
  const source = block.cells ?? []
  return Array.from({ length: rows }, (_, ri) =>
    Array.from({ length: cols }, (_, ci) => source[ri]?.[ci] ?? ''),
  )
}

/** Textarea that grows with its content so the full answer stays visible. */
function AutoGrowField({
  value,
  onChange,
  placeholder,
  'aria-label': ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  'aria-label'?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${Math.max(el.scrollHeight, 36)}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className="w-full min-w-[7rem] resize-none overflow-hidden rounded-md border border-cream-300 bg-white px-2 py-1.5 text-sm leading-snug break-words text-green-900 outline-none focus:border-gold-500"
    />
  )
}

/**
 * Exam-style task: read / optionally listen to introductions, then fill a worksheet table.
 */
export function InteractiveDialogueTable({
  block,
  mode = 'student',
}: {
  block: Block
  mode?: 'student' | 'preview'
}) {
  const prefill = useMemo(() => normalizePrefill(block), [block])
  const [answers, setAnswers] = useState(() =>
    emptyGrid(block.rowLabels.length, block.columnHeaders.length),
  )
  const [textRevealed, setTextRevealed] = useState(block.showText !== false)

  const fullAudio = lessonMediaPublicUrl(block.audioUrl) || block.audioUrl || null
  const speakAll = block.lines.map((l) => l.amharic).filter(Boolean).join(' ')

  function updateCell(ri: number, ci: number, value: string) {
    setAnswers((prev) =>
      prev.map((row, r) => (r === ri ? row.map((cell, c) => (c === ci ? value : cell)) : row)),
    )
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="font-display text-xl text-green-900">{block.title || 'Dialogue'}</p>
        {block.prompt ? <p className="text-sm leading-relaxed text-green-700">{block.prompt}</p> : null}
        {mode === 'preview' ? (
          <p className="text-xs text-green-500">Preview · answers stay on this device only</p>
        ) : null}
      </div>

      {(fullAudio || speakAll) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-cream-300 bg-cream-50 px-4 py-3">
          <Ear className="size-4 shrink-0 text-gold-700" aria-hidden />
          <p className="text-sm font-medium text-green-900">
            {block.audioLabel || 'Listen (optional)'}
          </p>
          <AudioPlayer
            variant="inline"
            sources={{ url: fullAudio }}
            speakText={!fullAudio ? speakAll : undefined}
            label={block.audioLabel || 'Listen to the dialogue'}
          />
          {block.showText === false ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="ml-auto"
              onClick={() => setTextRevealed((v) => !v)}
            >
              {textRevealed ? (
                <>
                  <EyeOff className="mr-1 size-3.5" />
                  Hide text
                </>
              ) : (
                <>
                  <Eye className="mr-1 size-3.5" />
                  Show text
                </>
              )}
            </Button>
          ) : null}
        </div>
      )}

      {textRevealed ? (
        <div className="space-y-3 rounded-xl border border-cream-300 bg-cream-50 p-4">
          {block.lines.map((line, i) => {
            const alignment = line.alignment ?? (i % 2 === 0 ? 'left' : 'right')
            const isRight = alignment === 'right'
            const profileSrc = lessonMediaPublicUrl(line.imageUrl) || line.imageUrl || null
            const lineAudio = lessonMediaPublicUrl(line.audioUrl) || line.audioUrl || null
            const tone = i % 2 === 0 ? 'bg-green-700' : 'bg-gold-600'
            const initial = (line.speaker || '?').slice(0, 1).toUpperCase()

            const textPanel = (
              <div
                className={cn(
                  'flex min-w-0 flex-1 flex-col justify-center rounded-lg bg-white/80 p-3 ring-1 ring-cream-300',
                  isRight && 'text-right',
                )}
              >
                <div
                  className={cn(
                    'mb-1 flex items-center justify-between gap-2',
                    isRight && 'flex-row-reverse',
                  )}
                >
                  <div className={cn('flex items-center gap-2', isRight && 'flex-row-reverse')}>
                    <div
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-cream-50',
                        tone,
                      )}
                    >
                      {initial}
                    </div>
                    <p className="text-[11px] font-semibold tracking-wide text-gold-700 uppercase">
                      {line.speaker || `Speaker ${i + 1}`}
                    </p>
                  </div>
                  <AudioPlayer
                    variant="icon"
                    sources={{ url: lineAudio }}
                    speakText={line.amharic || undefined}
                    label={`Play ${line.speaker || 'line'}`}
                  />
                </div>
                {line.amharic ? (
                  <AmharicText size="lg" className="block text-green-950">
                    {line.amharic}
                  </AmharicText>
                ) : null}
                {line.transliteration ? (
                  <p className="mt-0.5 text-sm italic text-green-600">{line.transliteration}</p>
                ) : null}
                {line.english ? (
                  <p className="mt-1 text-sm text-green-800">{line.english}</p>
                ) : null}
              </div>
            )

            const imagePanel = profileSrc ? (
              <div className="relative w-full overflow-hidden rounded-lg bg-cream-200 ring-1 ring-cream-300 sm:w-[42%] sm:max-w-[14rem] sm:shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profileSrc}
                  alt={line.speaker || 'Speaker'}
                  className="aspect-[4/5] h-full w-full object-cover sm:min-h-[9rem]"
                />
              </div>
            ) : null

            return (
              <div
                key={line.id}
                className={cn(
                  'flex flex-col gap-3 sm:flex-row sm:items-stretch',
                  /* Left speech → text left, profile on the right half */
                  /* Right speech → profile left, text on the right half */
                  isRight && 'sm:flex-row-reverse',
                )}
              >
                {textPanel}
                {imagePanel}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-cream-300 bg-cream-50 px-4 py-6 text-center text-sm text-green-600">
          Listen first, then reveal the text if you need it — or go straight to the table.
        </p>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
          Complete the table
        </p>
        <div className="overflow-x-auto rounded-xl border border-cream-300">
          <table className="w-full table-auto text-left text-sm">
            <thead className="bg-cream-200 text-green-800">
              <tr>
                <th className="min-w-[6.5rem] px-3 py-2 align-bottom font-semibold" scope="col">
                  {/* corner */}
                </th>
                {block.columnHeaders.map((h, i) => (
                  <th
                    key={i}
                    className="min-w-[8rem] px-3 py-2 align-bottom font-semibold"
                    scope="col"
                  >
                    <CellLabel value={h || `Col ${i + 1}`} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rowLabels.map((label, ri) => (
                <tr
                  key={ri}
                  className={cn('border-t border-cream-300', ri % 2 === 1 && 'bg-cream-50/60')}
                >
                  <th
                    scope="row"
                    className="bg-cream-100 px-3 py-2 text-left align-top font-semibold text-green-800"
                  >
                    <CellLabel value={label || `Row ${ri + 1}`} />
                  </th>
                  {block.columnHeaders.map((_, ci) => {
                    const locked = (prefill[ri]?.[ci] ?? '').trim().length > 0
                    if (locked) {
                      return (
                        <td key={ci} className="px-3 py-2 align-top break-words text-green-900">
                          <CellLabel value={prefill[ri][ci]} />
                        </td>
                      )
                    }
                    return (
                      <td key={ci} className="px-2 py-1.5 align-top">
                        <AutoGrowField
                          value={answers[ri]?.[ci] ?? ''}
                          onChange={(value) => updateCell(ri, ci, value)}
                          placeholder="…"
                          aria-label={`${label || `Row ${ri + 1}`} — ${block.columnHeaders[ci] || `Col ${ci + 1}`}`}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

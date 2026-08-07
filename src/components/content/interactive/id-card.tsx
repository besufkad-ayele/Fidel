'use client'

import { useEffect, useRef, useState } from 'react'
import { AmharicText } from '@/components/shared/amharic-text'
import { lessonMediaPublicUrl } from '@/lib/media/urls'
import type { z } from 'zod'
import type { idCardBlockSchema } from '@/lib/validation/content'
import { cn } from '@/lib/utils'
import { useHomeworkActivity } from '@/components/content/interactive/homework-activity-shell'

type Block = z.infer<typeof idCardBlockSchema>

function looksAmharic(text: string) {
  return /[ሀ-፼]/.test(text)
}

function FieldLabel({ text }: { text: string }) {
  if (!text) return <span className="text-green-500">—</span>
  return looksAmharic(text) ? (
    <AmharicText size="sm" className="text-green-900">
      {text}
    </AmharicText>
  ) : (
    <span className="text-green-900">{text}</span>
  )
}

/**
 * ID-card worksheet: teacher-authored labels with blank space for students.
 */
export function InteractiveIdCard({
  block,
  mode = 'student',
}: {
  block: Block
  mode?: 'student' | 'preview'
}) {
  const activity = useHomeworkActivity()
  const fields = block.fields ?? []
  const photoSrc = lessonMediaPublicUrl(block.photoUrl) || block.photoUrl || null
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.id, ''])),
  )
  const [invalidIds, setInvalidIds] = useState<string[]>([])
  const answersRef = useRef(answers)
  answersRef.current = answers
  const fieldsKey = fields.map((f) => `${f.id}:${f.label}`).join('|')

  function updateAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
    setInvalidIds((prev) => prev.filter((x) => x !== id))
  }

  useEffect(() => {
    if (!activity || mode !== 'student') return
    return activity.registerIdCard({
      blockId: block.id,
      fields: fields.map((f) => ({ id: f.id, label: f.label || 'Field' })),
      getAnswers: () => answersRef.current,
      setInvalidFields: setInvalidIds,
    })
    // fieldsKey captures field id/label changes without depending on a new array each render
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fieldsKey stands in for fields
  }, [activity, block.id, fieldsKey, mode])

  return (
    <div className="space-y-3">
      {block.prompt ? (
        <p className="text-sm text-green-700">{block.prompt}</p>
      ) : (
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
          ID card
        </p>
      )}

      <div
        className={cn(
          'overflow-hidden rounded-xl border-2 border-green-700 bg-cream-50 shadow-card',
          'relative',
        )}
      >
        {/* Top band */}
        <div className="flex items-center justify-between gap-3 border-b-2 border-gold-500 bg-green-800 px-4 py-3 text-cream-50">
          <div className="min-w-0">
            <p className="font-display text-lg leading-tight tracking-wide">
              {block.title || 'Identity card'}
            </p>
            {block.subtitle ? (
              <p className="mt-0.5 text-xs text-gold-200">{block.subtitle}</p>
            ) : null}
          </div>
          <span
            aria-hidden
            className="fidel-char shrink-0 text-2xl text-gold-400 opacity-90"
          >
            ፊ
          </span>
        </div>

        <div
          className={cn(
            'grid gap-4 p-4 sm:p-5',
            block.showPhotoSlot ? 'sm:grid-cols-[1fr_7.5rem]' : '',
          )}
        >
          <div className="space-y-3">
            {fields.map((field) => {
              const lines = Math.min(4, Math.max(1, field.lines ?? 1))
              const isMulti = lines > 1
              const invalid = invalidIds.includes(field.id)
              return (
                <label key={field.id} className="block space-y-1">
                  <span
                    className={cn(
                      'text-xs font-semibold tracking-wide uppercase',
                      invalid ? 'text-danger-600' : 'text-green-700',
                    )}
                  >
                    <FieldLabel text={field.label || 'Field'} />
                  </span>
                  {isMulti ? (
                    <textarea
                      value={answers[field.id] ?? ''}
                      onChange={(e) => updateAnswer(field.id, e.target.value)}
                      rows={lines}
                      placeholder={field.hint || 'Write here…'}
                      aria-invalid={invalid}
                      className={cn(
                        'w-full resize-none rounded-md border-0 border-b-2 bg-transparent px-0 py-1.5 text-sm text-green-900',
                        'placeholder:text-green-400/70 outline-none',
                        invalid
                          ? 'border-danger-500 bg-danger-50/40 focus:border-danger-600'
                          : 'border-cream-400 focus:border-gold-500',
                      )}
                    />
                  ) : (
                    <input
                      type="text"
                      value={answers[field.id] ?? ''}
                      onChange={(e) => updateAnswer(field.id, e.target.value)}
                      placeholder={field.hint || 'Write here…'}
                      aria-invalid={invalid}
                      className={cn(
                        'w-full border-0 border-b-2 bg-transparent px-0 py-1.5 text-sm text-green-900',
                        'placeholder:text-green-400/70 outline-none',
                        invalid
                          ? 'border-danger-500 bg-danger-50/40 focus:border-danger-600'
                          : 'border-cream-400 focus:border-gold-500',
                      )}
                    />
                  )}
                  {invalid ? (
                    <p className="text-xs font-medium text-danger-600">This field is required</p>
                  ) : null}
                </label>
              )
            })}
          </div>

          {block.showPhotoSlot ? (
            <div className="flex flex-col items-center gap-1.5 sm:order-last">
              {photoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoSrc}
                  alt=""
                  className={cn(
                    'aspect-[3/4] w-full max-w-[7.5rem] object-cover',
                    'rounded-md border-2 border-cream-400 bg-cream-100',
                  )}
                />
              ) : (
                <div
                  className={cn(
                    'flex aspect-[3/4] w-full max-w-[7.5rem] items-center justify-center',
                    'rounded-md border-2 border-dashed border-cream-400 bg-cream-100',
                    'text-center text-[10px] font-medium tracking-wide text-green-500 uppercase',
                  )}
                  aria-hidden
                >
                  Photo
                </div>
              )}
              {!photoSrc ? (
                <span className="text-[10px] text-green-500">Optional</span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="border-t border-cream-300 bg-cream-100/80 px-4 py-2">
          <p className="text-[10px] tracking-wide text-green-600 uppercase">
            {mode === 'preview' ? 'Preview · ' : ''}
            Student fills the blanks · {fields.length} field
            {fields.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>
    </div>
  )
}

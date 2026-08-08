'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { TimedRecorder } from '@/components/content/interactive/timed-recorder'
import { useHomeworkActivity } from '@/components/content/interactive/homework-activity-shell'
import { submitHomeworkAction } from '@/lib/actions/homework'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

async function blobToFile(blob: Blob, name: string): Promise<File> {
  return new File([blob], name, { type: blob.type || 'application/octet-stream' })
}

export type RecordingPromptField = {
  id: 'amharic' | 'reading' | 'translation'
  label: string
}

type RecordingAssignmentProps = {
  kind: 'audio' | 'video'
  prompt: string
  instructions?: string
  maxSeconds: number
  minSeconds?: number
  required?: boolean
  mode?: 'student' | 'preview'
  /** When set (homework), student can submit the recording for review. */
  assignmentId?: string
  alreadySubmitted?: boolean
  blockId?: string
  /**
   * Optional student text blanks (Voice recording: Amharic, English reading, translation).
   */
  promptFields?: RecordingPromptField[]
}

/**
 * Voice or video self-recording for practice or homework.
 * With assignmentId: record + submit. Without: practice recording only.
 * Inside HomeworkActivityShell, submit is handled by the shared homework button.
 */
export function RecordingAssignment({
  kind,
  prompt,
  instructions,
  maxSeconds,
  minSeconds = 0,
  required,
  mode = 'student',
  assignmentId,
  alreadySubmitted = false,
  blockId = 'recording',
  promptFields = [],
}: RecordingAssignmentProps) {
  const activity = useHomeworkActivity()
  const unified = Boolean(activity?.unifiedSubmit)
  const isHomework = Boolean(assignmentId) || unified
  const [blob, setBlob] = useState<Blob | null>(null)
  const [durationSec, setDurationSec] = useState(0)
  const [submitted, setSubmitted] = useState(alreadySubmitted)
  const [note, setNote] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(promptFields.map((f) => [f.id, ''])),
  )
  const [invalidTextIds, setInvalidTextIds] = useState<string[]>([])
  const [pending, startTransition] = useTransition()
  const blobRef = useRef(blob)
  const durationRef = useRef(durationSec)
  const textAnswersRef = useRef(textAnswers)
  blobRef.current = blob
  durationRef.current = durationSec
  textAnswersRef.current = textAnswers

  const kindLabel = kind === 'audio' ? 'voice' : 'video'
  const eyebrow = isHomework
    ? kind === 'audio'
      ? 'Voice assignment'
      : 'Video assignment'
    : kind === 'audio'
      ? 'Voice practice'
      : 'Video practice'

  const textFields = useMemo(
    () => promptFields.map((f) => ({ id: f.id, label: f.label })),
    [promptFields],
  )

  useEffect(() => {
    if (!activity || mode !== 'student') return
    return activity.registerRecording({
      blockId,
      kind,
      minSeconds,
      getBlob: () => blobRef.current,
      getDurationSec: () => durationRef.current,
      setInvalid: setFieldError,
      textFields: textFields.length > 0 ? textFields : undefined,
      getTextAnswers: textFields.length > 0 ? () => textAnswersRef.current : undefined,
      setInvalidTextFields: textFields.length > 0 ? setInvalidTextIds : undefined,
    })
  }, [activity, blockId, kind, minSeconds, mode, textFields])

  function missingTextFields(): string[] {
    const missing: string[] = []
    for (const field of promptFields) {
      if (!(textAnswers[field.id] ?? '').trim()) {
        missing.push(field.label)
      }
    }
    return missing
  }

  function missingRequirements(): string[] {
    const missing: string[] = []
    for (const label of missingTextFields()) {
      missing.push(`Fill in: ${label}`)
    }
    if (!blob || blob.size === 0) {
      missing.push(`Record your ${kindLabel}`)
    } else if (minSeconds > 0 && durationSec < minSeconds) {
      missing.push(`Recording must be at least ${minSeconds}s (yours is ${durationSec}s)`)
    }
    return missing
  }

  function handleSubmit() {
    if (!assignmentId) return
    if (mode !== 'student' || pending) return

    const missing = missingRequirements()
    if (missing.length > 0) {
      const emptyIds = promptFields
        .filter((f) => !(textAnswers[f.id] ?? '').trim())
        .map((f) => f.id)
      setInvalidTextIds(emptyIds)
      const message = missing.join(' · ')
      setFieldError(missing.find((m) => m.startsWith('Record') || m.includes('Recording')) ?? missing[0] ?? message)
      setNote(message)
      toast.error('Complete the remaining items', {
        description: missing.map((m) => `• ${m}`).join('\n'),
      })
      return
    }

    const readyBlob = blob
    if (!readyBlob) return

    startTransition(async () => {
      setNote(null)
      setFieldError(null)
      setInvalidTextIds([])
      try {
        const formData = new FormData()
        formData.set('assignmentId', assignmentId)
        const fileName = kind === 'audio' ? 'voice-assignment.webm' : 'video-assignment.webm'
        formData.set(kind === 'audio' ? 'audio' : 'video', await blobToFile(readyBlob, fileName))

        if (promptFields.length > 0) {
          const text = promptFields
            .map((f) => `${f.label}: ${(textAnswers[f.id] ?? '').trim() || '—'}`)
            .join('\n')
          formData.set('text', text)
        }

        const result = await submitHomeworkAction(formData)
        if (!result.ok) {
          setNote(result.error)
          setFieldError(result.error)
          toast.error(result.error)
          return
        }
        setSubmitted(true)
        setNote('Submitted — your teacher can review it now.')
        toast.success(kind === 'audio' ? 'Voice recording submitted' : 'Video recording submitted')
      } catch {
        setNote('Could not submit. Try again.')
        toast.error('Could not submit recording')
      }
    })
  }

  return (
    <div className="space-y-3">
      {promptFields.length > 0 ? (
        <div className="space-y-3 rounded-xl border border-cream-300 bg-cream-50 px-4 py-4">
          <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
            Write the forms
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {promptFields.map((field) => {
              const invalid = invalidTextIds.includes(field.id)
              const isAmharic = field.id === 'amharic'
              return (
                <div key={field.id}>
                  <Label htmlFor={`${blockId}-${field.id}`} className="text-xs text-green-700">
                    {field.label}
                  </Label>
                  <Input
                    id={`${blockId}-${field.id}`}
                    lang={isAmharic ? 'am' : undefined}
                    className={cn(
                      'mt-1.5',
                      isAmharic && 'font-ethiopic text-lg',
                      invalid && 'border-danger-500 focus-visible:ring-danger-500',
                    )}
                    value={textAnswers[field.id] ?? ''}
                    disabled={mode === 'preview'}
                    placeholder={
                      field.id === 'amharic'
                        ? 'Amharic word…'
                        : field.id === 'reading'
                          ? 'English reading…'
                          : 'English translation…'
                    }
                    onChange={(e) => {
                      setTextAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))
                      setInvalidTextIds((ids) => ids.filter((id) => id !== field.id))
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      <TimedRecorder
        kind={kind}
        prompt={prompt}
        instructions={instructions}
        maxSeconds={maxSeconds}
        minSeconds={minSeconds}
        required={required}
        mode={mode}
        onBlobReady={(next) => {
          const ready = next.size > 0 ? next : null
          setBlob(ready)
          if (!ready) setDurationSec(0)
          setFieldError(null)
        }}
        onDurationReady={setDurationSec}
        label={eyebrow}
        invalid={Boolean(fieldError)}
        invalidMessage={fieldError}
      />

      {isHomework && mode === 'student' && !unified ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gold-300 bg-gold-50/60 px-4 py-3">
          {submitted ? (
            <p className="text-sm font-medium text-green-800">
              Recording submitted. You can wait for teacher feedback.
            </p>
          ) : (
            <>
              <Button type="button" onClick={handleSubmit} disabled={pending}>
                {pending ? 'Submitting…' : `Submit ${kindLabel}`}
              </Button>
              {blob && (!minSeconds || durationSec >= minSeconds) && missingTextFields().length === 0 ? (
                <p className="text-xs text-green-700">Ready to submit your recording.</p>
              ) : (
                <p className="text-xs text-green-600">
                  {promptFields.length > 0
                    ? 'Fill in the text fields, record yourself, then submit.'
                    : 'Record yourself, then submit.'}
                </p>
              )}
            </>
          )}
        </div>
      ) : null}

      {unified && mode === 'student' ? (
        <p className="text-xs text-green-600">
          {promptFields.length > 0
            ? 'Fill the blanks and record here, then use Submit homework at the bottom when everything is complete.'
            : 'Record here, then use Submit homework at the bottom when everything is complete.'}
        </p>
      ) : null}

      {!isHomework && mode === 'student' && blob ? (
        <p className="text-xs text-green-600">
          Practice recording ready — re-record anytime to try again.
        </p>
      ) : null}

      {mode === 'preview' ? (
        <p className="text-xs text-green-600">
          Preview — students will
          {promptFields.length > 0 ? ' fill the text fields and' : ''} record this {kindLabel}
          {isHomework ? ' and can submit it as homework' : ' during practice'}.
        </p>
      ) : null}

      {note && !fieldError ? <p className="text-xs text-green-700">{note}</p> : null}
    </div>
  )
}

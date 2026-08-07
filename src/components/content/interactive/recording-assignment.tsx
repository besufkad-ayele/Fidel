'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { TimedRecorder } from '@/components/content/interactive/timed-recorder'
import { useHomeworkActivity } from '@/components/content/interactive/homework-activity-shell'
import { submitHomeworkAction } from '@/lib/actions/homework'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

async function blobToFile(blob: Blob, name: string): Promise<File> {
  return new File([blob], name, { type: blob.type || 'application/octet-stream' })
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
}: RecordingAssignmentProps) {
  const activity = useHomeworkActivity()
  const unified = Boolean(activity?.unifiedSubmit)
  const isHomework = Boolean(assignmentId) || unified
  const [blob, setBlob] = useState<Blob | null>(null)
  const [durationSec, setDurationSec] = useState(0)
  const [submitted, setSubmitted] = useState(alreadySubmitted)
  const [note, setNote] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const blobRef = useRef(blob)
  const durationRef = useRef(durationSec)
  blobRef.current = blob
  durationRef.current = durationSec

  const kindLabel = kind === 'audio' ? 'voice' : 'video'
  const eyebrow = isHomework
    ? kind === 'audio'
      ? 'Voice assignment'
      : 'Video assignment'
    : kind === 'audio'
      ? 'Voice practice'
      : 'Video practice'

  useEffect(() => {
    if (!activity || mode !== 'student') return
    return activity.registerRecording({
      blockId,
      kind,
      minSeconds,
      getBlob: () => blobRef.current,
      getDurationSec: () => durationRef.current,
      setInvalid: setFieldError,
    })
  }, [activity, blockId, kind, minSeconds, mode])

  function missingRequirements(): string[] {
    const missing: string[] = []
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
      const message = missing.join(' · ')
      setFieldError(missing[0] ?? message)
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
      try {
        const formData = new FormData()
        formData.set('assignmentId', assignmentId)
        const fileName = kind === 'audio' ? 'voice-assignment.webm' : 'video-assignment.webm'
        formData.set(kind === 'audio' ? 'audio' : 'video', await blobToFile(readyBlob, fileName))

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
              {blob && (!minSeconds || durationSec >= minSeconds) ? (
                <p className="text-xs text-green-700">Ready to submit your recording.</p>
              ) : (
                <p className="text-xs text-green-600">Record yourself, then submit.</p>
              )}
            </>
          )}
        </div>
      ) : null}

      {unified && mode === 'student' ? (
        <p className="text-xs text-green-600">
          Record here, then use Submit homework at the bottom when everything is complete.
        </p>
      ) : null}

      {!isHomework && mode === 'student' && blob ? (
        <p className="text-xs text-green-600">
          Practice recording ready — re-record anytime to try again.
        </p>
      ) : null}

      {mode === 'preview' ? (
        <p className="text-xs text-green-600">
          Preview — students will record this {kindLabel}
          {isHomework ? ' and can submit it as homework' : ' during practice'}.
        </p>
      ) : null}

      {note && !fieldError ? <p className="text-xs text-green-700">{note}</p> : null}
    </div>
  )
}

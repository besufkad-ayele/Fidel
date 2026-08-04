'use client'

import { useState, useTransition } from 'react'
import { TimedRecorder } from '@/components/content/interactive/timed-recorder'
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
}

/**
 * Voice or video self-recording for practice or homework.
 * With assignmentId: record + submit. Without: practice recording only.
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
}: RecordingAssignmentProps) {
  const isHomework = Boolean(assignmentId)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [submitted, setSubmitted] = useState(alreadySubmitted)
  const [note, setNote] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const kindLabel = kind === 'audio' ? 'voice' : 'video'
  const eyebrow = isHomework
    ? kind === 'audio'
      ? 'Voice assignment'
      : 'Video assignment'
    : kind === 'audio'
      ? 'Voice practice'
      : 'Video practice'

  const canSubmit =
    mode === 'student' &&
    isHomework &&
    Boolean(blob) &&
    !pending &&
    !submitted

  function handleSubmit() {
    if (!assignmentId || !blob) return

    startTransition(async () => {
      setNote(null)
      try {
        const formData = new FormData()
        formData.set('assignmentId', assignmentId)
        const fileName = kind === 'audio' ? 'voice-assignment.webm' : 'video-assignment.webm'
        formData.set(kind === 'audio' ? 'audio' : 'video', await blobToFile(blob, fileName))

        const result = await submitHomeworkAction(formData)
        if (!result.ok) {
          setNote(result.error)
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
        onBlobReady={(next) => setBlob(next.size > 0 ? next : null)}
        label={eyebrow}
      />

      {isHomework && mode === 'student' ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gold-300 bg-gold-50/60 px-4 py-3">
          {submitted ? (
            <p className="text-sm font-medium text-green-800">
              Recording submitted. You can wait for teacher feedback.
            </p>
          ) : (
            <>
              <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
                {pending ? 'Submitting…' : `Submit ${kindLabel}`}
              </Button>
              {!blob ? (
                <p className="text-xs text-green-600">Record yourself, then submit.</p>
              ) : (
                <p className="text-xs text-green-700">Ready to submit your recording.</p>
              )}
            </>
          )}
        </div>
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

      {note ? <p className="text-xs text-green-700">{note}</p> : null}
    </div>
  )
}

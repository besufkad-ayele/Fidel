'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { submitHomeworkAction } from '@/lib/actions/homework'

type IdCardField = { id: string; label: string }

type IdCardHandle = {
  blockId: string
  fields: IdCardField[]
  getAnswers: () => Record<string, string>
  setInvalidFields: (ids: string[]) => void
}

type RecordingHandle = {
  blockId: string
  kind: 'audio' | 'video'
  minSeconds: number
  getBlob: () => Blob | null
  getDurationSec: () => number
  setInvalid: (message: string | null) => void
}

type HomeworkActivityContextValue = {
  assignmentId: string
  alreadySubmitted: boolean
  /** When true, child speaking/video blocks hide their own submit button. */
  unifiedSubmit: true
  registerIdCard: (handle: IdCardHandle) => () => void
  registerRecording: (handle: RecordingHandle) => () => void
}

const HomeworkActivityContext = createContext<HomeworkActivityContextValue | null>(null)

export function useHomeworkActivity() {
  return useContext(HomeworkActivityContext)
}

async function blobToFile(blob: Blob, name: string): Promise<File> {
  return new File([blob], name, { type: blob.type || 'application/octet-stream' })
}

function formatIdCardText(handles: IdCardHandle[]) {
  const sections: string[] = []
  for (const handle of handles) {
    const answers = handle.getAnswers()
    const lines = handle.fields.map((f) => {
      const value = (answers[f.id] ?? '').trim()
      return `${f.label || 'Field'}: ${value || '—'}`
    })
    sections.push(lines.join('\n'))
  }
  return sections.join('\n\n')
}

export function HomeworkActivityShell({
  assignmentId,
  alreadySubmitted = false,
  children,
}: {
  assignmentId: string
  alreadySubmitted?: boolean
  children: ReactNode
}) {
  const idCardsRef = useRef(new Map<string, IdCardHandle>())
  const recordingsRef = useRef(new Map<string, RecordingHandle>())
  const [registryVersion, setRegistryVersion] = useState(0)
  const [submitted, setSubmitted] = useState(alreadySubmitted)
  const [pending, startTransition] = useTransition()

  const bump = useCallback(() => setRegistryVersion((v) => v + 1), [])

  const registerIdCard = useCallback(
    (handle: IdCardHandle) => {
      idCardsRef.current.set(handle.blockId, handle)
      bump()
      return () => {
        idCardsRef.current.delete(handle.blockId)
        bump()
      }
    },
    [bump],
  )

  const registerRecording = useCallback(
    (handle: RecordingHandle) => {
      recordingsRef.current.set(handle.blockId, handle)
      bump()
      return () => {
        recordingsRef.current.delete(handle.blockId)
        bump()
      }
    },
    [bump],
  )

  const ctx = useMemo(
    () => ({
      assignmentId,
      alreadySubmitted: submitted,
      unifiedSubmit: true as const,
      registerIdCard,
      registerRecording,
    }),
    [assignmentId, submitted, registerIdCard, registerRecording],
  )

  const showSubmitBar =
    idCardsRef.current.size > 0 || recordingsRef.current.size > 0 || registryVersion >= 0

  function collectMissing() {
    const missing: string[] = []
    const idCards = [...idCardsRef.current.values()]
    const recordings = [...recordingsRef.current.values()]

    for (const card of idCards) {
      const answers = card.getAnswers()
      const empty = card.fields.filter((f) => !(answers[f.id] ?? '').trim())
      card.setInvalidFields(empty.map((f) => f.id))
      for (const field of empty) {
        missing.push(`Fill in: ${field.label || 'field'}`)
      }
    }

    for (const rec of recordings) {
      const blob = rec.getBlob()
      const duration = rec.getDurationSec()
      if (!blob || blob.size === 0) {
        const label = rec.kind === 'audio' ? 'voice recording' : 'video recording'
        rec.setInvalid(`Record your ${label}`)
        missing.push(`Record your ${label}`)
      } else if (rec.minSeconds > 0 && duration < rec.minSeconds) {
        const msg = `Recording must be at least ${rec.minSeconds}s (yours is ${duration}s)`
        rec.setInvalid(msg)
        missing.push(msg)
      } else {
        rec.setInvalid(null)
      }
    }

    return { missing, idCards, recordings }
  }

  function handleSubmit() {
    if (pending) return
    const { missing, idCards, recordings } = collectMissing()
    if (missing.length > 0) {
      toast.error('Complete the remaining items', {
        description: missing.slice(0, 8).map((m) => `• ${m}`).join('\n'),
      })
      return
    }

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('assignmentId', assignmentId)

        if (idCards.length > 0) {
          formData.set('text', formatIdCardText(idCards))
        }

        const audioRec = recordings.find((r) => r.kind === 'audio' && r.getBlob()?.size)
        const videoRec = recordings.find((r) => r.kind === 'video' && r.getBlob()?.size)
        if (audioRec?.getBlob()) {
          formData.set('audio', await blobToFile(audioRec.getBlob()!, 'voice-assignment.webm'))
        }
        if (videoRec?.getBlob()) {
          formData.set('video', await blobToFile(videoRec.getBlob()!, 'video-assignment.webm'))
        }

        const result = await submitHomeworkAction(formData)
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        setSubmitted(true)
        toast.success('Homework submitted')
      } catch {
        toast.error('Could not submit homework')
      }
    })
  }

  const hasParts = idCardsRef.current.size > 0 || recordingsRef.current.size > 0

  return (
    <HomeworkActivityContext.Provider value={ctx}>
      <div className="space-y-6">
        {children}
        {showSubmitBar && hasParts ? (
          <div className="rounded-xl border border-gold-300 bg-gold-50/70 px-4 py-4">
            {submitted ? (
              <p className="mb-3 text-sm font-medium text-green-800">
                Submitted — your teacher can review it now. You can update and submit again.
              </p>
            ) : (
              <p className="mb-3 text-sm text-green-800">
                Fill every blank and finish your recording, then submit.
              </p>
            )}
            <Button type="button" onClick={handleSubmit} disabled={pending}>
              {pending ? 'Submitting…' : submitted ? 'Submit again' : 'Submit homework'}
            </Button>
          </div>
        ) : null}
      </div>
    </HomeworkActivityContext.Provider>
  )
}

'use client'

import { useMemo, useState, useTransition } from 'react'
import { TimedRecorder } from '@/components/content/interactive/timed-recorder'
import type { z } from 'zod'
import type { homeworkPromptBlockSchema } from '@/lib/validation/content'
import { submitHomeworkAction } from '@/lib/actions/homework'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { lessonMediaPublicUrl } from '@/lib/media/urls'
import { ExternalLink, FileText, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Block = z.infer<typeof homeworkPromptBlockSchema>

type FieldKey = 'text' | 'drive' | 'image' | 'pdf' | 'audio' | 'video'

const DEFAULT_MAX_IMAGE = 1_048_576

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

async function blobToFile(blob: Blob, name: string): Promise<File> {
  return new File([blob], name, { type: blob.type || 'application/octet-stream' })
}

export function HomeworkSubmission({
  block,
  mode = 'student',
  assignmentId,
  alreadySubmitted = false,
}: {
  block: Block
  mode?: 'student' | 'preview'
  assignmentId?: string
  alreadySubmitted?: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [text, setText] = useState('')
  const [driveLink, setDriveLink] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [pdfFiles, setPdfFiles] = useState<File[]>([])
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [submitNote, setSubmitNote] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(alreadySubmitted)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({})

  const maxImageBytes = block.maxImageBytes ?? DEFAULT_MAX_IMAGE
  const assignmentHref = useMemo(() => {
    if (block.assignmentLink?.trim()) return block.assignmentLink.trim()
    return null
  }, [block.assignmentLink])
  const assignmentFileHref = useMemo(
    () => lessonMediaPublicUrl(block.assignmentFileUrl) ?? (block.assignmentFileUrl || null),
    [block.assignmentFileUrl],
  )

  function onImagePick(file: File | undefined) {
    setImageError(null)
    setSubmitNote(null)
    setFieldErrors((prev) => ({ ...prev, image: undefined }))
    if (!file) {
      setImageFile(null)
      if (imagePreview) URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
      return
    }
    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file (jpeg, png, webp, or gif).')
      return
    }
    if (file.size > maxImageBytes) {
      setImageError(`Image must be ${formatBytes(maxImageBytes)} or smaller (yours is ${formatBytes(file.size)}).`)
      return
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function enabledAnswerPaths(): { key: FieldKey; label: string; filled: boolean }[] {
    const paths: { key: FieldKey; label: string; filled: boolean }[] = []
    if (block.allowText) {
      paths.push({ key: 'text', label: 'Written response', filled: text.trim().length > 0 })
    }
    if (block.allowDriveLink) {
      paths.push({ key: 'drive', label: 'Google Drive link', filled: driveLink.trim().length > 0 })
    }
    if (block.allowImage) {
      paths.push({ key: 'image', label: 'Photo of your work', filled: Boolean(imageFile) })
    }
    if (block.allowFiles) {
      paths.push({ key: 'pdf', label: 'PDF upload', filled: pdfFiles.length > 0 })
    }
    if (block.allowAudio) {
      paths.push({
        key: 'audio',
        label: 'Audio recording or upload',
        filled: Boolean(audioBlob) || Boolean(audioFile),
      })
    }
    if (block.allowVideo) {
      paths.push({
        key: 'video',
        label: 'Video recording or upload',
        filled: Boolean(videoBlob) || Boolean(videoFile),
      })
    }
    return paths
  }

  function hasAnyAnswer() {
    return enabledAnswerPaths().some((p) => p.filled)
  }

  function handleSubmit() {
    if (!assignmentId) {
      setSubmitNote('This homework form is missing an assignment id.')
      toast.error('This homework form is missing an assignment id.')
      return
    }
    if (mode === 'preview' || pending) return

    const paths = enabledAnswerPaths()
    if (paths.length === 0) {
      const msg = 'No answer options are enabled for this homework.'
      setSubmitNote(msg)
      toast.error(msg)
      return
    }

    if (!hasAnyAnswer()) {
      const missing = paths.filter((p) => !p.filled)
      const errors: Partial<Record<FieldKey, string>> = {}
      for (const item of missing) {
        errors[item.key] = `${item.label} is still empty`
      }
      setFieldErrors(errors)
      setSubmitNote('Add at least one answer before submitting.')
      toast.error('Complete the remaining items', {
        description: missing.map((m) => `• ${m.label}`).join('\n'),
      })
      return
    }

    startTransition(async () => {
      setSubmitNote(null)
      setFieldErrors({})
      try {
        const formData = new FormData()
        formData.set('assignmentId', assignmentId)
        if (block.allowText && text.trim()) formData.set('text', text.trim())
        if (block.allowDriveLink && driveLink.trim()) formData.set('driveLink', driveLink.trim())
        if (block.allowImage && imageFile) formData.set('image', imageFile)
        if (block.allowFiles) {
          for (const pdf of pdfFiles) formData.append('pdf', pdf)
        }
        if (block.allowAudio) {
          if (audioFile) formData.set('audio', audioFile)
          else if (audioBlob) {
            formData.set('audio', await blobToFile(audioBlob, 'homework-audio.webm'))
          }
        }
        if (block.allowVideo) {
          if (videoFile) formData.set('video', videoFile)
          else if (videoBlob) {
            formData.set('video', await blobToFile(videoBlob, 'homework-video.webm'))
          }
        }

        const result = await submitHomeworkAction(formData)
        if (!result.ok) {
          setSubmitNote(result.error)
          toast.error(result.error)
          return
        }
        setSubmitted(true)
        setSubmitNote('Submitted — your teacher can review it now.')
        toast.success('Homework submitted')
      } catch {
        setSubmitNote('Could not submit. Try again.')
        toast.error('Could not submit homework')
      }
    })
  }

  const fieldShell = (key: FieldKey, className?: string) =>
    cn(
      'space-y-1.5 rounded-md transition-colors',
      fieldErrors[key] && 'border border-danger-500 bg-danger-50/50 p-2 ring-1 ring-danger-500/20',
      className,
    )

  return (
    <div className="space-y-4 rounded-xl border border-gold-300 bg-gold-50 p-5">
      <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">Homework</p>
      <h3 className="font-display text-xl text-green-900">{block.title}</h3>
      <p className="text-sm leading-relaxed text-green-800">{block.instructions}</p>

      <div className="flex flex-wrap gap-2 text-[11px] font-medium text-green-700">
        {block.allowText ? <span className="rounded-full bg-white/70 px-2 py-1">Text</span> : null}
        {block.allowAudio ? (
          <span className="rounded-full bg-white/70 px-2 py-1">
            Audio{block.maxAudioSeconds ? ` ≤ ${block.maxAudioSeconds}s` : ''} · record/upload
          </span>
        ) : null}
        {block.allowVideo ? (
          <span className="rounded-full bg-white/70 px-2 py-1">
            Video{block.maxVideoSeconds ? ` ≤ ${block.maxVideoSeconds}s` : ''} · record/upload
          </span>
        ) : null}
        {block.allowDriveLink ? (
          <span className="rounded-full bg-white/70 px-2 py-1">Drive link</span>
        ) : null}
        {block.allowImage ? (
          <span className="rounded-full bg-white/70 px-2 py-1">
            Image ≤ {formatBytes(maxImageBytes)}
          </span>
        ) : null}
        {block.allowFiles ? <span className="rounded-full bg-white/70 px-2 py-1">PDF</span> : null}
      </div>

      {(assignmentHref || assignmentFileHref) && (
        <div className="space-y-2 rounded-lg border border-cream-300 bg-white/80 p-3">
          <p className="text-xs font-semibold tracking-wide text-green-700 uppercase">
            Your assignment
          </p>
          {assignmentHref ? (
            <a
              href={assignmentHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-green-800 underline-offset-2 hover:underline"
            >
              <ExternalLink className="size-3.5" />
              Open assignment link
            </a>
          ) : null}
          {assignmentFileHref ? (
            <a
              href={assignmentFileHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium text-green-800 underline-offset-2 hover:underline"
            >
              <FileText className="size-3.5" />
              {block.assignmentFileName || 'Download assignment file'}
            </a>
          ) : null}
        </div>
      )}

      {submitted ? (
        <div className="rounded-lg border border-success-500/30 bg-success-50 px-3 py-3 text-sm text-success-600">
          {submitNote ?? 'You have submitted this homework. You can submit again below if you need to update it.'}
        </div>
      ) : null}

      {(block.allowText || block.allowDriveLink || block.allowImage || block.allowFiles) && (
        <div
          className={cn(
            'space-y-3 rounded-lg border bg-white/70 p-3',
            fieldErrors.text || fieldErrors.drive || fieldErrors.image || fieldErrors.pdf
              ? 'border-danger-500 ring-1 ring-danger-500/20'
              : 'border-cream-300',
          )}
        >
          <p className="text-xs font-semibold tracking-wide text-gold-700 uppercase">
            Writing answer
          </p>
          <p className="text-xs text-green-700">
            Submit a Drive link and/or a photo of your work (max {formatBytes(maxImageBytes)}).
          </p>

          {block.allowText ? (
            <div className={fieldShell('text')}>
              <label className="text-sm font-medium text-green-900">Written response</label>
              <Textarea
                value={text}
                disabled={mode === 'preview' || pending}
                placeholder="Type your answer…"
                aria-invalid={Boolean(fieldErrors.text)}
                onChange={(e) => {
                  setText(e.target.value)
                  setFieldErrors((prev) => ({ ...prev, text: undefined }))
                }}
              />
              {fieldErrors.text ? (
                <p className="text-xs font-medium text-danger-600">{fieldErrors.text}</p>
              ) : null}
            </div>
          ) : null}

          {block.allowDriveLink ? (
            <div className={fieldShell('drive')}>
              <label className="text-sm font-medium text-green-900">Google Drive link</label>
              <Input
                type="url"
                placeholder="https://drive.google.com/..."
                value={driveLink}
                disabled={mode === 'preview' || pending}
                aria-invalid={Boolean(fieldErrors.drive)}
                onChange={(e) => {
                  setDriveLink(e.target.value)
                  setFieldErrors((prev) => ({ ...prev, drive: undefined }))
                }}
              />
              {fieldErrors.drive ? (
                <p className="text-xs font-medium text-danger-600">{fieldErrors.drive}</p>
              ) : null}
            </div>
          ) : null}

          {block.allowImage ? (
            <div className={fieldShell('image')}>
              <label className="inline-flex items-center gap-1.5 text-sm font-medium text-green-900">
                <ImageIcon className="size-3.5" />
                Photo of your work (max {formatBytes(maxImageBytes)})
              </label>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={mode === 'preview' || pending}
                aria-invalid={Boolean(fieldErrors.image)}
                onChange={(e) => onImagePick(e.target.files?.[0])}
              />
              {imageError ? <p className="text-xs text-danger-500">{imageError}</p> : null}
              {fieldErrors.image ? (
                <p className="text-xs font-medium text-danger-600">{fieldErrors.image}</p>
              ) : null}
              {imageFile ? (
                <p className="text-xs text-green-700">
                  {imageFile.name} · {formatBytes(imageFile.size)}
                </p>
              ) : null}
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="Writing answer preview"
                  className="max-h-48 rounded-md border border-cream-300 object-contain"
                />
              ) : null}
            </div>
          ) : null}

          {block.allowFiles ? (
            <div className={fieldShell('pdf')}>
              <label className="text-sm font-medium text-green-900">PDF upload</label>
              <Input
                type="file"
                accept=".pdf,application/pdf"
                multiple
                disabled={mode === 'preview' || pending}
                aria-invalid={Boolean(fieldErrors.pdf)}
                onChange={(e) => {
                  setPdfFiles(Array.from(e.target.files ?? []))
                  setFieldErrors((prev) => ({ ...prev, pdf: undefined }))
                }}
              />
              {fieldErrors.pdf ? (
                <p className="text-xs font-medium text-danger-600">{fieldErrors.pdf}</p>
              ) : null}
              {pdfFiles.length > 0 ? (
                <ul className="space-y-1 text-xs text-green-700">
                  {pdfFiles.map((file) => (
                    <li key={`${file.name}-${file.size}`}>
                      • {file.name} · {formatBytes(file.size)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {block.allowAudio ? (
        <div
          className={cn(
            'space-y-3 rounded-lg border bg-white/70 p-3',
            fieldErrors.audio ? 'border-danger-500 ring-1 ring-danger-500/20' : 'border-cream-300',
          )}
        >
          <p className="text-xs font-semibold tracking-wide text-gold-700 uppercase">Audio</p>
          <TimedRecorder
            kind="audio"
            prompt="Record your homework response"
            maxSeconds={block.maxAudioSeconds ?? 60}
            mode={mode}
            invalid={Boolean(fieldErrors.audio)}
            invalidMessage={fieldErrors.audio}
            onBlobReady={(blob) => {
              setAudioBlob(blob.size > 0 ? blob : null)
              setFieldErrors((prev) => ({ ...prev, audio: undefined }))
            }}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-green-900">Or upload an audio file</label>
            <Input
              type="file"
              accept="audio/*"
              disabled={mode === 'preview' || pending}
              aria-invalid={Boolean(fieldErrors.audio)}
              onChange={(e) => {
                setAudioFile(e.target.files?.[0] ?? null)
                setFieldErrors((prev) => ({ ...prev, audio: undefined }))
              }}
            />
            {audioFile ? (
              <p className="text-xs text-green-700">
                {audioFile.name} · {formatBytes(audioFile.size)}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {block.allowVideo ? (
        <div
          className={cn(
            'space-y-3 rounded-lg border bg-white/70 p-3',
            fieldErrors.video ? 'border-danger-500 ring-1 ring-danger-500/20' : 'border-cream-300',
          )}
        >
          <p className="text-xs font-semibold tracking-wide text-gold-700 uppercase">Video</p>
          <TimedRecorder
            kind="video"
            prompt="Record your video practice"
            maxSeconds={block.maxVideoSeconds ?? 90}
            mode={mode}
            invalid={Boolean(fieldErrors.video)}
            invalidMessage={fieldErrors.video}
            onBlobReady={(blob) => {
              setVideoBlob(blob.size > 0 ? blob : null)
              setFieldErrors((prev) => ({ ...prev, video: undefined }))
            }}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-green-900">Or upload a video file</label>
            <Input
              type="file"
              accept="video/*"
              disabled={mode === 'preview' || pending}
              aria-invalid={Boolean(fieldErrors.video)}
              onChange={(e) => {
                setVideoFile(e.target.files?.[0] ?? null)
                setFieldErrors((prev) => ({ ...prev, video: undefined }))
              }}
            />
            {videoFile ? (
              <p className="text-xs text-green-700">
                {videoFile.name} · {formatBytes(videoFile.size)}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="pt-1">
        {mode === 'preview' ? (
          <p className="text-xs text-muted-foreground">Preview mode — submit is disabled.</p>
        ) : !assignmentId ? (
          <p className="text-xs text-muted-foreground">
            Open this assignment from Homework to submit your answers.
          </p>
        ) : (
          <Button type="button" size="sm" disabled={pending} onClick={handleSubmit} aria-busy={pending}>
            {pending ? 'Submitting…' : submitted ? 'Submit again' : 'Submit homework'}
          </Button>
        )}
        {submitNote && !submitted ? (
          <p className="mt-2 text-xs text-danger-500">{submitNote}</p>
        ) : null}
      </div>
    </div>
  )
}

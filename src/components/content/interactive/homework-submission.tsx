'use client'

import { useMemo, useState } from 'react'
import { TimedRecorder } from '@/components/content/interactive/timed-recorder'
import type { z } from 'zod'
import type { homeworkPromptBlockSchema } from '@/lib/validation/content'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { lessonMediaPublicUrl } from '@/lib/media/urls'
import { ExternalLink, FileText, ImageIcon } from 'lucide-react'

type Block = z.infer<typeof homeworkPromptBlockSchema>

const DEFAULT_MAX_IMAGE = 1_048_576

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function HomeworkSubmission({
  block,
  mode = 'student',
}: {
  block: Block
  mode?: 'student' | 'preview'
}) {
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

  function canSubmit() {
    if (mode === 'preview') return false
    const hasWriting =
      (block.allowText && text.trim().length > 0) ||
      (block.allowDriveLink && driveLink.trim().length > 0) ||
      (block.allowImage && Boolean(imageFile)) ||
      (block.allowFiles && pdfFiles.length > 0)
    const hasAudio = block.allowAudio && (Boolean(audioBlob) || Boolean(audioFile))
    const hasVideo = block.allowVideo && (Boolean(videoBlob) || Boolean(videoFile))
    return hasWriting || hasAudio || hasVideo
  }

  function handleSubmit() {
    if (!canSubmit()) {
      setSubmitNote('Add at least one answer: writing (Drive/image/text), audio, or video.')
      return
    }
    setSubmitNote('Ready to submit — server save will wire to homework_submissions next.')
  }

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

      {(block.allowText || block.allowDriveLink || block.allowImage || block.allowFiles) && (
        <div className="space-y-3 rounded-lg border border-cream-300 bg-white/70 p-3">
          <p className="text-xs font-semibold tracking-wide text-gold-700 uppercase">
            Writing answer
          </p>
          <p className="text-xs text-green-700">
            Submit a Drive link and/or a photo of your work (max {formatBytes(maxImageBytes)}).
          </p>

          {block.allowText ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-green-900">Written response</label>
              <Textarea
                value={text}
                disabled={mode === 'preview'}
                placeholder="Type your answer…"
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          ) : null}

          {block.allowDriveLink ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-green-900">Google Drive link</label>
              <Input
                type="url"
                placeholder="https://drive.google.com/..."
                value={driveLink}
                disabled={mode === 'preview'}
                onChange={(e) => setDriveLink(e.target.value)}
              />
            </div>
          ) : null}

          {block.allowImage ? (
            <div className="space-y-1.5">
              <label className="inline-flex items-center gap-1.5 text-sm font-medium text-green-900">
                <ImageIcon className="size-3.5" />
                Photo of your work (max {formatBytes(maxImageBytes)})
              </label>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={mode === 'preview'}
                onChange={(e) => onImagePick(e.target.files?.[0])}
              />
              {imageError ? <p className="text-xs text-danger-500">{imageError}</p> : null}
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-green-900">PDF upload</label>
              <Input
                type="file"
                accept=".pdf,application/pdf"
                multiple
                disabled={mode === 'preview'}
                onChange={(e) => setPdfFiles(Array.from(e.target.files ?? []))}
              />
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
        <div className="space-y-3 rounded-lg border border-cream-300 bg-white/70 p-3">
          <p className="text-xs font-semibold tracking-wide text-gold-700 uppercase">Audio</p>
          <TimedRecorder
            kind="audio"
            prompt="Record your homework response"
            maxSeconds={block.maxAudioSeconds ?? 60}
            mode={mode}
            onBlobReady={setAudioBlob}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-green-900">Or upload an audio file</label>
            <Input
              type="file"
              accept="audio/*"
              disabled={mode === 'preview'}
              onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
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
        <div className="space-y-3 rounded-lg border border-cream-300 bg-white/70 p-3">
          <p className="text-xs font-semibold tracking-wide text-gold-700 uppercase">Video</p>
          <TimedRecorder
            kind="video"
            prompt="Record your video practice"
            maxSeconds={block.maxVideoSeconds ?? 90}
            mode={mode}
            onBlobReady={setVideoBlob}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-green-900">Or upload a video file</label>
            <Input
              type="file"
              accept="video/*"
              disabled={mode === 'preview'}
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
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
        <Button type="button" size="sm" disabled={!canSubmit()} onClick={handleSubmit}>
          Submit homework
        </Button>
        {submitNote ? <p className="mt-2 text-xs text-green-700">{submitNote}</p> : null}
      </div>
    </div>
  )
}

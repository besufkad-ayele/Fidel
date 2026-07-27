'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Mic, Square, Upload, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { uploadAdminAudioAction } from '@/app/(admin)/admin/media-upload-actions'
import { vocabAudioPublicUrl, lessonMediaPublicUrl } from '@/lib/media/urls'
import { cn } from '@/lib/utils'

type AdminAudioFieldProps = {
  name: string
  label: string
  defaultValue?: string | null
  folder?: 'vocab' | 'lesson' | 'dialogue'
  levelId?: string
  speed?: 'slow' | 'normal' | 'natural' | ''
  clipLabel?: string
  className?: string
  /** Controlled mode for block editors */
  value?: string
  onChange?: (pathOrUrl: string) => void
}

export function AdminAudioField({
  name,
  label,
  defaultValue = '',
  folder = 'vocab',
  levelId = 'ha',
  speed = '',
  clipLabel = 'clip',
  className,
  value,
  onChange,
}: AdminAudioFieldProps) {
  const [stored, setStored] = useState(value ?? defaultValue ?? '')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (value !== undefined) setStored(value)
  }, [value])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const playable =
    folder === 'vocab' ? vocabAudioPublicUrl(stored) : lessonMediaPublicUrl(stored)

  function commit(next: string) {
    setStored(next)
    onChange?.(next)
  }

  function uploadBlob(blob: Blob, filename: string) {
    setError(null)
    const file = new File([blob], filename, { type: blob.type || 'audio/webm' })
    const fd = new FormData()
    fd.set('file', file)
    fd.set('folder', folder)
    fd.set('levelId', levelId)
    fd.set('label', `${clipLabel}${speed ? `-${speed}` : ''}`)
    if (speed) fd.set('speed', speed)

    startTransition(async () => {
      const result = await uploadAdminAudioAction(fd)
      if (!result.ok) {
        setError(result.error)
        return
      }
      // Store storage path so DB stays stable; playback uses public URL helper.
      commit(result.path)
    })
  }

  async function startRecording() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        stream.getTracks().forEach((t) => t.stop())
        uploadBlob(blob, `${clipLabel || 'recording'}.webm`)
      }
      mediaRef.current = recorder
      recorder.start()
      setRecording(true)
      setSeconds(0)
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= 120) {
            stopRecording()
            return 120
          }
          return s + 1
        })
      }, 1000)
    } catch {
      setError('Microphone permission is required to record.')
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current)
    setRecording(false)
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop()
    }
  }

  return (
    <div className={cn('space-y-2 rounded-lg border border-cream-300 bg-cream-50 p-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {stored ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-danger-500"
            onClick={() => commit('')}
          >
            <Trash2 className="size-3" />
            Clear
          </button>
        ) : null}
      </div>

      {/* Hidden field for classic form posts; controlled mode still uses onChange */}
      <input type="hidden" name={name} value={stored} readOnly />

      {playable ? (
        <audio controls src={playable} className="w-full" preload="metadata" />
      ) : (
        <p className="text-xs text-muted-foreground">
          Upload a file or record now — Google Drive links often fail in the player.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.webm,.m4a,.ogg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            uploadBlob(file, file.name)
            e.target.value = ''
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending || recording}
          onClick={() => fileInputRef.current?.click()}
        >
          {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <Upload className="mr-1.5 size-3.5" />}
          Upload
        </Button>
        {!recording ? (
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={startRecording}
          >
            <Mic className="mr-1.5 size-3.5" />
            Record
          </Button>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={stopRecording}>
            <Square className="mr-1.5 size-3.5" />
            Stop ({seconds}s)
          </Button>
        )}
      </div>

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">Paste a direct audio URL instead</summary>
        <Input
          className="mt-2"
          placeholder="https://…/file.mp3 (not a Google Drive share page)"
          value={/^(https?:)/i.test(stored) ? stored : ''}
          onChange={(e) => commit(e.target.value)}
        />
      </details>

      {error ? <p className="text-xs text-danger-500">{error}</p> : null}
      {pending ? <p className="text-xs text-green-600">Uploading…</p> : null}
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Square, Video } from 'lucide-react'
import { cn } from '@/lib/utils'

type TimedRecorderProps = {
  kind: 'audio' | 'video'
  prompt: string
  instructions?: string
  maxSeconds: number
  minSeconds?: number
  required?: boolean
  mode?: 'student' | 'preview'
  /** Override the eyebrow label (defaults to Speaking / Video practice) */
  label?: string
  /** Highlight the recorder when submit validation fails */
  invalid?: boolean
  invalidMessage?: string | null
  onBlobReady?: (blob: Blob) => void
  /** Notify parent of recorded length (seconds) when a take finishes */
  onDurationReady?: (seconds: number) => void
}

export function TimedRecorder({
  kind,
  prompt,
  instructions,
  maxSeconds,
  minSeconds = 0,
  required,
  mode = 'student',
  label,
  invalid = false,
  invalidMessage,
  onBlobReady,
  onDurationReady,
}: TimedRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const secondsRef = useRef(0)

  useEffect(() => {
    secondsRef.current = seconds
  }, [seconds])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])

  async function start() {
    setError(null)
    if (mode === 'preview') {
      setRecording(true)
      setSeconds(0)
      secondsRef.current = 0
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s + 1
          secondsRef.current = next
          if (next >= maxSeconds) {
            stopPreview()
            return maxSeconds
          }
          return next
        })
      }, 1000)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        kind === 'audio' ? { audio: true } : { audio: true, video: true },
      )
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: kind === 'audio' ? 'audio/webm' : 'video/webm',
        })
        if (url) URL.revokeObjectURL(url)
        const objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
        onBlobReady?.(blob)
        onDurationReady?.(secondsRef.current)
        stream.getTracks().forEach((t) => t.stop())
      }
      mediaRef.current = recorder
      recorder.start()
      setRecording(true)
      setSeconds(0)
      secondsRef.current = 0
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s + 1
          secondsRef.current = next
          if (next >= maxSeconds) {
            stop()
            return maxSeconds
          }
          return next
        })
      }, 1000)
    } catch {
      setError('Microphone/camera permission is required to record.')
    }
  }

  function stopPreview() {
    if (timerRef.current) clearInterval(timerRef.current)
    setRecording(false)
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current)
    setRecording(false)
    if (mode === 'preview') return
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop()
    }
  }

  const remaining = Math.max(0, maxSeconds - seconds)
  const tooShort = seconds > 0 && seconds < minSeconds && Boolean(url)
  const showInvalid = invalid || tooShort

  return (
    <div
      className={cn(
        'space-y-3 rounded-xl border bg-cream-50 p-5 transition-colors',
        showInvalid
          ? 'border-danger-500 bg-danger-50/40 ring-1 ring-danger-500/30'
          : 'border-cream-300',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase',
          showInvalid ? 'text-danger-600' : 'text-gold-700',
        )}
      >
        {kind === 'audio' ? <Mic className="size-3.5" /> : <Video className="size-3.5" />}
        {label ?? (kind === 'audio' ? 'Speaking' : 'Video practice')}
        {required ? ' · required' : ''}
      </div>
      <p className="font-medium text-green-900">{prompt}</p>
      {instructions ? <p className="text-sm text-green-700">{instructions}</p> : null}

      <div
        className={cn(
          'flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 text-sm ring-1',
          showInvalid ? 'ring-danger-500/40' : 'ring-cream-300',
        )}
      >
        <span className="tabular-nums text-green-900">
          {seconds}s / {maxSeconds}s
        </span>
        <span className={showInvalid ? 'text-danger-600' : 'text-green-600'}>
          {remaining}s left
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {!recording ? (
          <Button type="button" onClick={start}>
            Start {kind === 'audio' ? 'recording' : 'video'}
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={stop}>
            <Square className="mr-1.5 size-3.5" />
            Stop
          </Button>
        )}
        {url ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setUrl(null)
              setSeconds(0)
              secondsRef.current = 0
              onBlobReady?.(new Blob())
              onDurationReady?.(0)
            }}
          >
            Re-record
          </Button>
        ) : null}
      </div>

      {tooShort && !recording ? (
        <p className="text-xs text-danger-600">Minimum length is {minSeconds}s.</p>
      ) : null}
      {invalid && invalidMessage ? (
        <p className="text-xs font-medium text-danger-600">{invalidMessage}</p>
      ) : null}
      {error ? <p className="text-xs text-danger-600">{error}</p> : null}
      {mode === 'preview' ? (
        <p className="text-xs text-green-600">
          Preview mode — recording is simulated and capped at {maxSeconds}s.
        </p>
      ) : null}

      {url && kind === 'audio' ? <audio controls src={url} className="w-full" /> : null}
      {url && kind === 'video' ? (
        <video controls src={url} className="w-full rounded-lg border border-cream-300" />
      ) : null}
    </div>
  )
}

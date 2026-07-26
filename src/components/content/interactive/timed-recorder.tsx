'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Square, Video } from 'lucide-react'

type TimedRecorderProps = {
  kind: 'audio' | 'video'
  prompt: string
  instructions?: string
  maxSeconds: number
  minSeconds?: number
  required?: boolean
  mode?: 'student' | 'preview'
  onBlobReady?: (blob: Blob) => void
}

export function TimedRecorder({
  kind,
  prompt,
  instructions,
  maxSeconds,
  minSeconds = 0,
  required,
  mode = 'student',
  onBlobReady,
}: TimedRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= maxSeconds) {
            stopPreview()
            return maxSeconds
          }
          return s + 1
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
        stream.getTracks().forEach((t) => t.stop())
      }
      mediaRef.current = recorder
      recorder.start()
      setRecording(true)
      setSeconds(0)
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= maxSeconds) {
            stop()
            return maxSeconds
          }
          return s + 1
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
  const tooShort = seconds > 0 && seconds < minSeconds

  return (
    <div className="space-y-3 rounded-xl border border-cream-300 bg-cream-50 p-5">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
        {kind === 'audio' ? <Mic className="size-3.5" /> : <Video className="size-3.5" />}
        {kind === 'audio' ? 'Speaking' : 'Video practice'}
        {required ? ' · required' : ''}
      </div>
      <p className="font-medium text-green-900">{prompt}</p>
      {instructions ? <p className="text-sm text-green-700">{instructions}</p> : null}

      <div className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 text-sm ring-1 ring-cream-300">
        <span className="tabular-nums text-green-900">
          {seconds}s / {maxSeconds}s
        </span>
        <span className="text-green-600">{remaining}s left</span>
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
            }}
          >
            Re-record
          </Button>
        ) : null}
      </div>

      {tooShort && !recording ? (
        <p className="text-xs text-danger-600">Minimum length is {minSeconds}s.</p>
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

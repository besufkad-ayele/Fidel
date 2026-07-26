'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SpeakingRecorder() {
  const [recording, setRecording] = useState(false)
  const [saved, setSaved] = useState(false)
  const [timer, setTimer] = useState(0)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [])

  const start = () => {
    setRecording(true)
    setSaved(false)
    setTimer(0)
    intervalRef.current = window.setInterval(() => setTimer((t) => t + 1), 1000)
  }

  const stop = () => {
    setRecording(false)
    if (intervalRef.current) window.clearInterval(intervalRef.current)
    setSaved(true)
  }

  return (
    <div className="rounded-xl border border-cream-300 bg-cream-50 p-6 shadow-card">
      <div className="mx-auto max-w-md space-y-4 text-center">
        <div>
          <span className="text-xs font-semibold tracking-[0.14em] text-gold-600 uppercase">
            Interactive speaking drill
          </span>
          <h4 className="mt-1 text-lg font-bold text-green-900">Record your pronunciation</h4>
          <p className="text-xs text-green-600">
            Prompt: Say <span className="font-semibold text-gold-700">&quot;Selam, endet neh?&quot;</span>
          </p>
        </div>

        <div className="relative flex h-20 items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-green-950 px-6">
          {recording ? (
            Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 animate-pulse rounded-full bg-gold-500"
                style={{
                  height: `${12 + ((i * 7) % 40)}px`,
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))
          ) : saved ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-gold-400">
              <CheckCircle2 className="size-5 text-success-500" />
              <span>Audio sample saved (0:{String(Math.max(timer, 3)).padStart(2, '0')})</span>
            </div>
          ) : (
            <span className="text-xs text-green-400">Tap the microphone to start recording</span>
          )}
        </div>

        {recording ? (
          <p className="font-mono text-xs font-bold text-danger-500">
            REC 00:{String(timer).padStart(2, '0')}
          </p>
        ) : null}

        <div className="flex items-center justify-center gap-4 pt-2">
          {!recording ? (
            <button
              type="button"
              onClick={start}
              className="flex size-16 items-center justify-center rounded-full bg-danger-500 text-white shadow-lg transition-all hover:scale-105"
              aria-label="Start recording"
            >
              <Mic className="size-7" />
            </button>
          ) : (
            <button
              type="button"
              onClick={stop}
              className="flex size-16 items-center justify-center rounded-full bg-green-800 text-white shadow-lg transition-all hover:scale-105"
              aria-label="Stop recording"
            >
              <div className="size-6 rounded-sm bg-white" />
            </button>
          )}
        </div>

        {saved ? (
          <div className="flex justify-center gap-3 pt-2">
            <Button type="button" variant="outline" onClick={start} className="text-xs">
              Re-record
            </Button>
            <Button type="button" className="bg-gold-500 text-xs text-green-950 hover:bg-gold-600">
              Submit to teacher
            </Button>
          </div>
        ) : null}

        <p className="text-[11px] text-green-500">
          Your teacher can listen and give personalized feedback.
        </p>
      </div>
    </div>
  )
}

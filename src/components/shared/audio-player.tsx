'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AlertCircle, Loader2, Pause, Play, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type AudioBus = {
  playingId: string | null
  requestPlay: (id: string, el: HTMLAudioElement) => void
  notifyStopped: (id: string) => void
}

const AudioBusContext = createContext<AudioBus | null>(null)

export function AudioPlaybackProvider({ children }: { children: ReactNode }) {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const currentRef = useRef<HTMLAudioElement | null>(null)

  const requestPlay = useCallback((id: string, el: HTMLAudioElement) => {
    if (currentRef.current && currentRef.current !== el) {
      currentRef.current.pause()
      currentRef.current.currentTime = 0
    }
    currentRef.current = el
    setPlayingId(id)
    void el.play().catch(() => setPlayingId(null))
  }, [])

  const notifyStopped = useCallback((id: string) => {
    setPlayingId((prev) => (prev === id ? null : prev))
  }, [])

  return (
    <AudioBusContext.Provider value={{ playingId, requestPlay, notifyStopped }}>
      {children}
    </AudioBusContext.Provider>
  )
}

function useAudioBus() {
  return useContext(AudioBusContext)
}

export type AudioSpeed = 'slow' | 'normal' | 'natural'

export type AudioSources = {
  slow?: string | null
  normal?: string | null
  natural?: string | null
  /** Single fallback URL when speeds aren't split */
  url?: string | null
}

function resolveSrc(sources: AudioSources, speed: AudioSpeed): string | null {
  if (speed === 'slow' && sources.slow) return sources.slow
  if (speed === 'natural' && sources.natural) return sources.natural
  if (sources.normal) return sources.normal
  if (sources.url) return sources.url
  if (sources.slow) return sources.slow
  if (sources.natural) return sources.natural
  return null
}

type AudioPlayerProps = {
  sources: AudioSources
  variant?: 'icon' | 'inline' | 'full'
  label?: string
  showSpeed?: boolean
  className?: string
  /** Fallback TTS text when no recording exists */
  speakText?: string
}

function speakFallback(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'am-ET'
  u.rate = 0.85
  window.speechSynthesis.speak(u)
}

export function AudioPlayer({
  sources,
  variant = 'icon',
  label,
  showSpeed = false,
  className,
  speakText,
}: AudioPlayerProps) {
  const id = useId()
  const bus = useAudioBus()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [speed, setSpeed] = useState<AudioSpeed>('normal')
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle')
  const src = resolveSrc(sources, speed)
  const canPlay = Boolean(src) || Boolean(speakText)

  useEffect(() => {
    setStatus('idle')
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [src])

  useEffect(() => {
    if (bus && bus.playingId !== id && status === 'playing') {
      audioRef.current?.pause()
      setStatus('idle')
    }
  }, [bus, bus?.playingId, id, status])

  function toggle() {
    if (!canPlay) return

    if (!src && speakText) {
      setStatus('playing')
      speakFallback(speakText)
      window.setTimeout(() => setStatus('idle'), Math.min(2500, speakText.length * 120))
      return
    }

    const el = audioRef.current
    if (!el || !src) return

    if (status === 'playing') {
      el.pause()
      setStatus('idle')
      bus?.notifyStopped(id)
      return
    }

    setStatus('loading')
    if (bus) {
      bus.requestPlay(id, el)
    } else {
      void el.play().catch(() => setStatus('error'))
    }
  }

  if (!canPlay) return null

  const isPlaying = status === 'playing'
  const Icon =
    status === 'loading' ? Loader2 : status === 'error' ? AlertCircle : isPlaying ? Pause : Play

  if (variant === 'icon') {
    return (
      <div className={cn('inline-flex items-center gap-2', className)}>
        {src ? (
          <audio
            ref={audioRef}
            src={src}
            preload="none"
            onPlaying={() => setStatus('playing')}
            onPause={() => {
              setStatus('idle')
              bus?.notifyStopped(id)
            }}
            onEnded={() => {
              setStatus('idle')
              bus?.notifyStopped(id)
            }}
            onError={() => setStatus('error')}
          />
        ) : null}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            toggle()
          }}
          aria-label={label ?? (isPlaying ? 'Pause audio' : 'Play audio')}
          aria-live="polite"
          className={cn(
            'flex size-9 items-center justify-center rounded-full transition',
            status === 'error'
              ? 'bg-danger-50 text-danger-500'
              : isPlaying
                ? 'bg-gold-500 text-white shadow-md'
                : 'bg-gold-100 text-gold-800 hover:bg-gold-200',
          )}
        >
          <Icon className={cn('size-4', status === 'loading' && 'animate-spin')} />
        </button>
        {showSpeed ? (
          <SpeedPills speed={speed} onChange={setSpeed} sources={sources} />
        ) : null}
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-2 pr-3',
          className,
        )}
      >
        {src ? (
          <audio
            ref={audioRef}
            src={src}
            preload="none"
            onPlaying={() => setStatus('playing')}
            onPause={() => {
              setStatus('idle')
              bus?.notifyStopped(id)
            }}
            onEnded={() => {
              setStatus('idle')
              bus?.notifyStopped(id)
            }}
            onError={() => setStatus('error')}
          />
        ) : null}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            toggle()
          }}
          className={cn(
            'flex size-8 items-center justify-center rounded-full',
            isPlaying ? 'bg-gold-500 text-white' : 'bg-gold-100 text-gold-800',
          )}
          aria-label={label ?? 'Play'}
        >
          <Icon className={cn('size-3.5', status === 'loading' && 'animate-spin')} />
        </button>
        <span className="flex items-end gap-0.5" aria-hidden>
          {[4, 8, 5, 10, 6, 9, 4].map((h, i) => (
            <span
              key={i}
              className={cn(
                'w-0.5 rounded-full bg-gold-500/70',
                isPlaying && 'animate-pulse',
              )}
              style={{ height: h, animationDelay: `${i * 80}ms` }}
            />
          ))}
        </span>
        {label ? <span className="text-xs font-medium text-green-700">{label}</span> : null}
        {showSpeed ? <SpeedPills speed={speed} onChange={setSpeed} sources={sources} /> : null}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'space-y-2 rounded-xl border border-cream-300 bg-cream-50 p-3',
        className,
      )}
    >
      {src ? (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onPlaying={() => setStatus('playing')}
          onPause={() => {
            setStatus('idle')
            bus?.notifyStopped(id)
          }}
          onEnded={() => {
            setStatus('idle')
            bus?.notifyStopped(id)
          }}
          onError={() => setStatus('error')}
        />
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium',
            isPlaying ? 'bg-gold-500 text-white' : 'bg-gold-100 text-gold-800 hover:bg-gold-200',
          )}
        >
          {isPlaying ? <Volume2 className="size-4" /> : <Play className="size-4" />}
          {label ?? (isPlaying ? 'Playing' : 'Listen')}
        </button>
        {showSpeed ? <SpeedPills speed={speed} onChange={setSpeed} sources={sources} /> : null}
      </div>
      {status === 'error' ? (
        <p className="text-xs text-danger-500">Could not play this recording. Try another speed.</p>
      ) : null}
    </div>
  )
}

function SpeedPills({
  speed,
  onChange,
  sources,
}: {
  speed: AudioSpeed
  onChange: (s: AudioSpeed) => void
  sources: AudioSources
}) {
  const options: { id: AudioSpeed; label: string; available: boolean }[] = [
    { id: 'slow', label: 'Slow', available: Boolean(sources.slow || sources.url || sources.normal) },
    { id: 'normal', label: 'Normal', available: Boolean(sources.normal || sources.url) },
    { id: 'natural', label: 'Natural', available: Boolean(sources.natural || sources.url || sources.normal) },
  ]

  return (
    <div className="inline-flex rounded-full border border-cream-300 bg-white p-0.5 text-[11px]">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          disabled={!opt.available}
          onClick={(e) => {
            e.stopPropagation()
            onChange(opt.id)
          }}
          className={cn(
            'rounded-full px-2 py-1 font-semibold transition',
            speed === opt.id ? 'bg-green-700 text-cream-50' : 'text-green-600 hover:text-green-900',
            !opt.available && 'cursor-not-allowed opacity-40',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

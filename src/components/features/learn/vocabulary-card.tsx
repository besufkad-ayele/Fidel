'use client'

import { useState } from 'react'
import { Play, Volume2 } from 'lucide-react'
import { AmharicText } from '@/components/shared/amharic-text'

type VocabularyCardProps = {
  amharic: string
  transliteration: string
  english: string
  wordType: string
  genderNote?: string
}

function speak(phrase: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(phrase)
  utterance.rate = 0.9
  utterance.lang = 'am-ET'
  window.speechSynthesis.speak(utterance)
}

export function VocabularyCard({
  amharic,
  transliteration,
  english,
  wordType,
  genderNote,
}: VocabularyCardProps) {
  const [playing, setPlaying] = useState(false)

  const handlePlay = () => {
    setPlaying(true)
    speak(amharic)
    window.setTimeout(() => setPlaying(false), 1200)
  }

  return (
    <div className="rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card transition-all hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div>
          <AmharicText size="xl" className="font-medium text-gold-700">
            {amharic}
          </AmharicText>
          <p className="mt-0.5 text-sm italic text-green-500">{transliteration}</p>
        </div>
        <button
          type="button"
          onClick={handlePlay}
          className={`flex size-10 items-center justify-center rounded-full transition-all ${
            playing
              ? 'scale-105 bg-gold-500 text-white shadow-md'
              : 'bg-gold-100 text-gold-800 hover:scale-105 hover:bg-gold-200'
          }`}
          aria-label={`Play pronunciation of ${transliteration}`}
        >
          {playing ? <Volume2 className="size-4" /> : <Play className="size-4" />}
        </button>
      </div>

      <div className="my-3 border-t border-cream-200" />

      <div className="flex items-center justify-between gap-2">
        <p className="text-base font-semibold text-green-800">{english}</p>
        <span className="rounded bg-cream-200 px-2 py-0.5 text-xs font-medium text-green-700">
          {wordType}
        </span>
      </div>
      {genderNote ? <p className="mt-1 text-xs font-medium text-gold-700">{genderNote}</p> : null}
    </div>
  )
}

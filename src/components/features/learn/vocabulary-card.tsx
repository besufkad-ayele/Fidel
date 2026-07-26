'use client'

import { AmharicText } from '@/components/shared/amharic-text'
import { AudioPlayer, type AudioSources } from '@/components/shared/audio-player'

type VocabularyCardProps = {
  amharic: string
  transliteration: string
  english: string
  wordType: string
  genderNote?: string
  audio?: AudioSources
}

export function VocabularyCard({
  amharic,
  transliteration,
  english,
  wordType,
  genderNote,
  audio,
}: VocabularyCardProps) {
  return (
    <div className="rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card transition-all hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div>
          <AmharicText size="xl" className="font-medium text-gold-700">
            {amharic}
          </AmharicText>
          <p className="mt-0.5 text-sm italic text-green-500">{transliteration}</p>
        </div>
        <AudioPlayer
          variant="icon"
          showSpeed
          sources={audio ?? {}}
          speakText={amharic}
          label={`Play pronunciation of ${transliteration}`}
        />
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

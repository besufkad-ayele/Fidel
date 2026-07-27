import Link from 'next/link'
import type { Metadata } from 'next'
import { AmharicText } from '@/components/shared/amharic-text'
import { AudioPlaybackProvider, AudioPlayer } from '@/components/shared/audio-player'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/server'
import { vocabAudioPublicUrl } from '@/lib/media/urls'

export const metadata: Metadata = { title: 'Vocabulary' }

export default async function VocabularyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; level?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('vocabulary_items')
    .select(
      'id, amharic, english, transliteration, level_id, part_of_speech, audio_slow_path, audio_normal_path, audio_natural_path',
    )
    .order('amharic')
    .limit(100)

  if (sp.level) query = query.eq('level_id', sp.level)
  if (sp.q?.trim()) {
    const q = sp.q.trim()
    query = query.or(
      `amharic.ilike.%${q}%,english.ilike.%${q}%,transliteration.ilike.%${q}%`,
    )
  }

  const { data: items } = await query

  return (
    <AudioPlaybackProvider>
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
              Vocabulary
            </p>
            <h1 className="font-display text-3xl text-green-900">Word bank</h1>
            <p className="mt-1 text-sm text-green-700">
              Tap the speaker to train your ear. Study with spaced flashcards when ready.
            </p>
          </div>
          <Button asChild>
            <Link href="/vocabulary/flashcards">Study flashcards</Link>
          </Button>
        </header>

        <form className="flex flex-wrap gap-2">
          <Input
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="Search Amharic or English…"
            className="max-w-sm"
          />
          <select
            name="level"
            defaultValue={sp.level ?? ''}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All levels</option>
            <option value="ha">ሀ</option>
            <option value="le">ለ</option>
            <option value="hha">ሐ</option>
            <option value="me">መ</option>
            <option value="sse">ሠ</option>
            <option value="re">ረ</option>
          </select>
          <Button type="submit" variant="outline">
            Filter
          </Button>
        </form>

        {(items ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-cream-400 bg-cream-50 p-8 text-center">
            <p className="font-display text-xl text-green-900">No vocabulary yet</p>
            <p className="mt-1 text-sm text-green-700">
              Teachers add words and audio in Admin → Vocabulary.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-cream-300 overflow-hidden rounded-xl border border-cream-300 bg-cream-50">
            {(items ?? []).map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <AmharicText size="lg" className="text-green-950">
                    {item.amharic}
                  </AmharicText>
                  {item.transliteration ? (
                    <p className="text-sm italic text-green-600">{item.transliteration}</p>
                  ) : null}
                  <p className="text-sm text-green-900">{item.english}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <AudioPlayer
                    variant="icon"
                    showSpeed
                    sources={{
                      slow: vocabAudioPublicUrl(item.audio_slow_path),
                      normal: vocabAudioPublicUrl(item.audio_normal_path),
                      natural: vocabAudioPublicUrl(item.audio_natural_path),
                    }}
                    speakText={item.amharic}
                    label={`Listen to ${item.transliteration || item.amharic}`}
                  />
                  <span className="text-[11px] font-semibold tracking-wide text-green-600 uppercase">
                    {item.level_id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AudioPlaybackProvider>
  )
}

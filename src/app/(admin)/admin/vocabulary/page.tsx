import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { SectionCard } from '@/components/admin/section-card'
import { ConfirmForm } from '@/components/admin/confirm-form'
import { AmharicText } from '@/components/shared/amharic-text'
import { createAdminDb } from '@/lib/admin/db'
import { createVocabularyFormAction } from '@/app/(admin)/admin/actions'
import {
  updateVocabularyAction,
  deleteVocabularyAction,
} from '@/app/(admin)/admin/content-actions'
import { LEVEL_OPTIONS } from '@/lib/admin/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const metadata: Metadata = { title: 'Vocabulary' }

type VocabRow = {
  id: string
  amharic: string
  english: string
  transliteration: string | null
  level_id: string
  notes: string | null
  audio_slow_path: string | null
  audio_normal_path: string | null
  audio_natural_path: string | null
}

export default async function VocabularyPage() {
  const db = await createAdminDb()
  const { data: items } = await db
    .from('vocabulary_items')
    .select(
      'id, amharic, english, transliteration, level_id, notes, audio_slow_path, audio_normal_path, audio_natural_path, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Vocabulary"
        description="Add words with Slow / Normal / Natural audio URLs so students can train listening."
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <SectionCard title="Add word">
          <form action={createVocabularyFormAction} className="space-y-3">
            <div>
              <Label htmlFor="amharic">Amharic</Label>
              <Input id="amharic" name="amharic" className="mt-1.5 font-ethiopic text-lg" required />
            </div>
            <div>
              <Label htmlFor="transliteration">Transliteration</Label>
              <Input id="transliteration" name="transliteration" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="english">English</Label>
              <Input id="english" name="english" className="mt-1.5" required />
            </div>
            <div>
              <Label htmlFor="levelId">Level</Label>
              <select
                id="levelId"
                name="levelId"
                defaultValue="ha"
                className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 rounded-lg border border-cream-300 bg-cream-50 p-3">
              <p className="text-xs font-semibold tracking-wide text-gold-700 uppercase">
                Pronunciation audio
              </p>
              <div>
                <Label htmlFor="audioSlow">Slow URL</Label>
                <Input id="audioSlow" name="audioSlow" className="mt-1.5" placeholder="https://…/slow.mp3" />
              </div>
              <div>
                <Label htmlFor="audioNormal">Normal URL</Label>
                <Input
                  id="audioNormal"
                  name="audioNormal"
                  className="mt-1.5"
                  placeholder="https://…/normal.mp3"
                />
              </div>
              <div>
                <Label htmlFor="audioNatural">Natural URL</Label>
                <Input
                  id="audioNatural"
                  name="audioNatural"
                  className="mt-1.5"
                  placeholder="https://…/natural.mp3"
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Add vocabulary
            </Button>
          </form>
        </SectionCard>

        <div>
          {(items ?? []).length === 0 ? (
            <EmptyState
              title="Vocabulary bank is empty"
              description="Add words with audio, then attach them to lessons and listening practice."
            />
          ) : (
            <div className="space-y-4">
              {(items as VocabRow[]).map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-cream-300 bg-cream-50 p-4 shadow-card"
                >
                  <form action={updateVocabularyAction} className="grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="id" value={item.id} />
                    <div>
                      <Label>Amharic</Label>
                      <Input
                        name="amharic"
                        className="mt-1.5 font-ethiopic text-lg"
                        defaultValue={item.amharic}
                        required
                      />
                    </div>
                    <div>
                      <Label>English</Label>
                      <Input name="english" className="mt-1.5" defaultValue={item.english} required />
                    </div>
                    <div>
                      <Label>Transliteration</Label>
                      <Input
                        name="transliteration"
                        className="mt-1.5"
                        defaultValue={item.transliteration ?? ''}
                      />
                    </div>
                    <div>
                      <Label>Level</Label>
                      <select
                        name="levelId"
                        defaultValue={item.level_id}
                        className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {LEVEL_OPTIONS.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Audio · Slow</Label>
                      <Input
                        name="audioSlow"
                        className="mt-1.5"
                        defaultValue={item.audio_slow_path ?? ''}
                      />
                    </div>
                    <div>
                      <Label>Audio · Normal</Label>
                      <Input
                        name="audioNormal"
                        className="mt-1.5"
                        defaultValue={item.audio_normal_path ?? ''}
                      />
                    </div>
                    <div>
                      <Label>Audio · Natural</Label>
                      <Input
                        name="audioNatural"
                        className="mt-1.5"
                        defaultValue={item.audio_natural_path ?? ''}
                      />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Input name="notes" className="mt-1.5" defaultValue={item.notes ?? ''} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                      <Button type="submit" size="sm">
                        Save
                      </Button>
                      <span className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                        <AmharicText size="sm" className="text-gold-700">
                          {item.amharic}
                        </AmharicText>
                        {(item.audio_slow_path ||
                          item.audio_normal_path ||
                          item.audio_natural_path) && (
                          <span className="rounded bg-gold-100 px-1.5 py-0.5 text-[10px] font-semibold text-gold-800 uppercase">
                            Has audio
                          </span>
                        )}
                      </span>
                    </div>
                  </form>
                  <div className="mt-3 border-t border-cream-300 pt-3">
                    <ConfirmForm
                      action={deleteVocabularyAction.bind(null, item.id)}
                      message={`Delete "${item.amharic}" / ${item.english}?`}
                      label="Delete"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

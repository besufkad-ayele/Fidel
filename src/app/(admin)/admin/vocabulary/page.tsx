import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { SectionCard } from '@/components/admin/section-card'
import { ConfirmForm } from '@/components/admin/confirm-form'
import { AmharicText } from '@/components/shared/amharic-text'
import { createAdminDb } from '@/lib/admin/db'
import {
  createVocabularyFormAction,
} from '@/app/(admin)/admin/actions'
import {
  updateVocabularyAction,
  deleteVocabularyAction,
} from '@/app/(admin)/admin/content-actions'
import { LEVEL_OPTIONS } from '@/lib/admin/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const metadata: Metadata = { title: 'Vocabulary' }

export default async function VocabularyPage() {
  const db = await createAdminDb()
  const { data: items } = await db
    .from('vocabulary_items')
    .select('id, amharic, english, transliteration, level_id, notes, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Vocabulary"
        description="Create, update, and delete words in the bank."
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
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
            <Button type="submit" className="w-full">
              Add vocabulary
            </Button>
          </form>
        </SectionCard>

        <div>
          {(items ?? []).length === 0 ? (
            <EmptyState
              title="Vocabulary bank is empty"
              description="Add words here, then attach them to language lessons from the unit editor."
            />
          ) : (
            <div className="space-y-4">
              {(items ?? []).map(
                (item: {
                  id: string
                  amharic: string
                  english: string
                  transliteration: string | null
                  level_id: string
                  notes: string | null
                }) => (
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
                      <div className="sm:col-span-2">
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
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

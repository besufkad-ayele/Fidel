import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { SectionCard } from '@/components/admin/section-card'
import { createAdminDb } from '@/lib/admin/db'
import {
  VocabularyCreateForm,
  VocabularyEditCard,
  type VocabAdminItem,
} from '@/components/admin/vocabulary-forms'

export const metadata: Metadata = { title: 'Vocabulary' }

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
        description="Upload or record Slow / Normal / Natural audio here — avoid Google Drive share links."
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <SectionCard title="Add word">
          <VocabularyCreateForm />
        </SectionCard>

        <div>
          {(items ?? []).length === 0 ? (
            <EmptyState
              title="Vocabulary bank is empty"
              description="Add a word, then record or upload pronunciation audio on the spot."
            />
          ) : (
            <div className="space-y-4">
              {(items as VocabAdminItem[]).map((item) => (
                <VocabularyEditCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { AmharicText } from '@/components/shared/amharic-text'
import { AdminAudioField } from '@/components/admin/admin-audio-field'
import { ConfirmForm } from '@/components/admin/confirm-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LEVEL_OPTIONS } from '@/lib/admin/constants'
import { createVocabularyFormAction } from '@/app/(admin)/admin/actions'
import {
  updateVocabularyAction,
  deleteVocabularyAction,
} from '@/app/(admin)/admin/content-actions'

export type VocabAdminItem = {
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

export function VocabularyCreateForm() {
  const [levelId, setLevelId] = useState('ha')

  return (
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
          value={levelId}
          onChange={(e) => setLevelId(e.target.value)}
          className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {LEVEL_OPTIONS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-wide text-gold-700 uppercase">
          Pronunciation audio
        </p>
        <AdminAudioField
          name="audioSlow"
          label="Slow"
          folder="vocab"
          levelId={levelId}
          speed="slow"
          clipLabel="vocab"
        />
        <AdminAudioField
          name="audioNormal"
          label="Normal"
          folder="vocab"
          levelId={levelId}
          speed="normal"
          clipLabel="vocab"
        />
        <AdminAudioField
          name="audioNatural"
          label="Natural"
          folder="vocab"
          levelId={levelId}
          speed="natural"
          clipLabel="vocab"
        />
      </div>

      <Button type="submit" className="w-full">
        Add vocabulary
      </Button>
    </form>
  )
}

export function VocabularyEditCard({ item }: { item: VocabAdminItem }) {
  const [levelId, setLevelId] = useState(item.level_id)

  return (
    <div className="rounded-xl border border-cream-300 bg-cream-50 p-4 shadow-card">
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
            value={levelId}
            onChange={(e) => setLevelId(e.target.value)}
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

        <div className="space-y-2 sm:col-span-2">
          <p className="text-xs font-semibold tracking-wide text-gold-700 uppercase">
            Pronunciation audio — upload or record
          </p>
          <AdminAudioField
            name="audioSlow"
            label="Slow"
            folder="vocab"
            levelId={levelId}
            speed="slow"
            clipLabel={item.amharic}
            defaultValue={item.audio_slow_path}
          />
          <AdminAudioField
            name="audioNormal"
            label="Normal"
            folder="vocab"
            levelId={levelId}
            speed="normal"
            clipLabel={item.amharic}
            defaultValue={item.audio_normal_path}
          />
          <AdminAudioField
            name="audioNatural"
            label="Natural"
            folder="vocab"
            levelId={levelId}
            speed="natural"
            clipLabel={item.amharic}
            defaultValue={item.audio_natural_path}
          />
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
  )
}

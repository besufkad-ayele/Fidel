'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AmharicText } from '@/components/shared/amharic-text'
import { AdminAudioField } from '@/components/admin/admin-audio-field'
import { ConfirmForm } from '@/components/admin/confirm-form'
import { PendingSubmitButton } from '@/components/admin/pending-submit-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { LEVEL_OPTIONS } from '@/lib/admin/constants'
import { createVocabularyFormAction } from '@/app/(admin)/admin/actions'
import {
  updateVocabularyAction,
  deleteVocabularyAction,
  assignVocabularyToUnitAction,
  unassignVocabularyFromUnitAction,
} from '@/app/(admin)/admin/content-actions'

export type VocabUnitOption = {
  id: string
  title: string
  level_id: string
}

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
  unitIds?: string[]
  isCore?: boolean
}

export function VocabularyCreateForm({
  units = [],
  defaultLevelId = 'ha',
  defaultUnitId,
  /** When true, unit is optional — word stays in the general level bank. */
  allowUnassigned = false,
  redirectHint,
}: {
  units?: VocabUnitOption[]
  defaultLevelId?: string
  /** When set, the word is created and assigned to this unit. */
  defaultUnitId?: string
  allowUnassigned?: boolean
  redirectHint?: string
}) {
  const [levelId, setLevelId] = useState(defaultLevelId)
  const levelUnits = units.filter((u) => u.level_id === levelId)

  return (
    <form action={createVocabularyFormAction} className="space-y-3">
      {defaultUnitId ? <input type="hidden" name="unitId" value={defaultUnitId} /> : null}
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
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" className="mt-1.5" />
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

      {!defaultUnitId && allowUnassigned ? (
        <div>
          <Label htmlFor="unitId">Assign to unit (optional)</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Leave as General to keep this word in the level bank only. Assign to a unit later anytime.
          </p>
          <select
            id="unitId"
            name="unitId"
            className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            defaultValue=""
          >
            <option value="">General — no unit</option>
            {levelUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.title}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {!defaultUnitId && !allowUnassigned && levelUnits.length > 0 ? (
        <div>
          <Label htmlFor="unitId">Add to unit</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Words are created inside a unit. You can assign more units after saving.
          </p>
          <select
            id="unitId"
            name="unitId"
            required
            className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              Select unit…
            </option>
            {levelUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.title}
              </option>
            ))}
          </select>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="isCore" className="size-4" defaultChecked />
            Mark as core word for this unit
          </label>
        </div>
      ) : null}

      {defaultUnitId ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isCore" className="size-4" defaultChecked />
          Mark as core word for this unit
        </label>
      ) : null}

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

      <PendingSubmitButton className="w-full" pendingLabel="Saving…">
        {defaultUnitId
          ? 'Add to this unit'
          : allowUnassigned
            ? 'Add general vocabulary'
            : 'Add vocabulary'}
      </PendingSubmitButton>
      {redirectHint ? <p className="text-xs text-muted-foreground">{redirectHint}</p> : null}
    </form>
  )
}

export function VocabularyEditCard({
  item,
  units = [],
  currentUnitId,
}: {
  item: VocabAdminItem
  units?: VocabUnitOption[]
  /** When editing from a unit page, show unassign for that unit. */
  currentUnitId?: string
}) {
  const [levelId, setLevelId] = useState(item.level_id)
  const [selectedUnits, setSelectedUnits] = useState<string[]>(item.unitIds ?? [])
  const levelUnits = units.filter((u) => u.level_id === levelId)
  const unitTitle = (id: string) => units.find((u) => u.id === id)?.title ?? id

  function toggleUnit(id: string) {
    setSelectedUnits((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  return (
    <div className="rounded-xl border border-cream-300 bg-cream-50 p-4 shadow-card">
      <form action={updateVocabularyAction} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="syncUnits" value="1" />
        {selectedUnits.map((id) => (
          <input key={id} type="hidden" name="unitIds" value={id} />
        ))}

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

        {levelUnits.length > 0 ? (
          <div className="sm:col-span-2">
            <Label>Assigned units</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Reuse this word across units — check every unit that should include it.
            </p>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {levelUnits.map((u) => (
                <label
                  key={u.id}
                  className="flex items-center gap-2 rounded-md border border-cream-300 bg-white px-2.5 py-2 text-sm"
                >
                  <Checkbox
                    checked={selectedUnits.includes(u.id)}
                    onCheckedChange={() => toggleUnit(u.id)}
                  />
                  <span className="min-w-0 flex-1">{u.title}</span>
                  {currentUnitId === u.id ? (
                    <span className="text-[10px] font-semibold tracking-wide text-gold-700 uppercase">
                      here
                    </span>
                  ) : null}
                </label>
              ))}
            </div>
            {selectedUnits.length > 0 ? (
              <p className="mt-2 text-xs text-green-700">
                Units: {selectedUnits.map(unitTitle).join(', ')}
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Not assigned to any unit yet — still available in the level bank.
              </p>
            )}
          </div>
        ) : null}

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
          <PendingSubmitButton size="sm" pendingLabel="Saving…">
            Save
          </PendingSubmitButton>
          <span className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <AmharicText size="sm" className="text-gold-700">
              {item.amharic}
            </AmharicText>
          </span>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-cream-300 pt-3">
        {currentUnitId ? (
          <form action={unassignVocabularyFromUnitAction}>
            <input type="hidden" name="unitId" value={currentUnitId} />
            <input type="hidden" name="vocabularyId" value={item.id} />
            <PendingSubmitButton size="sm" variant="outline" pendingLabel="Removing…">
              Remove from this unit
            </PendingSubmitButton>
          </form>
        ) : null}
        <ConfirmForm
          action={deleteVocabularyAction.bind(null, item.id)}
          message={`Delete "${item.amharic}" / ${item.english} from the bank? This removes it from all units.`}
          label="Delete word"
        />
      </div>
    </div>
  )
}

export function AssignExistingVocabularyForm({
  unitId,
  candidates,
}: {
  unitId: string
  candidates: { id: string; amharic: string; english: string }[]
}) {
  if (candidates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Every word in this level is already assigned here, or the bank is empty.
      </p>
    )
  }

  return (
    <form action={assignVocabularyToUnitAction} className="space-y-3">
      <input type="hidden" name="unitId" value={unitId} />
      <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-md border border-cream-300 p-2">
        {candidates.map((v) => (
          <label key={v.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="vocabularyIds" value={v.id} className="size-4" />
            <AmharicText size="sm">{v.amharic}</AmharicText>
            <span className="text-muted-foreground">— {v.english}</span>
          </label>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isCore" className="size-4" />
        Mark selected as core
      </label>
      <PendingSubmitButton size="sm" pendingLabel="Assigning…">
        Assign to this unit
      </PendingSubmitButton>
      <p className="text-xs text-muted-foreground">
        Need a brand-new word? Create it above — or manage the full bank in{' '}
        <Link href={'/admin/vocabulary' as '/'} className="text-green-700 underline-offset-2 hover:underline">
          Vocabulary
        </Link>
        .
      </p>
    </form>
  )
}

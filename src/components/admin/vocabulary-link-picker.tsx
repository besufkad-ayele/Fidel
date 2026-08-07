'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type VocabPickerOption = {
  id: string
  amharic: string
  english: string
  transliteration?: string | null
  audioSlow?: string | null
  audioNormal?: string | null
  audioNatural?: string | null
  /** True when linked to the editor’s current unit */
  assignedToUnit?: boolean
  /** Units this word belongs to (for grouping) */
  units?: { id: string; title: string }[]
}

type VocabularyLinkPickerProps = {
  options: VocabPickerOption[]
  selectedIds: string[]
  onChange: (vocabularyIds: string[]) => void
  /** Current unit id — section titled “This unit” */
  currentUnitId?: string
  currentUnitTitle?: string
  className?: string
}

type Group = {
  key: string
  title: string
  items: VocabPickerOption[]
  primary?: boolean
}

function buildGroups(
  options: VocabPickerOption[],
  currentUnitId?: string,
  currentUnitTitle?: string,
): Group[] {
  const thisUnit: VocabPickerOption[] = []
  const byOtherUnit = new Map<string, { title: string; items: VocabPickerOption[] }>()
  const unassigned: VocabPickerOption[] = []
  const seenInThisUnit = new Set<string>()

  for (const opt of options) {
    const units = opt.units ?? []
    const onCurrent =
      Boolean(currentUnitId) &&
      (opt.assignedToUnit || units.some((u) => u.id === currentUnitId))

    if (onCurrent) {
      thisUnit.push(opt)
      seenInThisUnit.add(opt.id)
      continue
    }

    if (units.length === 0) {
      unassigned.push(opt)
      continue
    }

    // Place under first other unit (word can appear once in picker)
    const primary = units.find((u) => u.id !== currentUnitId) ?? units[0]!
    const bucket = byOtherUnit.get(primary.id) ?? { title: primary.title, items: [] }
    bucket.items.push(opt)
    byOtherUnit.set(primary.id, bucket)
  }

  const groups: Group[] = []
  if (thisUnit.length > 0) {
    groups.push({
      key: 'this-unit',
      title: currentUnitTitle ? `This unit · ${currentUnitTitle}` : 'This unit',
      items: thisUnit,
      primary: true,
    })
  }

  const otherKeys = [...byOtherUnit.keys()].sort((a, b) =>
    (byOtherUnit.get(a)?.title ?? '').localeCompare(byOtherUnit.get(b)?.title ?? ''),
  )
  for (const key of otherKeys) {
    const bucket = byOtherUnit.get(key)!
    groups.push({
      key,
      title: bucket.title,
      items: bucket.items,
    })
  }

  if (unassigned.length > 0) {
    groups.push({
      key: 'unassigned',
      title: 'Level bank (not on a unit)',
      items: unassigned,
    })
  }

  return groups
}

/**
 * Unit-grouped vocabulary multi-select for flashcards / vocab sets / listening.
 */
export function VocabularyLinkPicker({
  options,
  selectedIds,
  onChange,
  currentUnitId,
  currentUnitTitle,
  className,
}: VocabularyLinkPickerProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((v) => {
      const hay = [v.amharic, v.english, v.transliteration ?? '', ...(v.units ?? []).map((u) => u.title)]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [options, query])

  const groups = useMemo(
    () => buildGroups(filtered, currentUnitId, currentUnitTitle),
    [filtered, currentUnitId, currentUnitTitle],
  )

  function toggle(id: string, checked: boolean) {
    onChange(checked ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  }

  function selectGroup(items: VocabPickerOption[]) {
    const ids = new Set(selectedIds)
    for (const item of items) ids.add(item.id)
    onChange([...ids])
  }

  function clearGroup(items: VocabPickerOption[]) {
    const drop = new Set(items.map((i) => i.id))
    onChange(selectedIds.filter((id) => !drop.has(id)))
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div>
        <Label>Link vocabulary</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Words are grouped by unit. Prefer selecting from this unit’s list.
        </p>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-green-500" />
        <Input
          className="h-9 pl-8"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search words or units…"
          aria-label="Search vocabulary"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {selectedIds.length} selected
        {filtered.length !== options.length ? ` · ${filtered.length} shown` : ''}
      </p>
      <div className="max-h-64 space-y-3 overflow-y-auto rounded-md border border-cream-300 bg-white p-2">
        {options.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted-foreground">
            No vocabulary yet. Create words on the unit vocabulary page first.
          </p>
        ) : groups.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted-foreground">
            No words match “{query.trim()}”.
          </p>
        ) : (
          groups.map((group) => {
            const selectedInGroup = group.items.filter((i) => selectedIds.includes(i.id)).length
            return (
              <div key={group.key} className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <p
                    className={cn(
                      'text-[11px] font-semibold tracking-wide uppercase',
                      group.primary ? 'text-gold-700' : 'text-green-600',
                    )}
                  >
                    {group.title}
                    <span className="ml-1 font-normal text-muted-foreground normal-case">
                      ({group.items.length})
                    </span>
                  </p>
                  <div className="flex gap-2 text-[11px]">
                    <button
                      type="button"
                      className="text-green-700 underline-offset-2 hover:underline"
                      onClick={() => selectGroup(group.items)}
                    >
                      Select all
                    </button>
                    {selectedInGroup > 0 ? (
                      <button
                        type="button"
                        className="text-muted-foreground underline-offset-2 hover:underline"
                        onClick={() => clearGroup(group.items)}
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-1">
                  {group.items.map((v) => {
                    const checked = selectedIds.includes(v.id)
                    const hasAudio = Boolean(v.audioSlow || v.audioNormal || v.audioNatural)
                    return (
                      <label
                        key={v.id}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-cream-50',
                          checked && 'bg-gold-50',
                        )}
                      >
                        <input
                          type="checkbox"
                          className="size-4 accent-green-800"
                          checked={checked}
                          onChange={() => toggle(v.id, checked)}
                        />
                        <span className="font-ethiopic text-green-950">{v.amharic}</span>
                        <span className="min-w-0 flex-1 truncate text-muted-foreground">
                          — {v.english}
                        </span>
                        {hasAudio ? (
                          <span className="rounded bg-gold-100 px-1 text-[10px] font-semibold text-gold-800 uppercase">
                            audio
                          </span>
                        ) : null}
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

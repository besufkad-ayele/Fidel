'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2, ChevronUp, ChevronDown, FileUp, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { upsertPartAction } from '@/app/(admin)/admin/content-actions'
import {
  deleteHomeworkAssignmentAction,
  resetHomeworkContentAction,
  setHomeworkStatusAction,
  upsertHomeworkContentAction,
} from '@/app/(admin)/admin/homework-actions'
import { uploadAdminHomeworkFileAction } from '@/app/(admin)/admin/media-upload-actions'
import { BlockRenderer } from '@/components/content/block-renderer'
import { AdminAudioField } from '@/components/admin/admin-audio-field'
import { AdminImageField } from '@/components/admin/admin-image-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmForm } from '@/components/admin/confirm-form'
import {
  BLOCK_CATALOG,
  createBlock,
  createEmptyPartContent,
  lessonPartContentSchema,
  normalizePartContent,
  sanitizePracticeContent,
  type ContentBlock,
  type ContentBlockType,
  type LessonPartContent,
  type LessonPartKey,
} from '@/lib/validation/content'
import {
  deletePartAction,
  resetPartContentAction,
  setPartStatusAction,
} from '@/app/(admin)/admin/content-actions'
import { lessonMediaPublicUrl } from '@/lib/media/urls'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'in_review', label: 'In review' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
] as const

type VocabOption = {
  id: string
  amharic: string
  english: string
  transliteration: string | null
  exampleAmharic?: string | null
  exampleEnglish?: string | null
  audioSlow?: string | null
  audioNormal?: string | null
  audioNatural?: string | null
  assignedToUnit?: boolean
}

type PartContentEditorProps = {
  unitId?: string
  part?: LessonPartKey
  partSlug?: string
  /** When set, editor saves to homework_assignments instead of lesson_parts. */
  assignmentId?: string
  initialContent: unknown
  initialStatus: string
  partExists: boolean
  vocabularyOptions: VocabOption[]
}

function emptyTableRow(cols: number) {
  return Array.from({ length: cols }, () => '')
}

function HomeworkAssignmentFileField({
  fileUrl,
  fileName,
  onChange,
}: {
  fileUrl: string
  fileName: string
  onChange: (next: { fileUrl: string; fileName: string }) => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const href = lessonMediaPublicUrl(fileUrl) ?? (fileUrl || null)

  function uploadFile(file: File) {
    setError(null)
    const fd = new FormData()
    fd.set('file', file)
    fd.set('label', 'assignment')
    startTransition(async () => {
      const result = await uploadAdminHomeworkFileAction(fd)
      if (!result.ok) {
        setError(result.error)
        return
      }
      onChange({ fileUrl: result.path, fileName: result.fileName })
    })
  }

  return (
    <div className="space-y-2">
      <Label>Assignment file (PDF or image)</Label>
      {fileUrl ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-cream-300 bg-white px-3 py-2 text-sm">
          <FileUp className="size-3.5 text-green-700" />
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="truncate font-medium text-green-800 underline-offset-2 hover:underline"
            >
              {fileName || 'Download file'}
            </a>
          ) : (
            <span className="truncate text-green-800">{fileName || fileUrl}</span>
          )}
          <button
            type="button"
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-danger-500"
            onClick={() => onChange({ fileUrl: '', fileName: '' })}
          >
            <Trash2 className="size-3" />
            Remove
          </button>
        </div>
      ) : (
        <Input
          type="file"
          accept=".pdf,image/jpeg,image/png,image/webp,image/gif"
          disabled={pending}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) uploadFile(file)
            e.target.value = ''
          }}
        />
      )}
      {pending ? (
        <p className="inline-flex items-center gap-1.5 text-xs text-green-700">
          <Loader2 className="size-3.5 animate-spin" />
          Uploading…
        </p>
      ) : null}
      {error ? <p className="text-xs text-danger-500">{error}</p> : null}
    </div>
  )
}

function TableBlockFields({
  block,
  onChange,
}: {
  block: Extract<ContentBlock, { type: 'table' }>
  onChange: (next: ContentBlock) => void
}) {
  const colCount = Math.max(block.headers.length, 1)
  const isFillable = block.variant === 'multi_row'

  function setHeaders(headers: string[]) {
    const cols = Math.max(headers.length, 1)
    onChange({
      ...block,
      headers,
      rows: block.rows.map((row) => {
        const next = [...row]
        while (next.length < cols) next.push('')
        return next.slice(0, cols)
      }),
    })
  }

  function setRows(rows: string[][]) {
    onChange({ ...block, rows })
  }

  function updateHeader(index: number, value: string) {
    const headers = [...block.headers]
    headers[index] = value
    setHeaders(headers)
  }

  function addColumn() {
    setHeaders([...block.headers, `Column ${block.headers.length + 1}`])
  }

  function removeColumn(index: number) {
    if (block.headers.length <= 1) return
    const headers = block.headers.filter((_, i) => i !== index)
    onChange({
      ...block,
      headers,
      rows: block.rows.map((row) => row.filter((_, i) => i !== index)),
    })
  }

  function updateCell(ri: number, ci: number, value: string) {
    setRows(
      block.rows.map((row, i) =>
        i === ri ? row.map((cell, j) => (j === ci ? value : cell)) : row,
      ),
    )
  }

  function addRow() {
    setRows([...block.rows, emptyTableRow(colCount)])
  }

  function removeRow(index: number) {
    if (block.rows.length <= 1 && !isFillable) return
    setRows(block.rows.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Table type</Label>
        <select
          className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={block.variant ?? 'static'}
          onChange={(e) =>
            onChange({
              ...block,
              variant: e.target.value as 'static' | 'multi_row',
            })
          }
        >
          <option value="static">Static (read-only, numbered)</option>
          <option value="multi_row">Fillable (fixed starters + students add rows)</option>
        </select>
      </div>

      <div>
        <Label>Title (optional)</Label>
        <Input
          className="mt-1.5"
          value={block.title ?? ''}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label>Columns</Label>
          <Button type="button" size="sm" variant="outline" onClick={addColumn}>
            <Plus className="mr-1 size-3.5" />
            Add column
          </Button>
        </div>
        <div className="space-y-2">
          {block.headers.map((header, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-center text-xs font-semibold text-green-600">
                {i + 1}
              </span>
              <Input
                value={header}
                placeholder={`Column ${i + 1} name`}
                onChange={(e) => updateHeader(i, e.target.value)}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={block.headers.length <= 1}
                onClick={() => removeColumn(i)}
                aria-label={`Remove column ${i + 1}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <Label>{isFillable ? 'Fixed starter rows' : 'Rows'}</Label>
            {isFillable ? (
              <p className="text-[11px] text-green-600">
                These stay locked for students. They can add empty rows below.
              </p>
            ) : (
              <p className="text-[11px] text-green-600">Numbered automatically for students.</p>
            )}
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addRow}>
            <Plus className="mr-1 size-3.5" />
            Add row
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-cream-300">
          <table className="w-full min-w-[280px] text-left text-sm">
            <thead className="bg-cream-100 text-green-800">
              <tr>
                <th className="w-8 px-2 py-1.5 text-center text-xs">#</th>
                {block.headers.map((h, i) => (
                  <th key={i} className="px-2 py-1.5 text-xs font-semibold">
                    {h || `Col ${i + 1}`}
                  </th>
                ))}
                <th className="w-10 px-1 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {block.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={block.headers.length + 2}
                    className="px-3 py-4 text-center text-xs text-green-600"
                  >
                    {isFillable
                      ? 'No fixed rows — students will start with empty rows they can add.'
                      : 'No rows yet. Click Add row.'}
                  </td>
                </tr>
              ) : (
                block.rows.map((row, ri) => (
                  <tr key={ri} className="border-t border-cream-200">
                    <td className="px-2 py-1 text-center text-xs font-semibold text-green-600">
                      {ri + 1}
                    </td>
                    {Array.from({ length: colCount }).map((_, ci) => (
                      <td key={ci} className="px-1 py-1">
                        <Input
                          className="h-8 min-w-[90px] text-xs"
                          value={row[ci] ?? ''}
                          placeholder={block.headers[ci] || `Col ${ci + 1}`}
                          onChange={(e) => updateCell(ri, ci, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="px-1 py-1 text-center">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={!isFillable && block.rows.length <= 1}
                        onClick={() => removeRow(ri)}
                        aria-label={`Remove row ${ri + 1}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFillable ? (
        <div>
          <Label>Max total rows (fixed + student-added)</Label>
          <Input
            type="number"
            className="mt-1.5"
            value={block.maxRows ?? 20}
            onChange={(e) => onChange({ ...block, maxRows: Number(e.target.value) || 20 })}
          />
        </div>
      ) : null}
    </div>
  )
}

function PracticeCategoriesEditor({
  categories,
  onChange,
  onRemoveCategory,
  sectionLabel,
}: {
  categories: { id: string; name: string }[]
  onChange: (categories: { id: string; name: string }[]) => void
  onRemoveCategory: (categoryId: string) => void
  sectionLabel: string
}) {
  const [draftName, setDraftName] = useState('')

  function addCategory() {
    const name = draftName.trim()
    if (!name) return
    onChange([...categories, { id: crypto.randomUUID(), name }])
    setDraftName('')
  }

  return (
    <div className="rounded-xl border border-cream-300 bg-cream-50 p-4">
      <div className="mb-3">
        <h3 className="font-display text-lg text-green-900">{sectionLabel} categories</h3>
        <p className="text-xs text-green-600">
          Create a category, then add and edit blocks inside that section below. Intro blocks stay
          above the tabs; category blocks appear under each tab.
        </p>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Input
          className="h-9 max-w-xs flex-1"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCategory()
            }
          }}
          placeholder="e.g. Writing, Speaking, Listening"
        />
        <Button type="button" size="sm" variant="outline" onClick={addCategory}>
          <Plus className="mr-1 size-3.5" />
          Add category
        </Button>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-green-600">
          No categories yet — all blocks show in one continuous page. Add a category to start
          section editing.
        </p>
      ) : (
        <ul className="space-y-2">
          {categories.map((cat, index) => (
            <li
              key={cat.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-cream-300 bg-white px-3 py-2"
            >
              <span className="w-6 text-center text-xs font-semibold text-muted-foreground">
                {index + 1}
              </span>
              <Input
                className="h-8 max-w-xs flex-1"
                value={cat.name}
                onChange={(e) =>
                  onChange(
                    categories.map((c) =>
                      c.id === cat.id ? { ...c, name: e.target.value } : c,
                    ),
                  )
                }
                aria-label={`Edit category ${index + 1} name`}
              />
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={index === 0}
                  aria-label={`Move category ${cat.name || 'untitled'} up`}
                  onClick={() => onChange(arrayMove(categories, index, index - 1))}
                >
                  <ChevronUp className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={index >= categories.length - 1}
                  aria-label={`Move category ${cat.name || 'untitled'} down`}
                  onClick={() => onChange(arrayMove(categories, index, index + 1))}
                >
                  <ChevronDown className="size-3.5" />
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onRemoveCategory(cat.id)
                }}
                aria-label={`Delete category ${cat.name || 'untitled'}`}
              >
                <Trash2 className="size-3.5" />
                <span className="ml-1 text-xs">Delete</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function insertBlockForCategory(
  blocks: ContentBlock[],
  next: ContentBlock,
  categoryId: string | null,
): ContentBlock[] {
  const block = { ...next, categoryId }
  if (!categoryId) {
    let lastIntro = -1
    blocks.forEach((b, i) => {
      if (!b.categoryId) lastIntro = i
    })
    if (lastIntro < 0) return [block, ...blocks]
    return [...blocks.slice(0, lastIntro + 1), block, ...blocks.slice(lastIntro + 1)]
  }

  let lastInCategory = -1
  blocks.forEach((b, i) => {
    if (b.categoryId === categoryId) lastInCategory = i
  })
  if (lastInCategory >= 0) {
    return [
      ...blocks.slice(0, lastInCategory + 1),
      block,
      ...blocks.slice(lastInCategory + 1),
    ]
  }
  return [...blocks, block]
}

function blockInSection(
  block: ContentBlock,
  categoryId: string | null,
  categoryIds: Set<string>,
): boolean {
  if (categoryId === null) {
    return !block.categoryId || !categoryIds.has(block.categoryId)
  }
  return block.categoryId === categoryId
}

/** Reorder blocks within one category/intro section without scrambling other sections. */
function reorderBlocksInSection(
  blocks: ContentBlock[],
  categoryId: string | null,
  categoryIds: Set<string>,
  activeId: string,
  overId: string,
): ContentBlock[] {
  const sectionBlocks = blocks.filter((b) => blockInSection(b, categoryId, categoryIds))
  const from = sectionBlocks.findIndex((b) => b.id === activeId)
  const to = sectionBlocks.findIndex((b) => b.id === overId)
  if (from < 0 || to < 0 || from === to) return blocks
  const reordered = arrayMove(sectionBlocks, from, to)
  let i = 0
  return blocks.map((b) =>
    blockInSection(b, categoryId, categoryIds) ? reordered[i++]! : b,
  )
}

function moveBlockInSection(
  blocks: ContentBlock[],
  categoryId: string | null,
  categoryIds: Set<string>,
  blockId: string,
  direction: -1 | 1,
): ContentBlock[] {
  const sectionBlocks = blocks.filter((b) => blockInSection(b, categoryId, categoryIds))
  const from = sectionBlocks.findIndex((b) => b.id === blockId)
  const to = from + direction
  if (from < 0 || to < 0 || to >= sectionBlocks.length) return blocks
  return reorderBlocksInSection(
    blocks,
    categoryId,
    categoryIds,
    blockId,
    sectionBlocks[to]!.id,
  )
}

function SortableBlock({
  block,
  children,
  onRemove,
  categories,
  onCategoryChange,
  sectionIndex,
  sectionTotal,
  onMoveInSection,
}: {
  block: ContentBlock
  children: React.ReactNode
  onRemove: () => void
  categories?: { id: string; name: string }[]
  onCategoryChange?: (categoryId: string | null) => void
  sectionIndex?: number
  sectionTotal?: number
  onMoveInSection?: (direction: -1 | 1) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  })
  const canReorder = typeof sectionIndex === 'number' && typeof sectionTotal === 'number' && onMoveInSection

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'rounded-xl border border-cream-300 bg-white shadow-sm',
        isDragging && 'opacity-80 ring-2 ring-gold-400',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream-200 px-3 py-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-green-700 uppercase"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4 text-green-500" />
          {block.type.replaceAll('_', ' ')}
          {block.type === 'table' && 'variant' in block
            ? block.variant === 'multi_row'
              ? ' · fillable'
              : ' · static'
            : null}
          <span className="font-normal normal-case text-muted-foreground">· drag to reorder</span>
        </button>
        <div className="flex items-center gap-2">
          {canReorder ? (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={sectionIndex === 0}
                aria-label="Move block up in this section"
                onClick={() => onMoveInSection(-1)}
              >
                <ChevronUp className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={sectionIndex >= sectionTotal - 1}
                aria-label="Move block down in this section"
                onClick={() => onMoveInSection(1)}
              >
                <ChevronDown className="size-3.5" />
              </Button>
            </div>
          ) : null}
          {categories && categories.length > 0 && onCategoryChange ? (
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              value={block.categoryId ?? ''}
              onChange={(e) => onCategoryChange(e.target.value || null)}
              aria-label="Practice category"
            >
              <option value="">Before categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || 'Untitled'}
                </option>
              ))}
            </select>
          ) : null}
          <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      <div className="space-y-3 p-3">{children}</div>
    </div>
  )
}

type DialogueLine = Extract<ContentBlock, { type: 'dialogue' }>['lines'][number]

function SortableDialogueLine({
  id,
  index,
  total,
  onMove,
  onRemove,
  children,
}: {
  id: string
  index: number
  total: number
  onMove: (from: number, to: number) => void
  onRemove: () => void
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'space-y-2 rounded-lg border border-cream-200 bg-cream-50/40 p-3',
        isDragging && 'opacity-80 ring-2 ring-gold-400',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-green-700 uppercase"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4 text-green-500" />
          Line {index + 1}
          <span className="font-normal normal-case text-muted-foreground">· drag to reorder</span>
        </button>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={index === 0}
            aria-label="Move line up"
            onClick={() => onMove(index, index - 1)}
          >
            <ChevronUp className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={index === total - 1}
            aria-label="Move line down"
            onClick={() => onMove(index, index + 1)}
          >
            <ChevronDown className="size-3.5" />
          </Button>
          <Button type="button" size="sm" variant="ghost" aria-label="Remove line" onClick={onRemove}>
            <Trash2 className="size-3.5 text-danger-500" />
          </Button>
        </div>
      </div>
      {children}
    </div>
  )
}

function ensureDialogueLines(lines: DialogueLine[]): DialogueLine[] {
  return lines.map((line) => ({
    ...line,
    id: line.id || crypto.randomUUID(),
  }))
}

function DialogueLinesEditor({
  block,
  onChange,
}: {
  block: Extract<ContentBlock, { type: 'dialogue' }>
  onChange: (next: ContentBlock) => void
}) {
  const lines = ensureDialogueLines(block.lines)
  const lineSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    const needsIds = block.lines.some((l) => !l.id)
    if (!needsIds) return
    onChange({ ...block, lines: ensureDialogueLines(block.lines) })
  }, [block, onChange])

  function setLines(next: DialogueLine[]) {
    onChange({ ...block, lines: next })
  }

  function updateLine(index: number, patch: Partial<DialogueLine>) {
    const next = [...lines]
    next[index] = { ...next[index], ...patch }
    setLines(next)
  }

  function moveLine(from: number, to: number) {
    if (to < 0 || to >= lines.length) return
    setLines(arrayMove(lines, from, to))
  }

  function onLineDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = lines.findIndex((l) => l.id === active.id)
    const newIndex = lines.findIndex((l) => l.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    setLines(arrayMove(lines, oldIndex, newIndex))
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Title</Label>
        <Input
          className="mt-1.5"
          value={block.title}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
        />
      </div>
      <div>
        <Label>Dialogue link (optional)</Label>
        <Input
          className="mt-1.5"
          placeholder="https://… (video, Drive, transcript)"
          value={block.url ?? ''}
          onChange={(e) => onChange({ ...block, url: e.target.value })}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Drag the grip handle or use ↑ ↓ to change line order.
      </p>

      <DndContext
        id={`dialogue-lines-${block.id}`}
        sensors={lineSensors}
        collisionDetection={closestCenter}
        onDragEnd={onLineDragEnd}
      >
        <SortableContext items={lines.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {lines.map((line, i) => (
              <SortableDialogueLine
                key={line.id}
                id={line.id}
                index={i}
                total={lines.length}
                onMove={moveLine}
                onRemove={() => setLines(lines.filter((_, idx) => idx !== i))}
              >
                <div>
                  <Label>Alignment</Label>
                  <select
                    className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={line.alignment ?? 'left'}
                    onChange={(e) =>
                      updateLine(i, { alignment: e.target.value as 'left' | 'right' })
                    }
                  >
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <Input
                  placeholder="Speaker"
                  value={line.speaker}
                  onChange={(e) => updateLine(i, { speaker: e.target.value })}
                />
                <AdminImageField
                  label="Person image"
                  folder="avatar"
                  levelId="ha"
                  clipLabel={`speaker-${line.speaker || i}`}
                  value={line.imageUrl ?? ''}
                  onChange={(next) => updateLine(i, { imageUrl: next })}
                  avatar
                />
                <Input
                  placeholder="Amharic"
                  className="font-ethiopic"
                  value={line.amharic}
                  onChange={(e) => updateLine(i, { amharic: e.target.value })}
                />
                <Input
                  placeholder="Transliteration"
                  value={line.transliteration ?? ''}
                  onChange={(e) => updateLine(i, { transliteration: e.target.value })}
                />
                <Input
                  placeholder="English"
                  value={line.english ?? ''}
                  onChange={(e) => updateLine(i, { english: e.target.value })}
                />
                <AdminAudioField
                  name={`dialogue-audio-${block.id}-${line.id}`}
                  label="Line audio"
                  folder="dialogue"
                  levelId="ha"
                  clipLabel={`line-${line.speaker || i}`}
                  value={line.audioUrl ?? ''}
                  onChange={(next) => updateLine(i, { audioUrl: next })}
                />
              </SortableDialogueLine>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() =>
          setLines([
            ...lines,
            {
              id: crypto.randomUUID(),
              speaker: '',
              alignment: 'left',
              imageUrl: '',
              amharic: '',
              transliteration: '',
              english: '',
              audioUrl: '',
            },
          ])
        }
      >
        Add line
      </Button>
    </div>
  )
}

type DialogueTableLine = Extract<ContentBlock, { type: 'dialogue_table' }>['lines'][number]

function resizeDialogueTableCells(
  cells: string[][],
  rowCount: number,
  colCount: number,
): string[][] {
  return Array.from({ length: rowCount }, (_, ri) =>
    Array.from({ length: colCount }, (_, ci) => cells[ri]?.[ci] ?? ''),
  )
}

function DialogueTableBlockFields({
  block,
  onChange,
}: {
  block: Extract<ContentBlock, { type: 'dialogue_table' }>
  onChange: (next: ContentBlock) => void
}) {
  const lines = block.lines
  const colCount = Math.max(block.columnHeaders.length, 1)
  const rowCount = Math.max(block.rowLabels.length, 1)
  const cells = resizeDialogueTableCells(block.cells ?? [], rowCount, colCount)

  function setLines(next: DialogueTableLine[]) {
    onChange({ ...block, lines: next })
  }

  function updateLine(index: number, patch: Partial<DialogueTableLine>) {
    const next = [...lines]
    next[index] = { ...next[index], ...patch }
    setLines(next)
  }

  function setColumns(columnHeaders: string[]) {
    const cols = Math.max(columnHeaders.length, 1)
    onChange({
      ...block,
      columnHeaders,
      cells: resizeDialogueTableCells(block.cells ?? [], rowCount, cols),
    })
  }

  function setRows(rowLabels: string[]) {
    const rows = Math.max(rowLabels.length, 1)
    onChange({
      ...block,
      rowLabels,
      cells: resizeDialogueTableCells(block.cells ?? [], rows, colCount),
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <Label>Title</Label>
        <Input
          className="mt-1.5"
          value={block.title ?? ''}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
        />
      </div>
      <div>
        <Label>Instructions</Label>
        <Textarea
          className="mt-1.5"
          rows={2}
          value={block.prompt ?? ''}
          onChange={(e) => onChange({ ...block, prompt: e.target.value })}
          placeholder="Read the texts. Optionally listen. Fill the table…"
        />
      </div>

      <div className="space-y-2 rounded-lg border border-cream-200 p-3">
        <Label>Full dialogue audio (optional)</Label>
        <p className="text-xs text-muted-foreground">
          Students can listen to the whole track before or while reading.
        </p>
        <AdminAudioField
          name={`dialogue-table-audio-${block.id}`}
          label="Audio file"
          folder="dialogue"
          levelId="ha"
          clipLabel="dialogue-table"
          value={block.audioUrl ?? ''}
          onChange={(next) => onChange({ ...block, audioUrl: next })}
        />
        <Input
          placeholder="Audio button label"
          value={block.audioLabel ?? ''}
          onChange={(e) => onChange({ ...block, audioLabel: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={block.showText !== false}
            onChange={(e) => onChange({ ...block, showText: e.target.checked })}
          />
          Show written texts by default (uncheck for listen-first exam mode)
        </label>
      </div>

      <div className="space-y-3">
        <Label>Introduction / dialogue lines</Label>
        {lines.map((line, i) => (
          <div key={line.id} className="space-y-2 rounded-lg border border-cream-200 p-3">
            <ListReorderControls
              index={i}
              total={lines.length}
              label={`Person / line ${i + 1}`}
              onMove={(from, to) => {
                if (to < 0 || to >= lines.length) return
                setLines(arrayMove(lines, from, to))
              }}
              onRemove={
                lines.length > 1
                  ? () => setLines(lines.filter((_, idx) => idx !== i))
                  : undefined
              }
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <Label className="text-xs">Alignment</Label>
                <select
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={line.alignment ?? (i % 2 === 0 ? 'left' : 'right')}
                  onChange={(e) =>
                    updateLine(i, { alignment: e.target.value as 'left' | 'right' })
                  }
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <Input
                placeholder="Speaker (A, Sara…)"
                value={line.speaker}
                onChange={(e) => updateLine(i, { speaker: e.target.value })}
              />
              <Input
                placeholder="Column key (optional, e.g. A)"
                value={line.columnKey ?? ''}
                onChange={(e) => updateLine(i, { columnKey: e.target.value })}
              />
            </div>
            <AdminImageField
              label="Person image"
              folder="avatar"
              levelId="ha"
              clipLabel={`dt-speaker-${line.speaker || i}`}
              value={line.imageUrl ?? ''}
              onChange={(next) => updateLine(i, { imageUrl: next })}
              avatar
            />
            <Input
              placeholder="Amharic text"
              className="font-ethiopic"
              value={line.amharic}
              onChange={(e) => updateLine(i, { amharic: e.target.value })}
            />
            <Input
              placeholder="Transliteration"
              value={line.transliteration ?? ''}
              onChange={(e) => updateLine(i, { transliteration: e.target.value })}
            />
            <Input
              placeholder="English"
              value={line.english ?? ''}
              onChange={(e) => updateLine(i, { english: e.target.value })}
            />
            <AdminAudioField
              name={`dialogue-table-line-${block.id}-${line.id}`}
              label="Line audio (optional)"
              folder="dialogue"
              levelId="ha"
              clipLabel={`dt-line-${line.speaker || i}`}
              value={line.audioUrl ?? ''}
              onChange={(next) => updateLine(i, { audioUrl: next })}
            />
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            setLines([
              ...lines,
              {
                id: crypto.randomUUID(),
                speaker: String.fromCharCode(65 + lines.length),
                alignment: lines.length % 2 === 0 ? 'left' : 'right',
                columnKey: String.fromCharCode(65 + lines.length),
                imageUrl: '',
                amharic: '',
                transliteration: '',
                english: '',
                audioUrl: '',
              },
            ])
          }
        >
          Add person / line
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label>Table columns (people)</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setColumns([...block.columnHeaders, `Col ${colCount + 1}`])}
          >
            <Plus className="mr-1 size-3.5" />
            Column
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {block.columnHeaders.map((h, i) => (
            <div key={i} className="flex items-center gap-1">
              <Input
                className="w-28"
                value={h}
                onChange={(e) => {
                  const next = [...block.columnHeaders]
                  next[i] = e.target.value
                  setColumns(next)
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={block.columnHeaders.length <= 1}
                aria-label="Remove column"
                onClick={() => setColumns(block.columnHeaders.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="size-3.5 text-danger-500" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Label>Table rows (info fields)</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setRows([...block.rowLabels, `Row ${rowCount + 1}`])}
          >
            <Plus className="mr-1 size-3.5" />
            Row
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {block.rowLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-1">
              <Input
                className="w-36"
                value={label}
                onChange={(e) => {
                  const next = [...block.rowLabels]
                  next[i] = e.target.value
                  setRows(next)
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={block.rowLabels.length <= 1}
                aria-label="Remove row"
                onClick={() => setRows(block.rowLabels.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="size-3.5 text-danger-500" />
              </Button>
            </div>
          ))}
        </div>

        <div>
          <Label>Prefill cells (optional)</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Leave empty for students to fill. Non-empty values are shown locked as hints.
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-cream-200">
            <table className="w-full min-w-[320px] text-sm">
              <thead className="bg-cream-100">
                <tr>
                  <th className="px-2 py-1.5" />
                  {block.columnHeaders.map((h, i) => (
                    <th key={i} className="px-2 py-1.5 font-medium">
                      {h || `Col ${i + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rowLabels.map((label, ri) => (
                  <tr key={ri} className="border-t border-cream-200">
                    <th className="whitespace-nowrap px-2 py-1.5 text-left font-medium">
                      {label || `Row ${ri + 1}`}
                    </th>
                    {block.columnHeaders.map((_, ci) => (
                      <td key={ci} className="px-1 py-1">
                        <Input
                          className="h-8 min-w-[72px]"
                          value={cells[ri]?.[ci] ?? ''}
                          onChange={(e) => {
                            const next = resizeDialogueTableCells(cells, rowCount, colCount)
                            next[ri][ci] = e.target.value
                            onChange({ ...block, cells: next })
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function updateBlock(
  blocks: ContentBlock[],
  id: string,
  next: ContentBlock,
): ContentBlock[] {
  return blocks.map((b) => (b.id === id ? next : b))
}

function ListReorderControls({
  index,
  total,
  onMove,
  onRemove,
  label,
}: {
  index: number
  total: number
  onMove: (from: number, to: number) => void
  onRemove?: () => void
  label: string
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-semibold tracking-wide text-green-700 uppercase">{label}</p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={index === 0}
          aria-label="Move up"
          onClick={() => onMove(index, index - 1)}
        >
          <ChevronUp className="size-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={index >= total - 1}
          aria-label="Move down"
          onClick={() => onMove(index, index + 1)}
        >
          <ChevronDown className="size-3.5" />
        </Button>
        {onRemove ? (
          <Button type="button" size="sm" variant="ghost" aria-label="Remove" onClick={onRemove}>
            <Trash2 className="size-3.5 text-danger-500" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function createSharedTemplateBlocks(kind: 'lesson' | 'practice'): ContentBlock[] {
  const heading = createBlock('heading')
  const intro = createBlock('rich_text')
  const teacher = createBlock('teacher_note')
  const objectives = createBlock('objectives')
  const dialogue = createBlock('dialogue')
  const dialogueTable = createBlock('dialogue_table')
  const vocab = createBlock('vocabulary_set')
  const example = createBlock('callout')
  const table = createBlock('table', { tableVariant: 'static' })
  const fill = createBlock('fill_blank')
  const mcq = createBlock('multiple_choice')
  const matching = createBlock('matching_cards')
  const listening = createBlock('listening_practice')
  const speaking = createBlock('speaking_task')
  const video = createBlock('video_practice')
  const homework = createBlock('homework_prompt')
  const refs = createBlock('references')
  const dos = createBlock('dos_donts')

  if (
    heading.type !== 'heading' ||
    intro.type !== 'rich_text' ||
    teacher.type !== 'teacher_note' ||
    objectives.type !== 'objectives' ||
    dialogue.type !== 'dialogue' ||
    dialogueTable.type !== 'dialogue_table' ||
    vocab.type !== 'vocabulary_set' ||
    example.type !== 'callout' ||
    table.type !== 'table' ||
    fill.type !== 'fill_blank' ||
    mcq.type !== 'multiple_choice' ||
    matching.type !== 'matching_cards' ||
    listening.type !== 'listening_practice' ||
    speaking.type !== 'speaking_task' ||
    video.type !== 'video_practice' ||
    homework.type !== 'homework_prompt' ||
    refs.type !== 'references' ||
    dos.type !== 'dos_donts'
  ) {
    return []
  }

  return [
    {
      ...heading,
      text: kind === 'practice' ? 'Practice template' : 'Lesson template',
    },
    {
      ...intro,
      markdown:
        kind === 'practice'
          ? 'Instructions: complete the teaching sections and exercises below.'
          : '## Overview\nAdd teaching content, then practice activities as needed.',
    },
    {
      ...teacher,
      title: 'Teaching note',
      body: 'Private guidance for instructors (hidden from students unless enabled).',
      visibleToStudents: false,
    },
    { ...objectives, items: ['Objective 1', 'Objective 2'] },
    {
      ...example,
      variant: 'example',
      title: 'Example',
      body: 'Show a sample phrase or pattern here.',
    },
    dialogue,
    ...(kind === 'practice' ? [dialogueTable] : []),
    { ...vocab, title: 'Core vocabulary' },
    {
      ...table,
      title: 'Pattern / grammar',
      headers: ['Amharic', 'Meaning'],
      rows: [['', '']],
    },
    {
      ...dos,
      dos: ['Model the dialogue slowly first'],
      donts: ['Don’t skip correction of key sounds'],
    },
    {
      ...fill,
      title: 'Fill in the blank',
      prompt: 'Drag a word from the list into each answer slot, then submit & check.',
      wordBank: ['ሰላም', 'ደህና ነኝ', 'አመሰግናለሁ'],
      items: [
        { id: crypto.randomUUID(), question: 'How do you say hello?', answer: 'ሰላም' },
        { id: crypto.randomUUID(), question: 'How do you say I am fine?', answer: 'ደህና ነኝ' },
      ],
    },
    {
      ...mcq,
      prompt: 'Choose the correct translation for ሰላም',
      options: [
        { id: crypto.randomUUID(), text: 'Hello / peace', correct: true },
        { id: crypto.randomUUID(), text: 'Thank you', correct: false },
      ],
      explanation: 'ሰላም means hello/peace.',
    },
    {
      ...matching,
      prompt: 'Match the pairs',
      pairs: [
        { left: 'ሰላም', right: 'Hello' },
        { left: 'አመሰግናለሁ', right: 'Thank you' },
      ],
    },
    { ...listening, title: 'Listening practice' },
    {
      ...speaking,
      prompt: 'Record yourself greeting a classmate',
      instructions: 'Speak clearly. Aim for 15–30 seconds.',
    },
    {
      ...video,
      prompt: 'Record a short video of yourself greeting someone',
      instructions: 'Face the camera and speak clearly.',
    },
    {
      ...homework,
      title: 'Homework submission',
      instructions:
        'Use the assignment link or file. For writing, paste a Drive link or upload a photo (max 1MB). Audio/video: record or upload.',
      assignmentLink: '',
      assignmentFileUrl: '',
      assignmentFileName: '',
      allowText: true,
      allowAudio: true,
      allowVideo: true,
      allowFiles: false,
      allowDriveLink: true,
      allowImage: true,
      maxAudioSeconds: 60,
      maxVideoSeconds: 90,
      maxImageBytes: 1_048_576,
    },
    {
      ...refs,
      items: [{ title: 'Optional reading', kind: 'article', url: '', imageUrl: '', note: '' }],
    },
  ]
}

function createPracticeTemplateBlocks(): ContentBlock[] {
  return createSharedTemplateBlocks('practice')
}

function createLessonTemplateBlocks(): ContentBlock[] {
  return createSharedTemplateBlocks('lesson')
}

function BlockFields({
  block,
  vocabularyOptions,
  onChange,
}: {
  block: ContentBlock
  vocabularyOptions: VocabOption[]
  onChange: (next: ContentBlock) => void
}) {
  switch (block.type) {
    case 'heading':
      return (
        <>
          <div>
            <Label>Text</Label>
            <Input
              className="mt-1.5"
              value={block.text}
              onChange={(e) => onChange({ ...block, text: e.target.value })}
            />
          </div>
          <div>
            <Label>Level</Label>
            <select
              className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={block.level}
              onChange={(e) =>
                onChange({ ...block, level: Number(e.target.value) as 2 | 3 })
              }
            >
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
          </div>
        </>
      )
    case 'rich_text':
      return (
        <div>
          <Label>Markdown</Label>
          <Textarea
            className="mt-1.5 min-h-[140px] font-mono text-sm"
            value={block.markdown}
            onChange={(e) => onChange({ ...block, markdown: e.target.value })}
            placeholder={
              '## Heading\n\nWrite with **bold**, *italic*, lists:\n\n- item one\n- item two\n\n[Link text](https://example.com)'
            }
          />
        </div>
      )
    case 'image':
      return (
        <>
          <AdminImageField
            label="Image"
            folder="lesson"
            levelId="ha"
            clipLabel="lesson-image"
            value={block.url ?? ''}
            onChange={(next) => onChange({ ...block, url: next })}
          />
          <div>
            <Label>Caption</Label>
            <Input
              className="mt-1.5"
              value={block.caption ?? ''}
              onChange={(e) => onChange({ ...block, caption: e.target.value })}
            />
          </div>
          <div>
            <Label>Alt text</Label>
            <Input
              className="mt-1.5"
              value={block.alt ?? ''}
              onChange={(e) => onChange({ ...block, alt: e.target.value })}
            />
          </div>
        </>
      )
    case 'video':
    case 'audio':
      return (
        <>
          {block.type === 'audio' ? (
            <AdminAudioField
              name={`audio-${block.id}`}
              label="Audio clip"
              folder="lesson"
              levelId="ha"
              clipLabel="lesson"
              value={block.url ?? ''}
              onChange={(next) => onChange({ ...block, url: next })}
            />
          ) : (
            <div>
              <Label>URL</Label>
              <Input
                className="mt-1.5"
                value={block.url ?? ''}
                onChange={(e) => onChange({ ...block, url: e.target.value })}
                placeholder="https://… or YouTube link"
              />
            </div>
          )}
          {'caption' in block ? (
            <div>
              <Label>Caption</Label>
              <Input
                className="mt-1.5"
                value={block.caption ?? ''}
                onChange={(e) => onChange({ ...block, caption: e.target.value })}
              />
            </div>
          ) : null}
          {'label' in block ? (
            <div>
              <Label>Label</Label>
              <Input
                className="mt-1.5"
                value={block.label ?? ''}
                onChange={(e) => onChange({ ...block, label: e.target.value })}
              />
            </div>
          ) : null}
        </>
      )
    case 'callout':
      return (
        <>
          <div>
            <Label>Variant</Label>
            <select
              className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={block.variant}
              onChange={(e) =>
                onChange({
                  ...block,
                  variant: e.target.value as
                    | 'tip'
                    | 'note'
                    | 'warning'
                    | 'example'
                    | 'teacher',
                })
              }
            >
              <option value="tip">Tip</option>
              <option value="note">Note</option>
              <option value="warning">Warning</option>
              <option value="example">Example</option>
              <option value="teacher">Teacher tip</option>
            </select>
          </div>
          <div>
            <Label>Title</Label>
            <Input
              className="mt-1.5"
              value={block.title ?? ''}
              onChange={(e) => onChange({ ...block, title: e.target.value })}
            />
          </div>
          <div>
            <Label>Body</Label>
            <Textarea
              className="mt-1.5"
              value={block.body}
              onChange={(e) => onChange({ ...block, body: e.target.value })}
            />
          </div>
        </>
      )
    case 'teacher_note':
      return (
        <>
          <div>
            <Label>Title</Label>
            <Input
              className="mt-1.5"
              value={block.title ?? ''}
              onChange={(e) => onChange({ ...block, title: e.target.value })}
              placeholder="Teaching note"
            />
          </div>
          <div>
            <Label>Guidance</Label>
            <Textarea
              className="mt-1.5 min-h-[100px]"
              value={block.body}
              onChange={(e) => onChange({ ...block, body: e.target.value })}
              placeholder="How to teach this section, common mistakes, pacing…"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={block.visibleToStudents}
              onChange={(e) =>
                onChange({ ...block, visibleToStudents: e.target.checked })
              }
            />
            Also show to students
          </label>
        </>
      )
    case 'dos_donts':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Do&apos;s (one per line)</Label>
            <Textarea
              className="mt-1.5 min-h-[120px]"
              value={block.dos.join('\n')}
              onChange={(e) => onChange({ ...block, dos: e.target.value.split('\n') })}
            />
          </div>
          <div>
            <Label>Don&apos;ts (one per line)</Label>
            <Textarea
              className="mt-1.5 min-h-[120px]"
              value={block.donts.join('\n')}
              onChange={(e) => onChange({ ...block, donts: e.target.value.split('\n') })}
            />
          </div>
        </div>
      )
    case 'why_matters':
      return (
        <div className="space-y-3">
          {block.items.map((item, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-cream-200 p-3">
              <ListReorderControls
                index={i}
                total={block.items.length}
                label={`Framing ${i + 1}`}
                onMove={(from, to) => {
                  if (to < 0 || to >= block.items.length) return
                  const items = [...block.items]
                  ;[items[from], items[to]] = [items[to], items[from]]
                  onChange({ ...block, items })
                }}
                onRemove={
                  block.items.length > 1
                    ? () =>
                        onChange({
                          ...block,
                          items: block.items.filter((_, idx) => idx !== i),
                        })
                    : undefined
                }
              />
              <Label>Persona</Label>
              <select
                className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={item.persona}
                onChange={(e) => {
                  const items = [...block.items]
                  items[i] = { ...item, persona: e.target.value as typeof item.persona }
                  onChange({ ...block, items })
                }}
              >
                {['default', 'diplomat', 'ngo', 'tourist', 'missionary', 'researcher', 'diaspora', 'other'].map(
                  (p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ),
                )}
              </select>
              <Label className="mt-2">Text</Label>
              <Textarea
                className="mt-1.5"
                value={item.text}
                onChange={(e) => {
                  const items = [...block.items]
                  items[i] = { ...item, text: e.target.value }
                  onChange({ ...block, items })
                }}
              />
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                ...block,
                items: [...block.items, { persona: 'default', text: '' }],
              })
            }
          >
            Add persona framing
          </Button>
        </div>
      )
    case 'table':
      return <TableBlockFields block={block} onChange={onChange} />
    case 'fill_blank':
      return (
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input
              className="mt-1.5"
              value={block.title ?? ''}
              onChange={(e) => onChange({ ...block, title: e.target.value })}
            />
          </div>
          <div>
            <Label>Prompt (optional)</Label>
            <Input
              className="mt-1.5"
              value={block.prompt ?? ''}
              onChange={(e) => onChange({ ...block, prompt: e.target.value })}
              placeholder="Use a word from the list."
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Max attempts</Label>
              <Input
                type="number"
                className="mt-1.5"
                min={1}
                max={10}
                value={block.maxAttempts ?? 2}
                onChange={(e) =>
                  onChange({ ...block, maxAttempts: Math.max(1, Number(e.target.value) || 2) })
                }
              />
            </div>
            <label className="mt-7 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={block.allowRetake ?? false}
                onChange={(e) => onChange({ ...block, allowRetake: e.target.checked })}
              />
              Allow retake after final attempt
            </label>
          </div>
          <div>
            <Label>Word list (one per line — shown above questions)</Label>
            <Textarea
              className="mt-1.5 min-h-[80px] font-mono text-xs"
              value={block.wordBank.join('\n')}
              onChange={(e) =>
                onChange({
                  ...block,
                  wordBank: e.target.value.split('\n').map((s) => s.trim()),
                })
              }
              placeholder={'ሰላም\nደህና ነኝ'}
            />
          </div>
          <div className="space-y-2">
            <Label>Questions</Label>
            {block.items.map((item, i) => (
              <div key={item.id} className="space-y-2 rounded-lg border border-cream-200 p-3">
                <ListReorderControls
                  index={i}
                  total={block.items.length}
                  label={`Question ${i + 1}`}
                  onMove={(from, to) => {
                    if (to < 0 || to >= block.items.length) return
                    onChange({ ...block, items: arrayMove(block.items, from, to) })
                  }}
                  onRemove={
                    block.items.length > 1
                      ? () =>
                          onChange({
                            ...block,
                            items: block.items.filter((_, idx) => idx !== i),
                          })
                      : undefined
                  }
                />
                <Input
                  placeholder="Question"
                  value={item.question}
                  onChange={(e) => {
                    const items = [...block.items]
                    items[i] = { ...item, question: e.target.value }
                    onChange({ ...block, items })
                  }}
                />
                <Input
                  placeholder="Correct answer"
                  value={item.answer}
                  onChange={(e) => {
                    const items = [...block.items]
                    items[i] = { ...item, answer: e.target.value }
                    onChange({ ...block, items })
                  }}
                />
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                onChange({
                  ...block,
                  items: [
                    ...block.items,
                    { id: crypto.randomUUID(), question: '', answer: '' },
                  ],
                })
              }
            >
              Add question
            </Button>
          </div>
        </div>
      )
    case 'meaning_fill':
      return (
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input
              className="mt-1.5"
              value={block.title ?? ''}
              onChange={(e) => onChange({ ...block, title: e.target.value })}
            />
          </div>
          <div>
            <Label>Prompt (optional)</Label>
            <Input
              className="mt-1.5"
              value={block.prompt ?? ''}
              onChange={(e) => onChange({ ...block, prompt: e.target.value })}
              placeholder="Pick the Amharic that matches each English meaning."
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Max attempts</Label>
              <Input
                type="number"
                className="mt-1.5"
                min={1}
                max={10}
                value={block.maxAttempts ?? 2}
                onChange={(e) =>
                  onChange({ ...block, maxAttempts: Math.max(1, Number(e.target.value) || 2) })
                }
              />
            </div>
            <label className="mt-7 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={block.allowRetake ?? false}
                onChange={(e) => onChange({ ...block, allowRetake: e.target.checked })}
              />
              Allow retake after final attempt
            </label>
          </div>
          <div>
            <Label>Word list (one per line — shown at the top)</Label>
            <Textarea
              className="mt-1.5 min-h-[80px] font-mono text-xs"
              value={block.wordBank.join('\n')}
              onChange={(e) =>
                onChange({
                  ...block,
                  wordBank: e.target.value.split('\n').map((s) => s.trim()),
                })
              }
              placeholder={'እንደምን አደርክ\nእንደምን አደርሽ\nሰላም'}
            />
          </div>
          <div className="space-y-2">
            <Label>Meanings & answers</Label>
            {block.items.map((item, i) => (
              <div key={item.id} className="space-y-2 rounded-lg border border-cream-200 p-3">
                <ListReorderControls
                  index={i}
                  total={block.items.length}
                  label={`Item ${i + 1}`}
                  onMove={(from, to) => {
                    if (to < 0 || to >= block.items.length) return
                    onChange({ ...block, items: arrayMove(block.items, from, to) })
                  }}
                  onRemove={
                    block.items.length > 1
                      ? () =>
                          onChange({
                            ...block,
                            items: block.items.filter((_, idx) => idx !== i),
                          })
                      : undefined
                  }
                />
                <Input
                  placeholder="English meaning (e.g. Good morning for a male)"
                  value={item.meaning}
                  onChange={(e) => {
                    const items = [...block.items]
                    items[i] = { ...item, meaning: e.target.value }
                    onChange({ ...block, items })
                  }}
                />
                <Input
                  placeholder="Correct Amharic / answer from word list"
                  value={item.answer}
                  onChange={(e) => {
                    const items = [...block.items]
                    items[i] = { ...item, answer: e.target.value }
                    onChange({ ...block, items })
                  }}
                />
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                onChange({
                  ...block,
                  items: [
                    ...block.items,
                    { id: crypto.randomUUID(), meaning: '', answer: '' },
                  ],
                })
              }
            >
              Add meaning
            </Button>
          </div>
        </div>
      )
    case 'sentence_build':
      return (
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input
              className="mt-1.5"
              value={block.title ?? ''}
              onChange={(e) => onChange({ ...block, title: e.target.value })}
            />
          </div>
          <div>
            <Label>Prompt (optional)</Label>
            <Input
              className="mt-1.5"
              value={block.prompt ?? ''}
              onChange={(e) => onChange({ ...block, prompt: e.target.value })}
              placeholder="Drag the words into the correct order."
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Max attempts</Label>
              <Input
                type="number"
                className="mt-1.5"
                min={1}
                max={10}
                value={block.maxAttempts ?? 2}
                onChange={(e) =>
                  onChange({ ...block, maxAttempts: Math.max(1, Number(e.target.value) || 2) })
                }
              />
            </div>
            <label className="mt-7 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={block.allowRetake ?? false}
                onChange={(e) => onChange({ ...block, allowRetake: e.target.checked })}
              />
              Allow retake after final attempt
            </label>
          </div>
          <div className="space-y-2">
            <Label>Sentences</Label>
            {block.items.map((item, i) => (
              <div key={item.id} className="space-y-2 rounded-lg border border-cream-200 p-3">
                <ListReorderControls
                  index={i}
                  total={block.items.length}
                  label={`Sentence ${i + 1}`}
                  onMove={(from, to) => {
                    if (to < 0 || to >= block.items.length) return
                    onChange({ ...block, items: arrayMove(block.items, from, to) })
                  }}
                  onRemove={
                    block.items.length > 1
                      ? () =>
                          onChange({
                            ...block,
                            items: block.items.filter((_, idx) => idx !== i),
                          })
                      : undefined
                  }
                />
                <Input
                  placeholder="English hint / meaning (optional)"
                  value={item.hint ?? ''}
                  onChange={(e) => {
                    const items = [...block.items]
                    items[i] = { ...item, hint: e.target.value }
                    onChange({ ...block, items })
                  }}
                />
                <div>
                  <Label className="text-xs">Correct words in order (one per line)</Label>
                  <Textarea
                    className="mt-1.5 min-h-[72px] font-mono text-xs"
                    value={item.words.join('\n')}
                    onChange={(e) => {
                      const items = [...block.items]
                      items[i] = {
                        ...item,
                        words: e.target.value.split('\n').map((s) => s.trim()),
                      }
                      onChange({ ...block, items })
                    }}
                    placeholder={'እንዴት\nነህ'}
                  />
                </div>
                <div>
                  <Label className="text-xs">Distractors (optional, one per line)</Label>
                  <Textarea
                    className="mt-1.5 min-h-[56px] font-mono text-xs"
                    value={(item.distractors ?? []).join('\n')}
                    onChange={(e) => {
                      const items = [...block.items]
                      items[i] = {
                        ...item,
                        distractors: e.target.value.split('\n').map((s) => s.trim()),
                      }
                      onChange({ ...block, items })
                    }}
                    placeholder={'ነሽ\nነዎት'}
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                onChange({
                  ...block,
                  items: [
                    ...block.items,
                    {
                      id: crypto.randomUUID(),
                      hint: '',
                      words: ['', ''],
                      distractors: [],
                    },
                  ],
                })
              }
            >
              Add sentence
            </Button>
          </div>
        </div>
      )
    case 'id_card':
      return (
        <div className="space-y-3">
          <div>
            <Label>Card title</Label>
            <Input
              className="mt-1.5"
              value={block.title ?? ''}
              onChange={(e) => onChange({ ...block, title: e.target.value })}
              placeholder="Identity card"
            />
          </div>
          <div>
            <Label>Subtitle (optional)</Label>
            <Input
              className="mt-1.5"
              value={block.subtitle ?? ''}
              onChange={(e) => onChange({ ...block, subtitle: e.target.value })}
              placeholder="Fill in your details"
            />
          </div>
          <div>
            <Label>Prompt (optional)</Label>
            <Input
              className="mt-1.5"
              value={block.prompt ?? ''}
              onChange={(e) => onChange({ ...block, prompt: e.target.value })}
              placeholder="Write your answers in the blank spaces."
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={block.showPhotoSlot ?? true}
              onChange={(e) => onChange({ ...block, showPhotoSlot: e.target.checked })}
            />
            Show photo slot on the card
          </label>
          {block.showPhotoSlot ? (
            <AdminImageField
              label="ID card photo"
              folder="lesson"
              levelId="ha"
              clipLabel="id-card-photo"
              value={block.photoUrl ?? ''}
              onChange={(next) => onChange({ ...block, photoUrl: next })}
            />
          ) : null}
          <div className="space-y-2">
            <Label>Fields (label + blank for student)</Label>
            {block.fields.map((field, i) => (
              <div key={field.id} className="space-y-2 rounded-lg border border-cream-200 p-3">
                <ListReorderControls
                  index={i}
                  total={block.fields.length}
                  label={`Field ${i + 1}`}
                  onMove={(from, to) => {
                    if (to < 0 || to >= block.fields.length) return
                    onChange({ ...block, fields: arrayMove(block.fields, from, to) })
                  }}
                  onRemove={
                    block.fields.length > 1
                      ? () =>
                          onChange({
                            ...block,
                            fields: block.fields.filter((_, idx) => idx !== i),
                          })
                      : undefined
                  }
                />
                <Input
                  placeholder="Label (e.g. Name / ስም)"
                  value={field.label}
                  onChange={(e) => {
                    const fields = [...block.fields]
                    fields[i] = { ...field, label: e.target.value }
                    onChange({ ...block, fields })
                  }}
                />
                <Input
                  placeholder="Hint inside blank (optional)"
                  value={field.hint ?? ''}
                  onChange={(e) => {
                    const fields = [...block.fields]
                    fields[i] = { ...field, hint: e.target.value }
                    onChange({ ...block, fields })
                  }}
                />
                <div>
                  <Label className="text-xs">Blank lines</Label>
                  <Input
                    type="number"
                    className="mt-1.5 max-w-[6rem]"
                    min={1}
                    max={4}
                    value={field.lines ?? 1}
                    onChange={(e) => {
                      const fields = [...block.fields]
                      fields[i] = {
                        ...field,
                        lines: Math.min(4, Math.max(1, Number(e.target.value) || 1)),
                      }
                      onChange({ ...block, fields })
                    }}
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                onChange({
                  ...block,
                  fields: [
                    ...block.fields,
                    { id: crypto.randomUUID(), label: '', hint: '', lines: 1 },
                  ],
                })
              }
            >
              Add field
            </Button>
          </div>
        </div>
      )
    case 'dialogue_table':
      return <DialogueTableBlockFields block={block} onChange={onChange} />
    case 'references':
      return (
        <div className="space-y-3">
          {block.items.map((item, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-cream-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold tracking-wide text-green-700 uppercase">
                  Reference {i + 1}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={i === 0}
                    aria-label="Move up"
                    onClick={() => {
                      if (i === 0) return
                      const items = [...block.items]
                      ;[items[i - 1], items[i]] = [items[i], items[i - 1]]
                      onChange({ ...block, items })
                    }}
                  >
                    <ChevronUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={i === block.items.length - 1}
                    aria-label="Move down"
                    onClick={() => {
                      if (i >= block.items.length - 1) return
                      const items = [...block.items]
                      ;[items[i], items[i + 1]] = [items[i + 1], items[i]]
                      onChange({ ...block, items })
                    }}
                  >
                    <ChevronDown className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label="Remove reference"
                    onClick={() =>
                      onChange({
                        ...block,
                        items: block.items.filter((_, idx) => idx !== i),
                      })
                    }
                  >
                    <Trash2 className="size-3.5 text-danger-500" />
                  </Button>
                </div>
              </div>
              <Input
                placeholder="Title"
                value={item.title}
                onChange={(e) => {
                  const items = [...block.items]
                  items[i] = { ...item, title: e.target.value }
                  onChange({ ...block, items })
                }}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={item.kind}
                  onChange={(e) => {
                    const items = [...block.items]
                    items[i] = {
                      ...item,
                      kind: e.target.value as typeof item.kind,
                    }
                    onChange({ ...block, items })
                  }}
                >
                  <option value="article">Article</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="other">Other</option>
                </select>
                <Input
                  placeholder="https://…"
                  value={item.url ?? ''}
                  onChange={(e) => {
                    const items = [...block.items]
                    items[i] = { ...item, url: e.target.value }
                    onChange({ ...block, items })
                  }}
                />
              </div>
              {item.kind === 'article' ? (
                <AdminImageField
                  label="Article image (optional)"
                  folder="article"
                  levelId="ha"
                  clipLabel={`article-${i}`}
                  value={item.imageUrl ?? ''}
                  onChange={(next) => {
                    const items = [...block.items]
                    items[i] = { ...item, imageUrl: next }
                    onChange({ ...block, items })
                  }}
                />
              ) : null}
              <Input
                placeholder="Note (optional)"
                value={item.note ?? ''}
                onChange={(e) => {
                  const items = [...block.items]
                  items[i] = { ...item, note: e.target.value }
                  onChange({ ...block, items })
                }}
              />
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                ...block,
                items: [...block.items, { title: '', kind: 'article', url: '', imageUrl: '' }],
              })
            }
          >
            Add reference
          </Button>
        </div>
      )
    case 'objectives':
      return (
        <div className="space-y-3">
          <Label>Objectives</Label>
          {block.items.map((item, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-cream-200 p-3">
              <ListReorderControls
                index={i}
                total={block.items.length}
                label={`Objective ${i + 1}`}
                onMove={(from, to) => {
                  if (to < 0 || to >= block.items.length) return
                  onChange({ ...block, items: arrayMove(block.items, from, to) })
                }}
                onRemove={
                  block.items.length > 1
                    ? () =>
                        onChange({
                          ...block,
                          items: block.items.filter((_, idx) => idx !== i),
                        })
                    : undefined
                }
              />
              <Input
                value={item}
                onChange={(e) => {
                  const items = [...block.items]
                  items[i] = e.target.value
                  onChange({ ...block, items })
                }}
                placeholder="Learners will be able to…"
              />
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChange({ ...block, items: [...block.items, ''] })}
          >
            Add objective
          </Button>
        </div>
      )
    case 'dialogue':
      return (
        <DialogueLinesEditor
          block={block}
          onChange={onChange}
        />
      )
    case 'vocabulary_set':
    case 'flashcard_revision':
    case 'listening_practice':
      return (
        <div className="space-y-3">
          {'title' in block ? (
            <div>
              <Label>Title</Label>
              <Input
                className="mt-1.5"
                value={block.title ?? ''}
                onChange={(e) => onChange({ ...block, title: e.target.value })}
              />
            </div>
          ) : null}
          {block.type === 'listening_practice' ? (
            <div>
              <Label>Prompt</Label>
              <Input
                className="mt-1.5"
                value={block.prompt ?? ''}
                onChange={(e) => onChange({ ...block, prompt: e.target.value })}
              />
            </div>
          ) : null}
          <div>
            <Label>Link vocabulary</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Unit-assigned words appear first. Manage assignments on the unit vocabulary page.
            </p>
            <div className="mt-1.5 max-h-48 space-y-1 overflow-y-auto rounded-md border border-cream-300 p-2">
              {vocabularyOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No vocabulary yet. Create or assign words for this unit first.
                </p>
              ) : (
                vocabularyOptions.map((v) => {
                  const checked = block.vocabularyIds.includes(v.id)
                  const hasAudio = Boolean(v.audioSlow || v.audioNormal || v.audioNatural)
                  return (
                    <label key={v.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const vocabularyIds = checked
                            ? block.vocabularyIds.filter((id) => id !== v.id)
                            : [...block.vocabularyIds, v.id]
                          onChange({ ...block, vocabularyIds })
                        }}
                      />
                      <span className="font-ethiopic">{v.amharic}</span>
                      <span className="text-muted-foreground">— {v.english}</span>
                      {v.assignedToUnit ? (
                        <span className="rounded bg-green-100 px-1 text-[10px] font-semibold text-green-800 uppercase">
                          unit
                        </span>
                      ) : (
                        <span className="rounded bg-cream-200 px-1 text-[10px] font-semibold text-muted-foreground uppercase">
                          level
                        </span>
                      )}
                      {hasAudio ? (
                        <span className="rounded bg-gold-100 px-1 text-[10px] font-semibold text-gold-800 uppercase">
                          audio
                        </span>
                      ) : null}
                    </label>
                  )
                })
              )}
            </div>
          </div>
          {block.type === 'flashcard_revision' ? (
            <div>
              <Label>Custom cards (front | back | optional audio URL)</Label>
              <Textarea
                className="mt-1.5 font-mono text-xs"
                value={block.cards
                  .map((c) =>
                    [c.front, c.back, c.audioUrl].filter((x) => x !== undefined && x !== '').join(' | '),
                  )
                  .join('\n')}
                onChange={(e) =>
                  onChange({
                    ...block,
                    cards: e.target.value
                      .split('\n')
                      .filter(Boolean)
                      .map((line) => {
                        const [front, back, audioUrl] = line.split('|').map((s) => s.trim())
                        return {
                          front: front ?? '',
                          back: back ?? '',
                          audioUrl: audioUrl ?? '',
                        }
                      }),
                  })
                }
              />
            </div>
          ) : null}
          {block.type === 'listening_practice' ? (
            <div>
              <Label>Custom listening items (audioURL | correct | wrong1 | wrong2)</Label>
              <Textarea
                className="mt-1.5 font-mono text-xs"
                value={block.items
                  .map((item) =>
                    [item.audioUrl || item.speakText || '', ...item.options].join(' | '),
                  )
                  .join('\n')}
                onChange={(e) =>
                  onChange({
                    ...block,
                    items: e.target.value
                      .split('\n')
                      .filter(Boolean)
                      .map((line) => {
                        const parts = line.split('|').map((s) => s.trim())
                        const audioOrSpeak = parts[0] ?? ''
                        const options = parts.slice(1).filter(Boolean)
                        const isUrl = /^https?:\/\//i.test(audioOrSpeak)
                        return {
                          audioUrl: isUrl ? audioOrSpeak : '',
                          speakText: isUrl ? undefined : audioOrSpeak,
                          options: options.length >= 2 ? options : ['Option A', 'Option B'],
                          correctIndex: 0,
                          revealEnglish: options[0],
                        }
                      }),
                  })
                }
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                First option is treated as the correct answer. Prefer linking vocabulary with audio above.
              </p>
            </div>
          ) : null}
        </div>
      )
    case 'comprehension_check':
    case 'multiple_choice': {
      if (block.type === 'comprehension_check') {
        return (
          <>
            <div>
              <Label>Question</Label>
              <Input
                className="mt-1.5"
                value={block.question}
                onChange={(e) => onChange({ ...block, question: e.target.value })}
              />
            </div>
            <div>
              <Label>Options (one per line)</Label>
              <Textarea
                className="mt-1.5"
                value={block.options.join('\n')}
                onChange={(e) => onChange({ ...block, options: e.target.value.split('\n') })}
              />
            </div>
            <div>
              <Label>Correct option index (0-based)</Label>
              <Input
                type="number"
                className="mt-1.5"
                value={block.correctIndex}
                onChange={(e) =>
                  onChange({ ...block, correctIndex: Number(e.target.value) || 0 })
                }
              />
            </div>
          </>
        )
      }
      return (
        <>
          <div>
            <Label>Prompt</Label>
            <Input
              className="mt-1.5"
              value={block.prompt}
              onChange={(e) => onChange({ ...block, prompt: e.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Max attempts</Label>
              <Input
                type="number"
                className="mt-1.5"
                min={1}
                max={10}
                value={block.maxAttempts ?? 2}
                onChange={(e) =>
                  onChange({ ...block, maxAttempts: Math.max(1, Number(e.target.value) || 2) })
                }
              />
            </div>
            <label className="mt-7 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={block.allowRetake ?? false}
                onChange={(e) => onChange({ ...block, allowRetake: e.target.checked })}
              />
              Allow retake after final attempt
            </label>
          </div>
          <div className="space-y-2">
            <Label>Options</Label>
            {block.options.map((opt, i) => (
              <div key={opt.id} className="space-y-2 rounded-lg border border-cream-200 p-3">
                <ListReorderControls
                  index={i}
                  total={block.options.length}
                  label={`Option ${i + 1}`}
                  onMove={(from, to) => {
                    if (to < 0 || to >= block.options.length) return
                    onChange({ ...block, options: arrayMove(block.options, from, to) })
                  }}
                  onRemove={
                    block.options.length > 2
                      ? () =>
                          onChange({
                            ...block,
                            options: block.options.filter((_, idx) => idx !== i),
                          })
                      : undefined
                  }
                />
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${block.id}`}
                    checked={opt.correct}
                    onChange={() =>
                      onChange({
                        ...block,
                        options: block.options.map((o, j) => ({
                          ...o,
                          correct: j === i,
                        })),
                      })
                    }
                  />
                  <Input
                    value={opt.text}
                    onChange={(e) => {
                      const options = [...block.options]
                      options[i] = { ...opt, text: e.target.value }
                      onChange({ ...block, options })
                    }}
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                onChange({
                  ...block,
                  options: [
                    ...block.options,
                    { id: crypto.randomUUID(), text: '', correct: false },
                  ],
                })
              }
            >
              Add option
            </Button>
          </div>
          <div>
            <Label>Explanation</Label>
            <Textarea
              className="mt-1.5"
              value={block.explanation ?? ''}
              onChange={(e) => onChange({ ...block, explanation: e.target.value })}
            />
          </div>
        </>
      )
    }
    case 'matching_cards':
      return (
        <>
          <div>
            <Label>Prompt</Label>
            <Input
              className="mt-1.5"
              value={block.prompt ?? ''}
              onChange={(e) => onChange({ ...block, prompt: e.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Max attempts</Label>
              <Input
                type="number"
                className="mt-1.5"
                min={1}
                max={10}
                value={block.maxAttempts ?? 2}
                onChange={(e) =>
                  onChange({ ...block, maxAttempts: Math.max(1, Number(e.target.value) || 2) })
                }
              />
            </div>
            <label className="mt-7 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={block.allowRetake ?? false}
                onChange={(e) => onChange({ ...block, allowRetake: e.target.checked })}
              />
              Allow retake after final attempt
            </label>
          </div>
          <div className="space-y-2">
            <Label>Pairs</Label>
            {block.pairs.map((pair, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-cream-200 p-3">
                <ListReorderControls
                  index={i}
                  total={block.pairs.length}
                  label={`Pair ${i + 1}`}
                  onMove={(from, to) => {
                    if (to < 0 || to >= block.pairs.length) return
                    onChange({ ...block, pairs: arrayMove(block.pairs, from, to) })
                  }}
                  onRemove={
                    block.pairs.length > 1
                      ? () =>
                          onChange({
                            ...block,
                            pairs: block.pairs.filter((_, idx) => idx !== i),
                          })
                      : undefined
                  }
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Left"
                    value={pair.left}
                    onChange={(e) => {
                      const pairs = [...block.pairs]
                      pairs[i] = { ...pair, left: e.target.value }
                      onChange({ ...block, pairs })
                    }}
                  />
                  <Input
                    placeholder="Right"
                    value={pair.right}
                    onChange={(e) => {
                      const pairs = [...block.pairs]
                      pairs[i] = { ...pair, right: e.target.value }
                      onChange({ ...block, pairs })
                    }}
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                onChange({
                  ...block,
                  pairs: [...block.pairs, { left: '', right: '' }],
                })
              }
            >
              Add pair
            </Button>
          </div>
        </>
      )
    case 'speaking_task':
    case 'video_practice':
      return (
        <>
          <div>
            <Label>Prompt</Label>
            <Input
              className="mt-1.5"
              value={block.prompt}
              onChange={(e) => onChange({ ...block, prompt: e.target.value })}
            />
          </div>
          <div>
            <Label>Instructions</Label>
            <Textarea
              className="mt-1.5"
              value={block.instructions ?? ''}
              onChange={(e) => onChange({ ...block, instructions: e.target.value })}
            />
          </div>
          <div>
            <Label>Max seconds</Label>
            <Input
              type="number"
              className="mt-1.5"
              value={block.maxSeconds}
              onChange={(e) =>
                onChange({ ...block, maxSeconds: Number(e.target.value) || 60 })
              }
            />
          </div>
          {block.type === 'speaking_task' ? (
            <div>
              <Label>Min seconds</Label>
              <Input
                type="number"
                className="mt-1.5"
                value={block.minSeconds}
                onChange={(e) =>
                  onChange({ ...block, minSeconds: Number(e.target.value) || 0 })
                }
              />
            </div>
          ) : (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={block.required}
                onChange={(e) => onChange({ ...block, required: e.target.checked })}
              />
              Required
            </label>
          )}
        </>
      )
    case 'homework_prompt':
      return (
        <>
          <div>
            <Label>Title</Label>
            <Input
              className="mt-1.5"
              value={block.title}
              onChange={(e) => onChange({ ...block, title: e.target.value })}
            />
          </div>
          <div>
            <Label>Instructions</Label>
            <Textarea
              className="mt-1.5"
              value={block.instructions}
              onChange={(e) => onChange({ ...block, instructions: e.target.value })}
            />
          </div>

          <div className="space-y-2 rounded-lg border border-cream-300 bg-cream-50 p-3">
            <p className="text-xs font-semibold tracking-wide text-gold-700 uppercase">
              Assignment materials
            </p>
            <div>
              <Label>Assignment link</Label>
              <Input
                className="mt-1.5"
                type="url"
                placeholder="https://… (Drive, worksheet, etc.)"
                value={block.assignmentLink ?? ''}
                onChange={(e) => onChange({ ...block, assignmentLink: e.target.value })}
              />
            </div>
            <HomeworkAssignmentFileField
              fileUrl={block.assignmentFileUrl ?? ''}
              fileName={block.assignmentFileName ?? ''}
              onChange={({ fileUrl, fileName }) =>
                onChange({
                  ...block,
                  assignmentFileUrl: fileUrl,
                  assignmentFileName: fileName,
                })
              }
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ['allowText', 'Allow text answer'],
                ['allowAudio', 'Allow audio (record / upload)'],
                ['allowVideo', 'Allow video (record / upload)'],
                ['allowDriveLink', 'Writing: Drive link'],
                ['allowImage', 'Writing: image ≤1MB'],
                ['allowFiles', 'Allow PDF upload (student)'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={block[key]}
                  onChange={(e) => onChange({ ...block, [key]: e.target.checked })}
                />
                {label}
              </label>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Max audio seconds</Label>
              <Input
                type="number"
                className="mt-1.5"
                value={block.maxAudioSeconds ?? 60}
                onChange={(e) =>
                  onChange({ ...block, maxAudioSeconds: Number(e.target.value) || 60 })
                }
              />
            </div>
            <div>
              <Label>Max video seconds</Label>
              <Input
                type="number"
                className="mt-1.5"
                value={block.maxVideoSeconds ?? 90}
                onChange={(e) =>
                  onChange({ ...block, maxVideoSeconds: Number(e.target.value) || 90 })
                }
              />
            </div>
            <div>
              <Label>Max image (bytes)</Label>
              <Input
                type="number"
                className="mt-1.5"
                value={block.maxImageBytes ?? 1_048_576}
                onChange={(e) =>
                  onChange({
                    ...block,
                    maxImageBytes: Number(e.target.value) || 1_048_576,
                  })
                }
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Default 1048576 = 1MB</p>
            </div>
          </div>
        </>
      )
    case 'divider':
      return <p className="text-xs text-muted-foreground">Visual divider — no settings.</p>
    default:
      return null
  }
}

export function PartContentEditor({
  unitId,
  part: partProp,
  partSlug,
  assignmentId,
  initialContent,
  initialStatus,
  partExists,
  vocabularyOptions,
}: PartContentEditorProps) {
  const isHomework = Boolean(assignmentId)
  const part: LessonPartKey = partProp ?? 'practice'
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState(initialStatus)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [showPalette, setShowPalette] = useState(false)
  /** null = intro / before categories; string = category id */
  const [paletteCategoryId, setPaletteCategoryId] = useState<string | null>(null)
  const [doc, setDoc] = useState<LessonPartContent>(() =>
    normalizePartContent(part, initialContent),
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const catalog = useMemo(
    () =>
      isHomework
        ? BLOCK_CATALOG
        : BLOCK_CATALOG.filter(
            (item) => item.parts === 'all' || item.parts.includes(part),
          ),
    [isHomework, part],
  )

  const vocabLookup = useMemo(() => {
    const map: Record<
      string,
      VocabOption & {
        exampleAmharic?: string | null
        exampleEnglish?: string | null
        audioSlow?: string | null
        audioNormal?: string | null
        audioNatural?: string | null
      }
    > = {}
    for (const v of vocabularyOptions) map[v.id] = v
    return map
  }, [vocabularyOptions])

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setDoc((prev) => {
      const oldIndex = prev.blocks.findIndex((b) => b.id === active.id)
      const newIndex = prev.blocks.findIndex((b) => b.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return prev

      const activeBlock = prev.blocks[oldIndex]!
      const overBlock = prev.blocks[newIndex]!
      const categoryIds = new Set(
        prev.part === 'practice' || prev.part === 'language_lesson'
          ? (prev.categories ?? []).map((c) => c.id)
          : [],
      )

      const activeSectionId =
        activeBlock.categoryId && categoryIds.has(activeBlock.categoryId)
          ? activeBlock.categoryId
          : null
      const overSectionId =
        overBlock.categoryId && categoryIds.has(overBlock.categoryId)
          ? overBlock.categoryId
          : null

      // Same section: reorder only within that category / intro group.
      if (activeSectionId === overSectionId) {
        return {
          ...prev,
          blocks: reorderBlocksInSection(
            prev.blocks,
            activeSectionId,
            categoryIds,
            String(active.id),
            String(over.id),
          ),
        }
      }

      // Cross-section: move into the target section and place next to the drop target.
      const moved = prev.blocks.map((b) =>
        b.id === active.id ? { ...b, categoryId: overSectionId } : b,
      )
      const from = moved.findIndex((b) => b.id === active.id)
      const to = moved.findIndex((b) => b.id === over.id)
      if (from < 0 || to < 0) return { ...prev, blocks: moved }
      return { ...prev, blocks: arrayMove(moved, from, to) }
    })
  }

  function save(nextStatus = status) {
    setError(null)
    const sanitized = sanitizePracticeContent(doc)
    if (sanitized !== doc) setDoc(sanitized)
    const parsed = lessonPartContentSchema.safeParse(sanitized)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid content')
      return
    }

    startTransition(async () => {
      const fd = new FormData()
      fd.set('status', nextStatus)
      fd.set('content', JSON.stringify(parsed.data))
      fd.set('title', parsed.data.title ?? '')

      const result = isHomework && assignmentId
        ? (() => {
            fd.set('assignmentId', assignmentId)
            return upsertHomeworkContentAction(fd)
          })()
        : (() => {
            if (!unitId) return Promise.resolve({ ok: false as const, error: 'Missing unit' })
            fd.set('unitId', unitId)
            fd.set('part', part)
            return upsertPartAction(fd)
          })()

      const resolved = await result
      if (!resolved.ok) {
        setError(resolved.error ?? 'Save failed')
        return
      }
      setStatus(nextStatus)
      setSavedAt(new Date().toLocaleTimeString())
      router.refresh()
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[160px]">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" onClick={() => save()} disabled={pending}>
          {pending ? 'Saving…' : 'Save draft'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => save('published')}
        >
          Publish
        </Button>
        {status === 'published' ? (
          <form
            action={async () => {
              if (isHomework && assignmentId) {
                await setHomeworkStatusAction(assignmentId, 'draft')
              } else if (unitId) {
                await setPartStatusAction(unitId, part, 'draft')
              }
              setStatus('draft')
              router.refresh()
            }}
          >
            <Button type="submit" variant="ghost">
              Unpublish
            </Button>
          </form>
        ) : null}
        {savedAt ? <p className="text-xs text-muted-foreground">Saved {savedAt}</p> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>{isHomework ? 'Homework title' : 'Part title'}</Label>
          <Input
            className="mt-1.5"
            value={doc.title ?? ''}
            onChange={(e) => setDoc({ ...doc, title: e.target.value })}
          />
        </div>
        {doc.part === 'cultural_insight' ? (
          <div>
            <Label>Hook question</Label>
            <Input
              className="mt-1.5"
              value={doc.hookQuestion ?? ''}
              onChange={(e) =>
                setDoc({ ...doc, hookQuestion: e.target.value } as LessonPartContent)
              }
            />
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg text-green-900">Blocks</h3>
            <div className="flex flex-wrap items-center gap-2">
              {doc.part === 'language_lesson' || doc.part === 'practice' || doc.part === 'cultural_insight' ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setDoc((prev) => ({
                      ...prev,
                      blocks: [
                        ...prev.blocks,
                        ...createSharedTemplateBlocks(
                          prev.part === 'practice' ? 'practice' : 'lesson',
                        ),
                      ],
                    }))
                  }
                >
                  Add full template
                </Button>
              ) : null}
              {doc.part === 'language_lesson' ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setDoc((prev) => ({
                      ...prev,
                      blocks: [
                        ...prev.blocks,
                        {
                          ...createBlock('callout'),
                          type: 'callout',
                          variant: 'example',
                          title: 'Example',
                          body: '',
                        },
                        createBlock('rich_text'),
                      ],
                    }))
                  }
                >
                  Add example + markdown
                </Button>
              ) : null}
            </div>
          </div>

          {doc.part === 'practice' || doc.part === 'language_lesson' ? (
            <PracticeCategoriesEditor
              categories={doc.categories ?? []}
              sectionLabel={doc.part === 'practice' ? 'Practice' : 'Lesson'}
              onChange={(categories) =>
                setDoc((prev) => {
                  if (prev.part !== 'practice' && prev.part !== 'language_lesson') return prev
                  return { ...prev, categories }
                })
              }
              onRemoveCategory={(categoryId) =>
                setDoc((prev) => {
                  if (prev.part !== 'practice' && prev.part !== 'language_lesson') return prev
                  return sanitizePracticeContent({
                    ...prev,
                    categories: (prev.categories ?? []).filter((c) => c.id !== categoryId),
                    blocks: prev.blocks.map((b) =>
                      b.categoryId === categoryId ? { ...b, categoryId: null } : b,
                    ),
                  })
                })
              }
            />
          ) : null}

          {(() => {
            const supportsCategories =
              doc.part === 'practice' || doc.part === 'language_lesson'
            const categories = supportsCategories ? (doc.categories ?? []) : []
            const categoryIds = new Set(categories.map((c) => c.id))
            const introBlocks = doc.blocks.filter(
              (b) => !b.categoryId || !categoryIds.has(b.categoryId),
            )
            const sections: {
              key: string
              title: string
              categoryId: string | null
              blocks: ContentBlock[]
              editable?: boolean
            }[] =
              categories.length === 0
                ? [
                    {
                      key: 'all',
                      title: 'All blocks',
                      categoryId: null,
                      blocks: doc.blocks,
                    },
                  ]
                : [
                    {
                      key: 'intro',
                      title: 'Before categories',
                      categoryId: null,
                      blocks: introBlocks,
                    },
                    ...categories.map((cat) => ({
                      key: cat.id,
                      title: cat.name || 'Untitled category',
                      categoryId: cat.id as string | null,
                      blocks: doc.blocks.filter((b) => b.categoryId === cat.id),
                      editable: true,
                    })),
                  ]

            function openPalette(categoryId: string | null) {
              if (showPalette && paletteCategoryId === categoryId) {
                setShowPalette(false)
                return
              }
              setPaletteCategoryId(categoryId)
              setShowPalette(true)
            }

            function renderBlockCard(block: ContentBlock, sectionIndex: number, section: {
              categoryId: string | null
              blocks: ContentBlock[]
            }) {
              return (
                <SortableBlock
                  key={block.id}
                  block={block}
                  sectionIndex={sectionIndex}
                  sectionTotal={section.blocks.length}
                  onMoveInSection={(direction) =>
                    setDoc((prev) => ({
                      ...prev,
                      blocks: moveBlockInSection(
                        prev.blocks,
                        section.categoryId,
                        categoryIds,
                        block.id,
                        direction,
                      ),
                    }))
                  }
                  categories={supportsCategories ? categories : undefined}
                  onCategoryChange={
                    supportsCategories
                      ? (categoryId) =>
                          setDoc((prev) => ({
                            ...prev,
                            blocks: prev.blocks.map((b) =>
                              b.id === block.id ? { ...b, categoryId } : b,
                            ),
                          }))
                      : undefined
                  }
                  onRemove={() =>
                    setDoc((prev) => ({
                      ...prev,
                      blocks: prev.blocks.filter((b) => b.id !== block.id),
                    }))
                  }
                >
                  <BlockFields
                    block={block}
                    vocabularyOptions={vocabularyOptions}
                    onChange={(next) =>
                      setDoc((prev) => ({
                        ...prev,
                        blocks: updateBlock(prev.blocks, block.id, next),
                      }))
                    }
                  />
                </SortableBlock>
              )
            }

            return (
              <>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd}
                >
                  <div className="space-y-4">
                    {sections.map((section) => (
                      <section
                        key={section.key}
                        className="rounded-xl border border-cream-300 bg-cream-50/60 p-3"
                      >
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
                          <div className="min-w-0 flex-1">
                            {section.editable && section.categoryId ? (
                              <div className="space-y-1">
                                <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                                  Category section
                                </p>
                                <Input
                                  className="h-9 max-w-sm bg-white font-display text-base text-green-900"
                                  value={
                                    categories.find((c) => c.id === section.categoryId)?.name ??
                                    ''
                                  }
                                  onChange={(e) =>
                                    setDoc((prev) => {
                                      if (
                                        prev.part !== 'practice' &&
                                        prev.part !== 'language_lesson'
                                      ) {
                                        return prev
                                      }
                                      return {
                                        ...prev,
                                        categories: (prev.categories ?? []).map((c) =>
                                          c.id === section.categoryId
                                            ? { ...c, name: e.target.value }
                                            : c,
                                        ),
                                      }
                                    })
                                  }
                                  aria-label="Edit category name"
                                />
                              </div>
                            ) : (
                              <h4 className="font-display text-base text-green-900">
                                {section.title}
                              </h4>
                            )}
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {section.blocks.length} block
                              {section.blocks.length === 1 ? '' : 's'}
                              {section.blocks.length > 1
                                ? ' · drag or use arrows to reorder inside this section'
                                : section.editable
                                  ? " · edit this category's content below"
                                  : null}
                            </p>
                          </div>
                        </div>

                        <SortableContext
                          items={section.blocks.map((b) => b.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3">
                            {section.blocks.length === 0 ? (
                              <p className="rounded-lg border border-dashed border-cream-400 bg-white/70 px-3 py-4 text-sm text-muted-foreground">
                                No blocks in this section yet.
                              </p>
                            ) : (
                              section.blocks.map((block, sectionIndex) =>
                                renderBlockCard(block, sectionIndex, section),
                              )
                            )}
                          </div>
                        </SortableContext>

                        <div className="mt-3 space-y-2 border-t border-cream-300 pt-3">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-full border-dashed border-cream-400 bg-white"
                            onClick={() => openPalette(section.categoryId)}
                          >
                            <Plus className="mr-1 size-3.5" />
                            Add block
                            {section.editable ? ` to ${section.title || 'category'}` : ''}
                          </Button>

                          {showPalette && paletteCategoryId === section.categoryId ? (
                            <div className="grid gap-2 rounded-xl border border-cream-300 bg-white p-3 sm:grid-cols-2">
                              {catalog.map((item, i) => (
                                <button
                                  key={`${item.type}-${item.createOptions?.tableVariant ?? 'default'}-${i}`}
                                  type="button"
                                  className="rounded-lg border border-cream-300 bg-cream-50 px-3 py-2 text-left hover:border-gold-400"
                                  onClick={() => {
                                    setDoc((prev) => ({
                                      ...prev,
                                      blocks: insertBlockForCategory(
                                        prev.blocks,
                                        createBlock(
                                          item.type as ContentBlockType,
                                          item.createOptions,
                                        ),
                                        section.categoryId,
                                      ),
                                    }))
                                    setShowPalette(false)
                                  }}
                                >
                                  <p className="text-sm font-medium text-green-900">
                                    {item.label}
                                  </p>
                                  <p className="text-xs text-green-600">{item.description}</p>
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </section>
                    ))}
                  </div>
                </DndContext>
              </>
            )
          })()}
        </div>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-lg text-green-900">Student preview</h3>
            <span className="text-[11px] tracking-wide text-green-600 uppercase">Live</span>
          </div>
          <div className="max-h-[80vh] overflow-y-auto rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card">
            <BlockRenderer content={doc} vocabulary={vocabLookup} mode="preview" />
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-danger-500">{error}</p> : null}

      <div className="flex flex-wrap gap-2 border-t border-cream-300 pt-4">
        {isHomework && assignmentId ? (
          <>
            <ConfirmForm
              action={async () => {
                await resetHomeworkContentAction(assignmentId)
                setDoc(createEmptyPartContent('practice'))
                setStatus('draft')
                router.refresh()
              }}
              message="Reset this homework to the starter template?"
              label="Reset content"
              variant="outline"
            />
            <ConfirmForm
              action={async () => {
                await deleteHomeworkAssignmentAction(assignmentId)
                router.push('/admin/homework' as '/')
                router.refresh()
              }}
              message="Delete this homework assignment?"
              label="Delete homework"
            />
            <p className="w-full text-xs text-muted-foreground">
              Editor route: /admin/homework/{assignmentId}
            </p>
          </>
        ) : partExists && unitId ? (
          <>
            <ConfirmForm
              action={async () => {
                await resetPartContentAction(unitId, part)
                setDoc(createEmptyPartContent(part))
                setStatus('draft')
                router.refresh()
              }}
              message="Reset this part to the starter template?"
              label="Reset content"
              variant="outline"
            />
            <ConfirmForm
              action={async () => {
                await deletePartAction(unitId, part)
                router.push(`/admin/units/${unitId}`)
                router.refresh()
              }}
              message="Delete this lesson part row?"
              label="Delete part"
            />
            <p className="w-full text-xs text-muted-foreground">
              Editor route: /admin/units/{unitId}/parts/{partSlug}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No part row yet — Save will create it.</p>
        )}
      </div>
    </div>
  )
}

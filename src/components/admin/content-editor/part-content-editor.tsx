'use client'

import { useMemo, useState, useTransition } from 'react'
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
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { upsertPartAction } from '@/app/(admin)/admin/content-actions'
import { BlockRenderer } from '@/components/content/block-renderer'
import { AdminAudioField } from '@/components/admin/admin-audio-field'
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
}

type PartContentEditorProps = {
  unitId: string
  part: LessonPartKey
  partSlug: string
  initialContent: unknown
  initialStatus: string
  partExists: boolean
  vocabularyOptions: VocabOption[]
}

function SortableBlock({
  block,
  children,
  onRemove,
}: {
  block: ContentBlock
  children: React.ReactNode
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  })

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
      <div className="flex items-center justify-between border-b border-cream-200 px-3 py-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-green-700 uppercase"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4 text-green-500" />
          {block.type.replaceAll('_', ' ')}
        </button>
        <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      <div className="space-y-3 p-3">{children}</div>
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
            className="mt-1.5 min-h-[140px]"
            value={block.markdown}
            onChange={(e) => onChange({ ...block, markdown: e.target.value })}
            placeholder="Write the essay or explanation. Use blank lines between paragraphs."
          />
        </div>
      )
    case 'image':
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
                placeholder={block.type === 'video' ? 'https://… or YouTube link' : 'https://…'}
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
          {'alt' in block ? (
            <div>
              <Label>Alt text</Label>
              <Input
                className="mt-1.5"
                value={block.alt ?? ''}
                onChange={(e) => onChange({ ...block, alt: e.target.value })}
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
                  variant: e.target.value as 'tip' | 'note' | 'warning',
                })
              }
            >
              <option value="tip">Tip</option>
              <option value="note">Note</option>
              <option value="warning">Warning</option>
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
            <div key={i} className="rounded-lg border border-cream-200 p-3">
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
      return (
        <>
          <div>
            <Label>Headers (comma separated)</Label>
            <Input
              className="mt-1.5"
              value={block.headers.join(', ')}
              onChange={(e) =>
                onChange({
                  ...block,
                  headers: e.target.value.split(',').map((s) => s.trim()),
                })
              }
            />
          </div>
          <div>
            <Label>Rows (one row per line, cells with |)</Label>
            <Textarea
              className="mt-1.5 min-h-[120px] font-mono text-xs"
              value={block.rows.map((r) => r.join(' | ')).join('\n')}
              onChange={(e) =>
                onChange({
                  ...block,
                  rows: e.target.value
                    .split('\n')
                    .filter(Boolean)
                    .map((line) => line.split('|').map((c) => c.trim())),
                })
              }
            />
          </div>
        </>
      )
    case 'references':
      return (
        <div className="space-y-3">
          {block.items.map((item, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-cream-200 p-3">
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
                items: [...block.items, { title: '', kind: 'article', url: '' }],
              })
            }
          >
            Add reference
          </Button>
        </div>
      )
    case 'objectives':
      return (
        <div>
          <Label>Objectives (one per line)</Label>
          <Textarea
            className="mt-1.5"
            value={block.items.join('\n')}
            onChange={(e) => onChange({ ...block, items: e.target.value.split('\n') })}
          />
        </div>
      )
    case 'dialogue':
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
          {block.lines.map((line, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-cream-200 p-3">
              <Input
                placeholder="Speaker"
                value={line.speaker}
                onChange={(e) => {
                  const lines = [...block.lines]
                  lines[i] = { ...line, speaker: e.target.value }
                  onChange({ ...block, lines })
                }}
              />
              <Input
                placeholder="Amharic"
                className="font-ethiopic"
                value={line.amharic}
                onChange={(e) => {
                  const lines = [...block.lines]
                  lines[i] = { ...line, amharic: e.target.value }
                  onChange({ ...block, lines })
                }}
              />
              <Input
                placeholder="Transliteration"
                value={line.transliteration ?? ''}
                onChange={(e) => {
                  const lines = [...block.lines]
                  lines[i] = { ...line, transliteration: e.target.value }
                  onChange({ ...block, lines })
                }}
              />
              <Input
                placeholder="English"
                value={line.english ?? ''}
                onChange={(e) => {
                  const lines = [...block.lines]
                  lines[i] = { ...line, english: e.target.value }
                  onChange({ ...block, lines })
                }}
              />
              <AdminAudioField
                name={`dialogue-audio-${block.id}-${i}`}
                label="Line audio"
                folder="dialogue"
                levelId="ha"
                clipLabel={`line-${line.speaker || i}`}
                value={line.audioUrl ?? ''}
                onChange={(next) => {
                  const lines = [...block.lines]
                  lines[i] = { ...line, audioUrl: next }
                  onChange({ ...block, lines })
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
                lines: [
                  ...block.lines,
                  { speaker: '', amharic: '', transliteration: '', english: '', audioUrl: '' },
                ],
              })
            }
          >
            Add line
          </Button>
        </div>
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
            <div className="mt-1.5 max-h-40 space-y-1 overflow-y-auto rounded-md border border-cream-300 p-2">
              {vocabularyOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No vocabulary yet. Add words first.</p>
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
          <div className="space-y-2">
            <Label>Options</Label>
            {block.options.map((opt, i) => (
              <div key={opt.id} className="flex items-center gap-2">
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
          <div>
            <Label>Pairs (left | right per line)</Label>
            <Textarea
              className="mt-1.5 font-mono text-xs"
              value={block.pairs.map((p) => `${p.left} | ${p.right}`).join('\n')}
              onChange={(e) =>
                onChange({
                  ...block,
                  pairs: e.target.value
                    .split('\n')
                    .filter(Boolean)
                    .map((line) => {
                      const [left, ...rest] = line.split('|')
                      return { left: left.trim(), right: rest.join('|').trim() }
                    }),
                })
              }
            />
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
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ['allowText', 'Allow text'],
                ['allowAudio', 'Allow audio'],
                ['allowVideo', 'Allow video'],
                ['allowFiles', 'Allow files'],
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
          <div className="grid gap-3 sm:grid-cols-2">
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
                value={block.maxVideoSeconds ?? 60}
                onChange={(e) =>
                  onChange({ ...block, maxVideoSeconds: Number(e.target.value) || 60 })
                }
              />
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
  part,
  partSlug,
  initialContent,
  initialStatus,
  partExists,
  vocabularyOptions,
}: PartContentEditorProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState(initialStatus)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [showPalette, setShowPalette] = useState(false)
  const [doc, setDoc] = useState<LessonPartContent>(() =>
    normalizePartContent(part, initialContent),
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const catalog = useMemo(
    () =>
      BLOCK_CATALOG.filter(
        (item) => item.parts === 'all' || item.parts.includes(part),
      ),
    [part],
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
      return { ...prev, blocks: arrayMove(prev.blocks, oldIndex, newIndex) }
    })
  }

  function save(nextStatus = status) {
    setError(null)
    const parsed = lessonPartContentSchema.safeParse(doc)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid content')
      return
    }

    startTransition(async () => {
      const fd = new FormData()
      fd.set('unitId', unitId)
      fd.set('part', part)
      fd.set('status', nextStatus)
      fd.set('content', JSON.stringify(parsed.data))
      const result = await upsertPartAction(fd)
      if (!result.ok) {
        setError(result.error ?? 'Save failed')
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
              await setPartStatusAction(unitId, part, 'draft')
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
          <Label>Part title</Label>
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
            <Button type="button" size="sm" variant="outline" onClick={() => setShowPalette((v) => !v)}>
              <Plus className="mr-1 size-3.5" />
              Add block
            </Button>
          </div>

          {showPalette ? (
            <div className="grid gap-2 rounded-xl border border-cream-300 bg-cream-50 p-3 sm:grid-cols-2">
              {catalog.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  className="rounded-lg border border-cream-300 bg-white px-3 py-2 text-left hover:border-gold-400"
                  onClick={() => {
                    setDoc((prev) => ({
                      ...prev,
                      blocks: [...prev.blocks, createBlock(item.type as ContentBlockType)],
                    }))
                    setShowPalette(false)
                  }}
                >
                  <p className="text-sm font-medium text-green-900">{item.label}</p>
                  <p className="text-xs text-green-600">{item.description}</p>
                </button>
              ))}
            </div>
          ) : null}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={doc.blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {doc.blocks.map((block) => (
                  <SortableBlock
                    key={block.id}
                    block={block}
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
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
        {partExists ? (
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
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No part row yet — Save will create it.</p>
        )}
        <p className="w-full text-xs text-muted-foreground">
          Editor route: /admin/units/{unitId}/parts/{partSlug}
        </p>
      </div>
    </div>
  )
}

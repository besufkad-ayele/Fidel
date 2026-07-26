'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
import { Eye, EyeOff, GripVertical, Plus, Trash2 } from 'lucide-react'
import { createBlogPostAction } from '@/app/(admin)/admin/actions'
import { updateBlogPostAction } from '@/app/(admin)/admin/content-actions'
import { BlogArticleView } from '@/components/features/marketing/blog-article-view'
import { blogPublicUrl } from '@/lib/blog/media'
import {
  BLOG_BLOCK_CATALOG,
  createBlogBlock,
  type BlogBlock,
  type BlogBlockType,
} from '@/lib/blog/blocks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type BlogPostFormValues = {
  id?: string
  title?: string
  slug?: string
  excerpt?: string | null
  status?: string
  coverPath?: string | null
  coverAlt?: string | null
  tags?: string[]
  seoTitle?: string | null
  seoDescription?: string | null
  blocks?: BlogBlock[]
}

type Props = {
  mode: 'create' | 'edit'
  initial?: BlogPostFormValues
}

function SortableBlockShell({
  block,
  onRemove,
  children,
}: {
  block: BlogBlock
  onRemove: () => void
  children: React.ReactNode
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
        'rounded-xl border border-cream-300 bg-cream-50 shadow-card',
        isDragging && 'z-10 opacity-90 ring-2 ring-gold-400',
      )}
    >
      <div className="flex items-center justify-between border-b border-cream-300 px-3 py-2">
        <button
          type="button"
          className="inline-flex cursor-grab items-center gap-2 text-xs font-semibold tracking-wide text-green-700 uppercase active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4 text-gold-600" />
          {block.type.replaceAll('_', ' ')}
        </button>
        <Button type="button" size="sm" variant="ghost" onClick={onRemove} aria-label="Remove block">
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      <div className="space-y-3 p-3">{children}</div>
    </div>
  )
}

export function BlogPostForm({ mode, initial }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(true)

  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug))
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '')
  const [status, setStatus] = useState(initial?.status ?? 'draft')
  const [coverPath, setCoverPath] = useState(initial?.coverPath ?? '')
  const [coverAlt, setCoverAlt] = useState(initial?.coverAlt ?? '')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '))
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? '')
  const [blocks, setBlocks] = useState<BlogBlock[]>(
    initial?.blocks?.length ? initial.blocks : [createBlogBlock('rich_text')],
  )
  const [blockFiles, setBlockFiles] = useState<Record<string, File | null>>({})

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const coverPreview = useMemo(() => {
    if (coverFile) return URL.createObjectURL(coverFile)
    return blogPublicUrl(coverPath || null)
  }, [coverFile, coverPath])

  const previewBlocks = useMemo(() => {
    return blocks.map((block) => {
      if (block.type === 'image' && blockFiles[block.id]) {
        return {
          ...block,
          path: URL.createObjectURL(blockFiles[block.id]!),
        }
      }
      if (block.type === 'video' && blockFiles[block.id] && !block.url) {
        return {
          ...block,
          path: URL.createObjectURL(blockFiles[block.id]!),
        }
      }
      return block
    })
  }, [blocks, blockFiles])

  function onTitleChange(value: string) {
    setTitle(value)
    if (!slugTouched) {
      setSlug(
        value
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      )
    }
  }

  function updateBlock(id: string, next: BlogBlock) {
    setBlocks((rows) => rows.map((b) => (b.id === id ? next : b)))
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setBlocks((items) => {
      const oldIndex = items.findIndex((b) => b.id === active.id)
      const newIndex = items.findIndex((b) => b.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return items
      return arrayMove(items, oldIndex, newIndex)
    })
  }

  function addBlock(type: BlogBlockType) {
    setBlocks((rows) => [...rows, createBlogBlock(type)])
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData()
    if (mode === 'edit' && initial?.id) fd.set('id', initial.id)
    fd.set('title', title)
    fd.set('slug', slug)
    fd.set('excerpt', excerpt)
    fd.set('status', status)
    fd.set('coverPath', coverPath)
    fd.set('coverAlt', coverAlt)
    fd.set('tags', tags)
    fd.set('seoTitle', seoTitle)
    fd.set('seoDescription', seoDescription)
    fd.set('blocksJson', JSON.stringify(blocks))
    if (coverFile) fd.set('coverFile', coverFile)

    for (const [blockId, file] of Object.entries(blockFiles)) {
      if (file) fd.set(`file_${blockId}`, file)
    }

    for (const block of blocks) {
      if (block.type === 'gallery') {
        const input = document.getElementById(`galleryFiles_${block.id}`) as HTMLInputElement | null
        const files = input?.files
        if (files) {
          for (const file of Array.from(files)) {
            fd.append(`galleryFiles_${block.id}`, file)
          }
        }
      }
    }

    setError(null)
    startTransition(async () => {
      const result =
        mode === 'create' ? await createBlogPostAction(fd) : await updateBlogPostAction(fd)
      if (!result.ok) {
        setError(result.error ?? 'Save failed')
        return
      }
      if (mode === 'create' && result.id) {
        router.push(`/admin/blog/${result.id}`)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className={cn('gap-6', previewOpen ? 'xl:grid xl:grid-cols-[minmax(0,1fr)_420px]' : '')}>
      <form onSubmit={onSubmit} className="space-y-6" encType="multipart/form-data">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Drag blocks to set the public article order. Preview uses live Fidel colors.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen((open) => !open)}
          >
            {previewOpen ? (
              <>
                <EyeOff className="mr-1.5 size-4" />
                Close preview
              </>
            ) : (
              <>
                <Eye className="mr-1.5 size-4" />
                Open preview
              </>
            )}
          </Button>
        </div>

        <section className="space-y-4 rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card">
          <h2 className="font-display text-lg text-green-800">Basics</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                className="mt-1.5"
                required
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                className="mt-1.5 font-mono text-xs"
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(e.target.value)
                }}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="in_review">In review</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                className="mt-1.5"
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                className="mt-1.5"
                placeholder="culture, diplomats, greetings"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card">
          <h2 className="font-display text-lg text-green-800">Cover image</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="coverFile">Upload cover</Label>
              <Input
                id="coverFile"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-1.5"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div>
              <Label htmlFor="coverPath">Or cover path / URL</Label>
              <Input
                id="coverPath"
                className="mt-1.5 font-mono text-xs"
                value={coverPath}
                onChange={(e) => setCoverPath(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="coverAlt">Cover alt text</Label>
              <Input
                id="coverAlt"
                className="mt-1.5"
                value={coverAlt}
                onChange={(e) => setCoverAlt(e.target.value)}
              />
            </div>
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPreview}
                alt=""
                className="aspect-[16/9] w-full max-w-md rounded-lg border border-cream-300 object-cover sm:col-span-2"
              />
            ) : null}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg text-green-800">Content blocks</h2>
            <div className="flex flex-wrap gap-2">
              {BLOG_BLOCK_CATALOG.map((item) => (
                <Button
                  key={item.type}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addBlock(item.type)}
                >
                  <Plus className="mr-1 size-3.5" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {blocks.map((block) => (
                  <SortableBlockShell
                    key={block.id}
                    block={block}
                    onRemove={() => {
                      setBlocks((rows) => rows.filter((b) => b.id !== block.id))
                      setBlockFiles((files) => {
                        const next = { ...files }
                        delete next[block.id]
                        return next
                      })
                    }}
                  >
                    <BlockFields
                      block={block}
                      onChange={(next) => updateBlock(block.id, next)}
                      onFileChange={(file) =>
                        setBlockFiles((files) => ({ ...files, [block.id]: file }))
                      }
                    />
                  </SortableBlockShell>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>

        <section className="space-y-4 rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card">
          <h2 className="font-display text-lg text-green-800">SEO</h2>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="seoTitle">SEO title</Label>
              <Input
                id="seoTitle"
                className="mt-1.5"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="seoDescription">SEO description</Label>
              <Textarea
                id="seoDescription"
                className="mt-1.5"
                rows={2}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
              />
            </div>
          </div>
        </section>

        {error ? <p className="text-sm text-danger-500">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : mode === 'create' ? 'Create draft' : 'Save post'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/admin/blog')}>
            Back to list
          </Button>
        </div>
      </form>

      {previewOpen ? (
        <aside className="xl:sticky xl:top-4 xl:self-start">
          <div className="overflow-hidden rounded-2xl border border-cream-300 bg-cream-100 shadow-overlay">
            <div className="flex items-center justify-between border-b border-cream-300 bg-cream-50 px-4 py-3">
              <p className="text-xs font-semibold tracking-wide text-green-700 uppercase">
                Live preview
              </p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="xl:hidden"
                onClick={() => setPreviewOpen(false)}
              >
                Close
              </Button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto p-5 sm:p-6">
              <BlogArticleView
                compact
                showBackLink={false}
                post={{
                  title,
                  excerpt,
                  coverPath: coverPreview || coverPath || null,
                  coverAlt,
                  tags: tags
                    .split(/[,|]/)
                    .map((t) => t.trim())
                    .filter(Boolean),
                  blocks: previewBlocks,
                }}
                labels={{
                  eyebrow: 'From Fidel',
                  publishedOn: (date) => `Published ${date}`,
                  tagsLabel: 'Topics',
                  gallery: 'Images',
                  references: 'References',
                }}
              />
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  )
}

function BlockFields({
  block,
  onChange,
  onFileChange,
}: {
  block: BlogBlock
  onChange: (next: BlogBlock) => void
  onFileChange: (file: File | null) => void
}) {
  switch (block.type) {
    case 'rich_text':
      return (
        <div>
          <Label>Markdown</Label>
          <Textarea
            className="mt-1.5 font-mono text-xs"
            rows={8}
            value={block.markdown}
            onChange={(e) => onChange({ ...block, markdown: e.target.value })}
          />
        </div>
      )
    case 'image':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Upload image</Label>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="mt-1.5"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
          </div>
          <div>
            <Label>Path / URL</Label>
            <Input
              className="mt-1.5 font-mono text-xs"
              value={block.path}
              onChange={(e) => onChange({ ...block, path: e.target.value })}
            />
          </div>
          <div>
            <Label>Alt</Label>
            <Input
              className="mt-1.5"
              value={block.alt ?? ''}
              onChange={(e) => onChange({ ...block, alt: e.target.value })}
            />
          </div>
          <div>
            <Label>Caption</Label>
            <Input
              className="mt-1.5"
              value={block.caption ?? ''}
              onChange={(e) => onChange({ ...block, caption: e.target.value })}
            />
          </div>
        </div>
      )
    case 'video':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Embed URL</Label>
            <Input
              className="mt-1.5"
              value={block.url ?? ''}
              onChange={(e) => onChange({ ...block, url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=…"
            />
          </div>
          <div>
            <Label>Upload video</Label>
            <Input
              type="file"
              accept="video/mp4,video/webm"
              className="mt-1.5"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
          </div>
          <div>
            <Label>Path / URL</Label>
            <Input
              className="mt-1.5 font-mono text-xs"
              value={block.path ?? ''}
              onChange={(e) => onChange({ ...block, path: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Caption</Label>
            <Input
              className="mt-1.5"
              value={block.caption ?? ''}
              onChange={(e) => onChange({ ...block, caption: e.target.value })}
            />
          </div>
        </div>
      )
    case 'gallery':
      return (
        <div className="space-y-3">
          <div>
            <Label htmlFor={`galleryFiles_${block.id}`}>Upload images</Label>
            <Input
              id={`galleryFiles_${block.id}`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="mt-1.5"
            />
          </div>
          {block.items.map((item, index) => (
            <div key={`${item.path}-${index}`} className="grid gap-2 sm:grid-cols-3">
              <Input
                className="font-mono text-xs"
                value={item.path}
                onChange={(e) => {
                  const items = block.items.map((row, i) =>
                    i === index ? { ...row, path: e.target.value } : row,
                  )
                  onChange({ ...block, items })
                }}
                placeholder="path"
              />
              <Input
                value={item.alt ?? ''}
                onChange={(e) => {
                  const items = block.items.map((row, i) =>
                    i === index ? { ...row, alt: e.target.value } : row,
                  )
                  onChange({ ...block, items })
                }}
                placeholder="alt"
              />
              <div className="flex gap-2">
                <Input
                  value={item.caption ?? ''}
                  onChange={(e) => {
                    const items = block.items.map((row, i) =>
                      i === index ? { ...row, caption: e.target.value } : row,
                    )
                    onChange({ ...block, items })
                  }}
                  placeholder="caption"
                />
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() =>
                    onChange({
                      ...block,
                      items: block.items.filter((_, i) => i !== index),
                    })
                  }
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChange({ ...block, items: [...block.items, { path: '' }] })}
          >
            <Plus className="mr-1 size-3.5" />
            Add path row
          </Button>
        </div>
      )
    case 'references':
      return (
        <div className="space-y-3">
          {block.items.map((item, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <Input
                value={item.title}
                onChange={(e) => {
                  const items = block.items.map((row, i) =>
                    i === index ? { ...row, title: e.target.value } : row,
                  )
                  onChange({ ...block, items })
                }}
                placeholder="Title"
              />
              <Input
                value={item.url ?? ''}
                onChange={(e) => {
                  const items = block.items.map((row, i) =>
                    i === index ? { ...row, url: e.target.value } : row,
                  )
                  onChange({ ...block, items })
                }}
                placeholder="URL"
              />
              <Input
                value={item.note ?? ''}
                onChange={(e) => {
                  const items = block.items.map((row, i) =>
                    i === index ? { ...row, note: e.target.value } : row,
                  )
                  onChange({ ...block, items })
                }}
                placeholder="Note"
              />
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() =>
                  onChange({
                    ...block,
                    items:
                      block.items.length === 1
                        ? [{ title: '', url: '', note: '' }]
                        : block.items.filter((_, i) => i !== index),
                  })
                }
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                ...block,
                items: [...block.items, { title: '', url: '', note: '' }],
              })
            }
          >
            <Plus className="mr-1 size-3.5" />
            Add reference
          </Button>
        </div>
      )
    default:
      return null
  }
}

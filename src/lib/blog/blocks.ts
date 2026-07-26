import type { BlogGalleryItem, BlogReferenceLink } from '@/lib/blog/types'

export type BlogBlock =
  | { id: string; type: 'rich_text'; markdown: string }
  | {
      id: string
      type: 'image'
      path: string
      alt?: string
      caption?: string
    }
  | {
      id: string
      type: 'video'
      url?: string
      path?: string
      caption?: string
    }
  | { id: string; type: 'gallery'; items: BlogGalleryItem[] }
  | { id: string; type: 'references'; items: BlogReferenceLink[] }

export type BlogBlockType = BlogBlock['type']

export const BLOG_BLOCK_CATALOG: { type: BlogBlockType; label: string }[] = [
  { type: 'rich_text', label: 'Text' },
  { type: 'image', label: 'Image' },
  { type: 'video', label: 'Video' },
  { type: 'gallery', label: 'Gallery' },
  { type: 'references', label: 'References' },
]

export function newBlogBlockId() {
  return crypto.randomUUID()
}

export function createBlogBlock(type: BlogBlockType): BlogBlock {
  const id = newBlogBlockId()
  switch (type) {
    case 'rich_text':
      return { id, type, markdown: '' }
    case 'image':
      return { id, type, path: '', alt: '', caption: '' }
    case 'video':
      return { id, type, url: '', path: '', caption: '' }
    case 'gallery':
      return { id, type, items: [] }
    case 'references':
      return { id, type, items: [{ title: '', url: '', note: '' }] }
  }
}

function asGalleryItems(value: unknown): BlogGalleryItem[] {
  if (!Array.isArray(value)) return []
  const items: BlogGalleryItem[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const path = String((item as { path?: unknown }).path ?? '').trim()
    if (!path) continue
    items.push({
      path,
      alt: String((item as { alt?: unknown }).alt ?? '').trim() || undefined,
      caption: String((item as { caption?: unknown }).caption ?? '').trim() || undefined,
    })
  }
  return items
}

function asReferenceItems(value: unknown): BlogReferenceLink[] {
  if (!Array.isArray(value)) return []
  const items: BlogReferenceLink[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const title = String((item as { title?: unknown }).title ?? '').trim()
    if (!title) continue
    items.push({
      title,
      url: String((item as { url?: unknown }).url ?? '').trim() || undefined,
      note: String((item as { note?: unknown }).note ?? '').trim() || undefined,
    })
  }
  return items
}

export function normalizeBlogBlocks(value: unknown): BlogBlock[] {
  if (!Array.isArray(value)) return []
  const blocks: BlogBlock[] = []

  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue
    const type = String((raw as { type?: unknown }).type ?? '')
    const id = String((raw as { id?: unknown }).id ?? '').trim() || newBlogBlockId()

    if (type === 'rich_text') {
      blocks.push({
        id,
        type,
        markdown: String((raw as { markdown?: unknown }).markdown ?? ''),
      })
      continue
    }
    if (type === 'image') {
      blocks.push({
        id,
        type,
        path: String((raw as { path?: unknown }).path ?? '').trim(),
        alt: String((raw as { alt?: unknown }).alt ?? '').trim() || undefined,
        caption: String((raw as { caption?: unknown }).caption ?? '').trim() || undefined,
      })
      continue
    }
    if (type === 'video') {
      blocks.push({
        id,
        type,
        url: String((raw as { url?: unknown }).url ?? '').trim() || undefined,
        path: String((raw as { path?: unknown }).path ?? '').trim() || undefined,
        caption: String((raw as { caption?: unknown }).caption ?? '').trim() || undefined,
      })
      continue
    }
    if (type === 'gallery') {
      blocks.push({
        id,
        type,
        items: asGalleryItems((raw as { items?: unknown }).items),
      })
      continue
    }
    if (type === 'references') {
      blocks.push({
        id,
        type,
        items: asReferenceItems((raw as { items?: unknown }).items),
      })
    }
  }

  return blocks
}

/** Build blocks from legacy flat columns when `blocks` is empty. */
export function legacyBlocksFromPost(post: {
  body_md?: string | null
  video_url?: string | null
  video_path?: string | null
  video_caption?: string | null
  gallery?: unknown
  reference_links?: unknown
}): BlogBlock[] {
  const blocks: BlogBlock[] = []
  const body = String(post.body_md ?? '').trim()
  if (body) {
    blocks.push({ id: newBlogBlockId(), type: 'rich_text', markdown: body })
  }
  if (post.video_url || post.video_path) {
    blocks.push({
      id: newBlogBlockId(),
      type: 'video',
      url: post.video_url || undefined,
      path: post.video_path || undefined,
      caption: post.video_caption || undefined,
    })
  }
  const gallery = asGalleryItems(post.gallery)
  if (gallery.length > 0) {
    blocks.push({ id: newBlogBlockId(), type: 'gallery', items: gallery })
  }
  const refs = asReferenceItems(post.reference_links)
  if (refs.length > 0) {
    blocks.push({ id: newBlogBlockId(), type: 'references', items: refs })
  }
  return blocks
}

export function resolveBlogBlocks(
  blocks: unknown,
  legacy: {
    body_md?: string | null
    video_url?: string | null
    video_path?: string | null
    video_caption?: string | null
    gallery?: unknown
    reference_links?: unknown
  },
): BlogBlock[] {
  const normalized = normalizeBlogBlocks(blocks)
  if (normalized.length > 0) return normalized
  return legacyBlocksFromPost(legacy)
}

export function blocksToBodyMd(blocks: BlogBlock[]): string {
  return blocks
    .filter((b): b is Extract<BlogBlock, { type: 'rich_text' }> => b.type === 'rich_text')
    .map((b) => b.markdown)
    .join('\n\n')
}

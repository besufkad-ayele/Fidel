import { blocksToBodyMd, normalizeBlogBlocks, type BlogBlock } from '@/lib/blog/blocks'

export function slugifyBlog(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function parseTags(raw: string): string[] {
  return raw
    .split(/[,|]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20)
}

export function parseBlogFields(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  const slugInput = String(formData.get('slug') ?? '').trim()
  const slug = slugifyBlog(slugInput || title)
  const excerpt = String(formData.get('excerpt') ?? '').trim() || null
  const status = String(formData.get('status') ?? 'draft')
  const coverPath = String(formData.get('coverPath') ?? '').trim() || null
  const coverAlt = String(formData.get('coverAlt') ?? '').trim() || null
  const seoTitle = String(formData.get('seoTitle') ?? '').trim() || null
  const seoDescription = String(formData.get('seoDescription') ?? '').trim() || null
  const tags = parseTags(String(formData.get('tags') ?? ''))

  let blocks: BlogBlock[] = []
  try {
    blocks = normalizeBlogBlocks(JSON.parse(String(formData.get('blocksJson') ?? '[]')))
  } catch {
    blocks = []
  }

  const firstVideo = blocks.find((b) => b.type === 'video')
  const firstGallery = blocks.find((b) => b.type === 'gallery')
  const firstRefs = blocks.find((b) => b.type === 'references')

  return {
    title,
    slug,
    excerpt,
    status,
    coverPath,
    coverAlt,
    seoTitle,
    seoDescription,
    tags,
    blocks,
    bodyMd: blocksToBodyMd(blocks),
    videoUrl: firstVideo?.type === 'video' ? firstVideo.url || null : null,
    videoPath: firstVideo?.type === 'video' ? firstVideo.path || null : null,
    videoCaption: firstVideo?.type === 'video' ? firstVideo.caption || null : null,
    gallery: firstGallery?.type === 'gallery' ? firstGallery.items : [],
    referenceLinks: firstRefs?.type === 'references' ? firstRefs.items : [],
  }
}

import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { resolveBlogBlocks } from '@/lib/blog/blocks'
import type { BlogGalleryItem, BlogPost, BlogPostListItem, BlogReferenceLink } from '@/lib/blog/types'

function asGallery(value: unknown): BlogGalleryItem[] {
  if (!Array.isArray(value)) return []
  const items: BlogGalleryItem[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const path = String((item as { path?: unknown }).path ?? '').trim()
    if (!path) continue
    const alt = String((item as { alt?: unknown }).alt ?? '').trim() || undefined
    const caption = String((item as { caption?: unknown }).caption ?? '').trim() || undefined
    items.push({ path, alt, caption })
  }
  return items
}

function asReferences(value: unknown): BlogReferenceLink[] {
  if (!Array.isArray(value)) return []
  const links: BlogReferenceLink[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const title = String((item as { title?: unknown }).title ?? '').trim()
    if (!title) continue
    const url = String((item as { url?: unknown }).url ?? '').trim() || undefined
    const note = String((item as { note?: unknown }).note ?? '').trim() || undefined
    links.push({ title, url, note })
  }
  return links
}

function mapListItem(row: Record<string, unknown>): BlogPostListItem {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    excerpt: (row.excerpt as string | null) ?? null,
    cover_path: (row.cover_path as string | null) ?? null,
    cover_alt: (row.cover_alt as string | null) ?? null,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    published_at: (row.published_at as string | null) ?? null,
    updated_at: String(row.updated_at),
  }
}

function mapPost(row: Record<string, unknown>): BlogPost {
  const gallery = asGallery(row.gallery)
  const reference_links = asReferences(row.reference_links)
  return {
    ...mapListItem(row),
    body_md: String(row.body_md ?? ''),
    video_url: (row.video_url as string | null) ?? null,
    video_path: (row.video_path as string | null) ?? null,
    video_caption: (row.video_caption as string | null) ?? null,
    gallery,
    reference_links,
    blocks: resolveBlogBlocks(row.blocks, {
      body_md: row.body_md as string | null,
      video_url: row.video_url as string | null,
      video_path: row.video_path as string | null,
      video_caption: row.video_caption as string | null,
      gallery,
      reference_links,
    }),
    seo_title: (row.seo_title as string | null) ?? null,
    seo_description: (row.seo_description as string | null) ?? null,
    status: String(row.status ?? 'draft'),
    author_id: (row.author_id as string | null) ?? null,
    created_at: String(row.created_at),
  }
}

export async function getPublishedBlogPosts(): Promise<BlogPostListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_path, cover_alt, tags, published_at, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    console.error('[getPublishedBlogPosts]', error.message)
    return []
  }

  return ((data as unknown as Record<string, unknown>[]) ?? []).map(mapListItem)
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select(
      'id, slug, title, excerpt, body_md, cover_path, cover_alt, video_url, video_path, video_caption, gallery, reference_links, blocks, tags, published_at, updated_at, seo_title, seo_description, status, author_id, created_at',
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    console.error('[getPublishedBlogPostBySlug]', error.message)
    return null
  }
  if (!data) return null
  return mapPost(data as unknown as Record<string, unknown>)
}

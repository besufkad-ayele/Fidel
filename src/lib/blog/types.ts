export type BlogGalleryItem = {
  path: string
  alt?: string
  caption?: string
}

export type BlogReferenceLink = {
  title: string
  url?: string
  note?: string
}

export type BlogPostListItem = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_path: string | null
  cover_alt: string | null
  tags: string[]
  published_at: string | null
  updated_at: string
}

export type BlogPost = BlogPostListItem & {
  body_md: string
  video_url: string | null
  video_path: string | null
  video_caption: string | null
  gallery: BlogGalleryItem[]
  reference_links: BlogReferenceLink[]
  blocks: import('@/lib/blog/blocks').BlogBlock[]
  seo_title: string | null
  seo_description: string | null
  status: string
  author_id: string | null
  created_at: string
}

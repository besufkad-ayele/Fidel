import { publicEnv } from '@/lib/env'

const BLOG_BUCKET = 'blog'

export function blogPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^(https?:|blob:|data:)/i.test(path)) return path
  const base = publicEnv.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '')
  const clean = path.replace(/^\//, '')
  return `${base}/storage/v1/object/public/${BLOG_BUCKET}/${clean}`
}

/** Turn watch URLs into embeddable iframe src when possible. */
export function toEmbedVideoUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = parsed.searchParams.get('v')
      if (id) return `https://www.youtube.com/embed/${id}`
      const parts = parsed.pathname.split('/').filter(Boolean)
      if (parts[0] === 'embed' && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`
      if (parts[0] === 'shorts' && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`
    }

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      if (id) return `https://www.youtube.com/embed/${id}`
    }

    if (host === 'vimeo.com') {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`
    }
  } catch {
    return trimmed
  }

  return trimmed
}

export { BLOG_BUCKET }

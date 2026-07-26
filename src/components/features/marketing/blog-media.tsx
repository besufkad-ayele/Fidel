import { blogPublicUrl, toEmbedVideoUrl } from '@/lib/blog/media'
import type { BlogGalleryItem } from '@/lib/blog/types'

type CoverProps = {
  path: string | null
  alt?: string | null
  className?: string
}

export function BlogCoverImage({ path, alt, className }: CoverProps) {
  const src = blogPublicUrl(path)
  if (!src) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt || ''}
      className={className ?? 'aspect-[16/9] w-full object-cover'}
    />
  )
}

type VideoProps = {
  url?: string | null
  path?: string | null
  caption?: string | null
}

export function BlogVideo({ url, path, caption }: VideoProps) {
  const fileSrc = blogPublicUrl(path)
  const embedSrc = toEmbedVideoUrl(url)

  if (!fileSrc && !embedSrc) return null

  return (
    <figure className="space-y-2">
      <div className="aspect-video overflow-hidden rounded-2xl border border-cream-300 bg-green-950">
        {fileSrc ? (
          <video src={fileSrc} controls className="h-full w-full" preload="metadata">
            <track kind="captions" />
          </video>
        ) : (
          <iframe
            src={embedSrc!}
            title={caption || 'Video'}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
      {caption ? (
        <figcaption className="text-center text-sm text-green-700/60">{caption}</figcaption>
      ) : null}
    </figure>
  )
}

type GalleryProps = {
  items: BlogGalleryItem[]
  label: string
}

export function BlogGallery({ items, label }: GalleryProps) {
  if (items.length === 0) return null

  return (
    <section className="space-y-4">
      <h2 className="font-display text-2xl text-green-800">{label}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => {
          const src = blogPublicUrl(item.path)
          if (!src) return null
          return (
            <figure key={item.path} className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={item.alt || item.caption || ''}
                className="aspect-[4/3] w-full rounded-xl border border-cream-300 object-cover"
              />
              {item.caption ? (
                <figcaption className="text-sm text-green-700/60">{item.caption}</figcaption>
              ) : null}
            </figure>
          )
        })}
      </div>
    </section>
  )
}

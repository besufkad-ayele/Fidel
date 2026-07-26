import Link from 'next/link'
import { BlogMarkdown } from '@/components/features/marketing/blog-markdown'
import {
  BlogCoverImage,
  BlogGallery,
  BlogVideo,
} from '@/components/features/marketing/blog-media'
import type { BlogBlock } from '@/lib/blog/blocks'
import { routes } from '@/lib/auth/routes'
import { cn } from '@/lib/utils'

export type BlogArticleLabels = {
  eyebrow: string
  backToBlog?: string
  publishedOn: (date: string) => string
  tagsLabel: string
  gallery: string
  references: string
}

export type BlogArticleData = {
  title: string
  excerpt?: string | null
  coverPath?: string | null
  coverAlt?: string | null
  tags?: string[]
  publishedAt?: string | null
  blocks: BlogBlock[]
}

type Props = {
  post: BlogArticleData
  labels: BlogArticleLabels
  /** Hide back link in admin preview */
  showBackLink?: boolean
  className?: string
  compact?: boolean
}

export function BlogArticleView({
  post,
  labels,
  showBackLink = true,
  className,
  compact = false,
}: Props) {
  const tags = post.tags ?? []

  return (
    <article
      className={cn(
        'blog-article text-green-700',
        compact ? 'space-y-6' : 'space-y-0',
        className,
      )}
    >
      {showBackLink && labels.backToBlog ? (
        <Link
          href={routes.blog}
          className="inline-block text-sm font-semibold text-green-700 transition-colors hover:text-green-900"
        >
          ← {labels.backToBlog}
        </Link>
      ) : null}

      <header className={cn(showBackLink ? 'mt-6' : 'mt-0', 'space-y-4')}>
        <p className="text-xs font-bold tracking-[0.16em] text-gold-700 uppercase">
          {labels.eyebrow}
        </p>
        <h1
          className={cn(
            'font-display text-green-800',
            compact ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl',
          )}
        >
          {post.title || 'Untitled post'}
        </h1>
        {post.publishedAt ? (
          <time dateTime={post.publishedAt} className="block text-sm text-green-600">
            {labels.publishedOn(
              new Date(post.publishedAt).toLocaleDateString('en', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
            )}
          </time>
        ) : null}
        {post.excerpt ? (
          <p className="text-lg leading-relaxed text-green-700">{post.excerpt}</p>
        ) : null}
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-gold-300 bg-gold-50 px-3 py-1 text-xs font-medium text-gold-800"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      {post.coverPath ? (
        <div
          className={cn(
            'overflow-hidden rounded-2xl border border-cream-300 bg-cream-50 shadow-card',
            compact ? 'mt-6' : 'mt-10',
          )}
        >
          <BlogCoverImage
            path={post.coverPath}
            alt={post.coverAlt || post.title}
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      ) : null}

      <div className={cn('space-y-10', compact ? 'mt-6' : 'mt-10')}>
        {post.blocks.map((block) => (
          <BlogBlockView key={block.id} block={block} labels={labels} />
        ))}
      </div>
    </article>
  )
}

function BlogBlockView({
  block,
  labels,
}: {
  block: BlogBlock
  labels: BlogArticleLabels
}) {
  switch (block.type) {
    case 'rich_text':
      return block.markdown.trim() ? (
        <BlogMarkdown text={block.markdown} className="text-green-700" />
      ) : null
    case 'image': {
      if (!block.path) return null
      return (
        <figure className="space-y-2">
          <div className="overflow-hidden rounded-2xl border border-cream-300 bg-cream-50 shadow-card">
            <BlogCoverImage
              path={block.path}
              alt={block.alt || block.caption || ''}
              className="w-full object-cover"
            />
          </div>
          {block.caption ? (
            <figcaption className="text-center text-sm text-green-600">{block.caption}</figcaption>
          ) : null}
        </figure>
      )
    }
    case 'video':
      if (!block.url && !block.path) return null
      return <BlogVideo url={block.url} path={block.path} caption={block.caption} />
    case 'gallery':
      return block.items.length > 0 ? (
        <BlogGallery items={block.items} label={labels.gallery} />
      ) : null
    case 'references':
      if (block.items.length === 0) return null
      return (
        <section className="rounded-2xl border border-cream-300 bg-cream-50 p-6 shadow-card sm:p-8">
          <h2 className="font-display text-2xl text-green-800">{labels.references}</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-green-700">
            {block.items.map((ref, i) => (
              <li key={`${ref.title}-${i}`}>
                {ref.url ? (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-green-800 underline decoration-gold-500 underline-offset-2"
                  >
                    {ref.title}
                  </a>
                ) : (
                  <span className="font-medium text-green-800">{ref.title}</span>
                )}
                {ref.note ? <span className="text-green-600"> — {ref.note}</span> : null}
              </li>
            ))}
          </ol>
        </section>
      )
    default:
      return null
  }
}

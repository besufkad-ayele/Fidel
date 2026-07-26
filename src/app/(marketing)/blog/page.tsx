import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getPublishedBlogPosts } from '@/lib/data/blog'
import { BlogCoverImage } from '@/components/features/marketing/blog-media'
import type { Route } from 'next'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Culture notes, learning tips, and stories from teaching Amharic for real Ethiopian workplaces.',
}

function postHref(slug: string): Route {
  return `/blog/${slug}` as Route
}

export default async function BlogIndexPage() {
  const t = await getTranslations('marketing.blog')
  const posts = await getPublishedBlogPosts()

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-16 left-8 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="absolute right-10 bottom-10 h-72 w-72 rounded-full bg-green-700/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-bold tracking-[0.16em] text-gold-700 uppercase">{t('eyebrow')}</p>
        <h1 className="font-display mt-3 text-4xl text-green-800 sm:text-5xl">{t('title')}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-green-700">{t('lead')}</p>

        {posts.length === 0 ? (
          <div className="mt-14 rounded-2xl border border-cream-300 bg-cream-50 px-6 py-12 text-center shadow-card">
            <p className="font-display text-2xl text-green-800">{t('emptyTitle')}</p>
            <p className="mt-2 text-sm text-green-600">{t('emptyBody')}</p>
          </div>
        ) : (
          <ul className="mt-12 grid gap-8 sm:grid-cols-2">
            {posts.map((post) => (
              <li key={post.id}>
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-cream-300 bg-cream-50 shadow-card transition-shadow hover:shadow-card-hover">
                  <Link href={postHref(post.slug)} className="block overflow-hidden bg-green-800">
                    {post.cover_path ? (
                      <BlogCoverImage
                        path={post.cover_path}
                        alt={post.cover_alt || post.title}
                        className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="aspect-[16/10] bg-gradient-to-br from-green-800 via-green-700 to-gold-600" />
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
                    {post.published_at ? (
                      <time
                        dateTime={post.published_at}
                        className="text-xs font-medium tracking-wide text-green-600 uppercase"
                      >
                        {t('publishedOn', {
                          date: new Date(post.published_at).toLocaleDateString('en', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }),
                        })}
                      </time>
                    ) : null}
                    <h2 className="font-display text-2xl text-green-800">
                      <Link href={postHref(post.slug)} className="hover:text-green-900">
                        {post.title}
                      </Link>
                    </h2>
                    {post.excerpt ? (
                      <p className="line-clamp-3 text-sm leading-relaxed text-green-700">
                        {post.excerpt}
                      </p>
                    ) : null}
                    {post.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-gold-300 bg-gold-50 px-2.5 py-0.5 text-xs font-medium text-gold-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <Link
                      href={postHref(post.slug)}
                      className="mt-auto pt-2 text-sm font-semibold text-green-800 underline decoration-gold-500 underline-offset-2"
                    >
                      {t('readMore')}
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

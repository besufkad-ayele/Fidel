import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getPublishedBlogPostBySlug, getPublishedBlogPosts } from '@/lib/data/blog'
import { BlogArticleView } from '@/components/features/marketing/blog-article-view'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  try {
    const posts = await getPublishedBlogPosts()
    return posts.map((post) => ({ slug: post.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedBlogPostBySlug(slug)
  if (!post) return { title: 'Blog' }
  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || undefined,
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const t = await getTranslations('marketing.blog')
  const post = await getPublishedBlogPostBySlug(slug)
  if (!post) notFound()

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-20 right-8 h-56 w-56 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="absolute bottom-16 left-6 h-64 w-64 rounded-full bg-green-700/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <BlogArticleView
          post={{
            title: post.title,
            excerpt: post.excerpt,
            coverPath: post.cover_path,
            coverAlt: post.cover_alt,
            tags: post.tags,
            publishedAt: post.published_at,
            blocks: post.blocks,
          }}
          labels={{
            eyebrow: t('eyebrow'),
            backToBlog: t('backToBlog'),
            publishedOn: (date) => t('publishedOn', { date }),
            tagsLabel: t('tagsLabel'),
            gallery: t('gallery'),
            references: t('references'),
          }}
        />
      </div>
    </div>
  )
}

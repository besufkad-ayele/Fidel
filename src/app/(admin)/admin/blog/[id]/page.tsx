import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { ConfirmForm } from '@/components/admin/confirm-form'
import { BlogPostForm } from '@/components/admin/blog-post-form'
import { createAdminDb } from '@/lib/admin/db'
import {
  setBlogStatusAction,
  deleteBlogPostAndRedirectAction,
} from '@/app/(admin)/admin/content-actions'
import { resolveBlogBlocks } from '@/lib/blog/blocks'
import { Button } from '@/components/ui/button'
import type { Route } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const db = createAdminDb()
  const { data } = await db.from('blog_posts').select('title').eq('id', id).maybeSingle()
  return { title: data?.title ? `Edit · ${data.title}` : 'Edit blog post' }
}

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params
  const db = createAdminDb()
  const { data: post } = await db
    .from('blog_posts')
    .select(
      'id, title, slug, excerpt, body_md, status, cover_path, cover_alt, video_url, video_path, video_caption, gallery, reference_links, blocks, tags, seo_title, seo_description',
    )
    .eq('id', id)
    .maybeSingle()

  if (!post) notFound()

  const publicHref = `/blog/${post.slug}` as Route
  const blocks = resolveBlogBlocks(post.blocks, {
    body_md: post.body_md,
    video_url: post.video_url,
    video_path: post.video_path,
    video_caption: post.video_caption,
    gallery: post.gallery,
    reference_links: post.reference_links,
  })

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        breadcrumbs={[
          { label: 'Blog', href: '/admin/blog' },
          { label: post.title },
        ]}
        title={post.title}
        description="Drag blocks to reorder. Open the preview sidebar to see the public article."
        actions={[{ label: 'View public', href: publicHref, variant: 'outline' }]}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge status={post.status} />
        {post.status !== 'published' ? (
          <form action={setBlogStatusAction.bind(null, post.id, 'published')}>
            <Button type="submit" size="sm">
              Publish
            </Button>
          </form>
        ) : (
          <form action={setBlogStatusAction.bind(null, post.id, 'draft')}>
            <Button type="submit" size="sm" variant="outline">
              Unpublish
            </Button>
          </form>
        )}
        <Button asChild size="sm" variant="ghost">
          <Link href={publicHref} target="_blank">
            Open /blog/{post.slug}
          </Link>
        </Button>
        <ConfirmForm
          action={deleteBlogPostAndRedirectAction.bind(null, post.id)}
          message={`Delete post "${post.title}"?`}
          label="Delete"
        />
      </div>

      <BlogPostForm
        mode="edit"
        initial={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          status: post.status,
          coverPath: post.cover_path,
          coverAlt: post.cover_alt,
          tags: post.tags ?? [],
          seoTitle: post.seo_title,
          seoDescription: post.seo_description,
          blocks,
        }}
      />
    </div>
  )
}

import Link from 'next/link'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { StatusBadge } from '@/components/admin/status-badge'
import { ConfirmForm } from '@/components/admin/confirm-form'
import { createAdminDb } from '@/lib/admin/db'
import {
  setBlogStatusAction,
  deleteBlogPostAction,
} from '@/app/(admin)/admin/content-actions'
import { formatDateTime } from '@/lib/admin/constants'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata: Metadata = { title: 'Blog' }

export default async function BlogAdminPage() {
  const db = createAdminDb()
  const { data: posts } = await db
    .from('blog_posts')
    .select('id, title, slug, status, published_at, updated_at, cover_path, video_url, video_path')
    .order('updated_at', { ascending: false })

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Content"
        title="Blog"
        description="Draft and publish articles for the public /blog page — with cover images, video, and references."
        actions={[{ label: 'New post', href: '/admin/blog/new' }]}
      />

      {(posts ?? []).length === 0 ? (
        <EmptyState
          title="No posts yet"
          description="Create a draft with cover image, optional video, gallery, and reference links. Publishing revalidates the marketing blog."
          actionLabel="New post"
          actionHref="/admin/blog/new"
        />
      ) : (
        <div className="admin-table-wrap">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Media</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(posts ?? []).map(
                (p: {
                  id: string
                  title: string
                  slug: string
                  status: string
                  updated_at: string
                  cover_path: string | null
                  video_url: string | null
                  video_path: string | null
                }) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        href={`/admin/blog/${p.id}`}
                        className="font-medium text-green-800 hover:underline"
                      >
                        {p.title}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.slug}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {[
                        p.cover_path ? 'Image' : null,
                        p.video_url || p.video_path ? 'Video' : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell>{formatDateTime(p.updated_at)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/blog/${p.id}`}>Edit</Link>
                        </Button>
                        {p.status !== 'published' ? (
                          <form action={setBlogStatusAction.bind(null, p.id, 'published')}>
                            <Button type="submit" size="sm" variant="secondary">
                              Publish
                            </Button>
                          </form>
                        ) : (
                          <form action={setBlogStatusAction.bind(null, p.id, 'draft')}>
                            <Button type="submit" size="sm" variant="ghost">
                              Unpublish
                            </Button>
                          </form>
                        )}
                        <ConfirmForm
                          action={deleteBlogPostAction.bind(null, p.id)}
                          message={`Delete post "${p.title}"?`}
                          label="Delete"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

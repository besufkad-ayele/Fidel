import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { BlogPostForm } from '@/components/admin/blog-post-form'

export const metadata: Metadata = { title: 'New blog post' }

export default function NewBlogPostPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        breadcrumbs={[
          { label: 'Blog', href: '/admin/blog' },
          { label: 'New post' },
        ]}
        title="New blog post"
        description="Add draggable content blocks, then open the preview sidebar to see the public article."
      />
      <BlogPostForm mode="create" />
    </div>
  )
}

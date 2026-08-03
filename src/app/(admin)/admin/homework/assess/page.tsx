import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/admin/page-header'
import { requireRole } from '@/lib/auth/guards'
import { listHomeworkSubmissionsForReview } from '@/lib/data/homework-review'
import { HomeworkReviewQueue } from '@/components/features/homework/homework-review-queue'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Homework assessment' }

type Props = { searchParams: Promise<{ status?: string }> }

export default async function AdminHomeworkAssessPage({ searchParams }: Props) {
  const { user } = await requireRole('admin')
  const params = await searchParams
  const statusParam = params.status
  const status =
    statusParam === 'reviewed' ||
    statusParam === 'needs_resubmission' ||
    statusParam === 'all' ||
    statusParam === 'submitted'
      ? statusParam === 'submitted'
        ? ('awaiting' as const)
        : statusParam
      : ('awaiting' as const)

  const items = await listHomeworkSubmissionsForReview({
    role: 'admin',
    userId: user.id,
    status,
  })

  const filters = [
    { key: 'awaiting', label: 'Awaiting assessment', href: '/admin/homework/assess' },
    { key: 'reviewed', label: 'Reviewed', href: '/admin/homework/assess?status=reviewed' },
    {
      key: 'needs_resubmission',
      label: 'Resubmission',
      href: '/admin/homework/assess?status=needs_resubmission',
    },
    { key: 'all', label: 'All', href: '/admin/homework/assess?status=all' },
  ] as const

  const activeKey = status === 'awaiting' ? 'awaiting' : status

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Homework', href: '/admin/homework' },
          { label: 'Assessment' },
        ]}
        title="Homework assessment"
        description="Review student submissions, leave feedback, and set grades that roll into unit homework scores."
        actions={[{ label: 'Manage assignments', href: '/admin/homework', variant: 'outline' }]}
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.key}
            asChild
            size="sm"
            variant={activeKey === f.key ? 'default' : 'outline'}
          >
            <Link href={f.href as '/'}>{f.label}</Link>
          </Button>
        ))}
      </div>

      <HomeworkReviewQueue
        items={items}
        detailHref={(id) => `/admin/homework/assess/${id}`}
        emptyTitle="Nothing to assess"
        emptyBody={
          status === 'awaiting'
            ? 'Published homework submissions from students will show up here.'
            : 'No submissions match this filter.'
        }
      />
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/guards'
import { listHomeworkSubmissionsForReview } from '@/lib/data/homework-review'
import { HomeworkReviewQueue } from '@/components/features/homework/homework-review-queue'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Homework assessment' }

type Props = { searchParams: Promise<{ status?: string }> }

export default async function TeachHomeworkPage({ searchParams }: Props) {
  const { user } = await requireRole('teacher')
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
    role: 'teacher',
    userId: user.id,
    status,
  })

  const filters = [
    { key: 'awaiting', label: 'Awaiting assessment', href: '/teach/homework' },
    { key: 'reviewed', label: 'Reviewed', href: '/teach/homework?status=reviewed' },
    {
      key: 'needs_resubmission',
      label: 'Resubmission',
      href: '/teach/homework?status=needs_resubmission',
    },
    { key: 'all', label: 'All', href: '/teach/homework?status=all' },
  ] as const

  const activeKey = status

  return (
    <div className="space-y-6">
      <header className="border-b border-cream-300 pb-5">
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
          Teaching
        </p>
        <h1 className="mt-1 font-display text-3xl text-green-900">Homework assessment</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Review submissions from your students, leave feedback, and grade work that counts toward
          unit progress.
        </p>
      </header>

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
        detailHref={(id) => `/teach/homework/${id}`}
        emptyTitle="Nothing to assess"
        emptyBody={
          status === 'awaiting'
            ? 'When students submit homework, it will appear here for grading.'
            : 'No submissions match this filter.'
        }
      />
    </div>
  )
}

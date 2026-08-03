import Link from 'next/link'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import type { HomeworkReviewQueueItem } from '@/lib/data/homework-review'

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export function HomeworkReviewQueue({
  items,
  detailHref,
  emptyTitle,
  emptyBody,
}: {
  items: HomeworkReviewQueueItem[]
  detailHref: (id: string) => string
  emptyTitle: string
  emptyBody: string
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-cream-400 bg-cream-50 p-8 text-center">
        <p className="font-display text-xl text-green-900">{emptyTitle}</p>
        <p className="mt-2 text-sm text-green-700">{emptyBody}</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-col gap-3 rounded-xl border border-cream-300 bg-cream-50 p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={item.status} />
              <span className="text-xs text-muted-foreground">Attempt {item.attemptNo}</span>
            </div>
            <h3 className="font-display text-lg text-green-900">{item.assignment.title}</h3>
            <p className="text-sm text-green-800">
              {item.student.fullName}
              <span className="text-muted-foreground"> · {item.student.email}</span>
            </p>
            <p className="text-xs text-muted-foreground">Submitted {formatWhen(item.submittedAt)}</p>
            {item.grade != null ? (
              <p className="text-xs font-semibold tabular-nums text-green-800">Grade {item.grade}%</p>
            ) : null}
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link href={detailHref(item.id) as '/'}>
              {item.status === 'submitted' ? 'Assess' : 'View assessment'}
            </Link>
          </Button>
        </li>
      ))}
    </ul>
  )
}

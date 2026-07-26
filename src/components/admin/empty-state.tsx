import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  icon?: LucideIcon
  className?: string
  compact?: boolean
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon: Icon = Inbox,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        compact ? 'gap-3 py-10' : 'gap-4 py-16',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl border border-cream-300 bg-cream-100 text-green-600',
          compact ? 'size-14' : 'size-20',
        )}
      >
        <Icon className={compact ? 'size-6' : 'size-8'} strokeWidth={1.5} />
      </div>
      <div className="max-w-[42ch] space-y-1.5">
        <h2 className={cn('font-semibold text-green-700', compact ? 'text-lg' : 'text-xl')}>
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {actionLabel && actionHref ? (
        <Button asChild className="mt-1">
          <Link href={actionHref as '/'}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  )
}

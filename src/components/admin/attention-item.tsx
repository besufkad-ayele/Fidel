import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type AttentionItemProps = {
  title: string
  description: string
  count?: number
  href: string
  icon: LucideIcon
  tone?: 'default' | 'warning' | 'danger' | 'success' | 'info'
}

const tones = {
  default: 'border-cream-300 bg-cream-50 hover:border-green-200',
  warning: 'border-warning-500/30 bg-warning-50 hover:border-warning-500/50',
  danger: 'border-danger-500/30 bg-danger-50 hover:border-danger-500/50',
  success: 'border-success-500/30 bg-success-50 hover:border-success-500/50',
  info: 'border-info-500/30 bg-info-50 hover:border-info-500/50',
} as const

const iconTones = {
  default: 'bg-green-50 text-green-700',
  warning: 'bg-warning-50 text-warning-500',
  danger: 'bg-danger-50 text-danger-500',
  success: 'bg-success-50 text-success-500',
  info: 'bg-info-50 text-info-500',
} as const

export function AttentionItem({
  title,
  description,
  count,
  href,
  icon: Icon,
  tone = 'default',
}: AttentionItemProps) {
  return (
    <Link
      href={href as '/'}
      className={cn(
        'group flex items-start gap-3 rounded-xl border p-4 transition-all duration-200 hover:shadow-card',
        tones[tone],
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg',
          iconTones[tone],
        )}
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-green-700">{title}</p>
          {typeof count === 'number' ? (
            <span className="rounded-full bg-cream-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-green-700 ring-1 ring-cream-300">
              {count}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-green-700" />
    </Link>
  )
}

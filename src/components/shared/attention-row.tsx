import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type AttentionRowProps = {
  title: string
  description: string
  href: string
  icon: LucideIcon
  tone?: 'default' | 'warning' | 'info' | 'success'
}

const toneClass = {
  default: 'bg-cream-100 text-green-600',
  warning: 'bg-warning-50 text-warning-500',
  info: 'bg-info-50 text-info-500',
  success: 'bg-success-50 text-success-500',
} as const

export function AttentionRow({
  title,
  description,
  href,
  icon: Icon,
  tone = 'default',
}: AttentionRowProps) {
  return (
    <Link
      href={href as '/'}
      className="group flex items-start gap-3 rounded-lg border border-cream-300 bg-cream-50 p-4 transition-colors duration-150 hover:border-gold-300 hover:bg-cream-100"
    >
      <span
        className={cn(
          'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg',
          toneClass[tone],
        )}
      >
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-green-700">{title}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
      </span>
      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-gold-600" />
    </Link>
  )
}

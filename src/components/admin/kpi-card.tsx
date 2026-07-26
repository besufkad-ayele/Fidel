import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type KpiCardProps = {
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'warning' | 'danger' | 'success' | 'info'
  icon?: LucideIcon
  className?: string
  href?: string
}

const toneClass = {
  default: 'border-cream-300 bg-cream-50',
  warning: 'border-warning-500/25 bg-warning-50',
  danger: 'border-danger-500/25 bg-danger-50',
  success: 'border-success-500/25 bg-success-50',
  info: 'border-info-500/25 bg-info-50',
} as const

const iconTone = {
  default: 'bg-green-50 text-green-700',
  warning: 'bg-warning-50 text-warning-500',
  danger: 'bg-danger-50 text-danger-500',
  success: 'bg-success-50 text-success-500',
  info: 'bg-info-50 text-info-500',
} as const

export function KpiCard({
  label,
  value,
  hint,
  tone = 'default',
  icon: Icon,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border p-5 shadow-card transition-shadow duration-250 ease-brand hover:shadow-card-hover',
        toneClass[tone],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          {label}
        </p>
        {Icon ? (
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg',
              iconTone[tone],
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} />
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-[2rem] leading-none tracking-tight text-green-700 tabular-nums">
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -bottom-8 size-24 rounded-full bg-gold-500/5 transition-transform duration-500 group-hover:scale-110"
      />
    </div>
  )
}

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type QuickActionProps = {
  href: string
  label: string
  description: string
  icon: LucideIcon
  className?: string
}

export function QuickAction({
  href,
  label,
  description,
  icon: Icon,
  className,
}: QuickActionProps) {
  return (
    <Link
      href={href as '/'}
      className={cn(
        'group flex items-start gap-3 rounded-xl border border-cream-300 bg-cream-50 p-4 shadow-card transition-all duration-250 ease-brand hover:border-gold-300 hover:shadow-card-hover',
        className,
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-700 text-gold-400 transition-colors group-hover:bg-green-600">
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="font-medium text-green-700">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </Link>
  )
}

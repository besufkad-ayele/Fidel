import { cn } from '@/lib/utils'

type SectionCardProps = {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
  padded?: boolean
}

export function SectionCard({
  title,
  description,
  children,
  className,
  action,
  padded = true,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border border-cream-300 bg-cream-50 shadow-card',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-cream-300 bg-cream-100/50 px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-display text-lg tracking-tight text-green-700">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn(padded && 'p-5')}>{children}</div>
    </section>
  )
}

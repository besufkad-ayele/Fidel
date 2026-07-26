import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Action = {
  label: string
  href?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
}

type Crumb = {
  label: string
  href?: string
}

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: Action[]
  breadcrumbs?: Crumb[]
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 border-b border-cream-300/80 pb-5 sm:mb-8 sm:gap-5 sm:pb-6 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-xs">
            {breadcrumbs.map((crumb, i) => (
              <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                {i > 0 ? <ChevronRight className="size-3 text-muted-foreground/60" /> : null}
                {crumb.href ? (
                  <Link
                    href={crumb.href as '/'}
                    className="font-medium text-muted-foreground transition-colors hover:text-green-700"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-green-700">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}

        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="font-display text-[1.75rem] leading-9 tracking-tight text-green-700 sm:text-[2.25rem] sm:leading-[2.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {actions && actions.length > 0 ? (
        <div className="flex shrink-0 flex-wrap gap-2">
          {actions.map((action) =>
            action.href ? (
              <Button key={action.label} asChild variant={action.variant ?? 'default'} size="default">
                <Link href={action.href as '/'}>{action.label}</Link>
              </Button>
            ) : null,
          )}
        </div>
      ) : null}
    </div>
  )
}

'use client'

import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type CollapsiblePanelProps = {
  title: string
  description?: string
  children: React.ReactNode
  /** Shown next to the title (non-interactive text/badge only) */
  meta?: React.ReactNode
  /** Separate actions rendered beside the collapse control (links, buttons) */
  actions?: React.ReactNode
  defaultOpen?: boolean
  className?: string
  bodyClassName?: string
}

export function CollapsiblePanel({
  title,
  description,
  children,
  meta,
  actions,
  defaultOpen = true,
  className,
  bodyClassName,
}: CollapsiblePanelProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border border-cream-300 bg-cream-50 shadow-card',
        className,
      )}
    >
      <div className="flex items-stretch border-b border-cream-300 bg-cream-100/50">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-cream-100 sm:px-5 sm:py-4"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg tracking-tight text-green-700">{title}</h2>
              {meta}
            </div>
            {description ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <span
            className={cn(
              'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-cream-300 bg-cream-50 text-green-700 transition-transform duration-200',
              open && 'rotate-180',
            )}
          >
            <ChevronDown className="size-4" />
            <span className="sr-only">{open ? 'Collapse' : 'Expand'}</span>
          </span>
        </button>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2 border-l border-cream-300 px-3 sm:px-4">
            {actions}
          </div>
        ) : null}
      </div>

      <div id={panelId} hidden={!open} className={cn(open && (bodyClassName ?? 'p-4 sm:p-5'))}>
        {open ? children : null}
      </div>
    </section>
  )
}

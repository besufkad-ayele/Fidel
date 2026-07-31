'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { AdminNavGroupWithIcons } from '@/lib/admin/nav'

export type AdminNavItem = {
  href: string
  label: string
}

export type AdminNavGroup = {
  label: string
  items: AdminNavItem[]
}

type AdminNavProps = {
  groups: AdminNavGroupWithIcons[]
  onNavigate?: () => void
  className?: string
  /** Unread / pending counts keyed by nav href. */
  badges?: Record<string, number>
}

export function AdminNav({ groups, onNavigate, className, badges }: AdminNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-3 pb-3',
        '[scrollbar-width:thin] [scrollbar-color:rgb(214_173_96_/_0.35)_transparent]',
        className,
      )}
    >
      {groups.map((group) => (
        <div key={group.label} className="shrink-0">
          <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-[0.14em] text-green-300/70 uppercase">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`)
              const Icon = item.icon
              const badge = badges?.[item.href] ?? 0

              return (
                <Link
                  key={item.href}
                  href={item.href as '/'}
                  onClick={onNavigate}
                  className={cn(
                    'group relative flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150',
                    active
                      ? 'bg-gold-500/15 text-gold-300'
                      : 'text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  {active ? (
                    <span
                      aria-hidden
                      className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-r-full bg-gold-500"
                    />
                  ) : null}
                  <Icon
                    className={cn(
                      'size-[18px] shrink-0',
                      active ? 'text-gold-400' : 'text-green-300/80 group-hover:text-cream-50',
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                  {badge > 0 ? (
                    <span className="ml-auto min-w-5 rounded-full bg-gold-500 px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums text-green-950">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

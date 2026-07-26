import Link from 'next/link'
import type { Route } from 'next'
import { cn } from '@/lib/utils'

type PartTabId = 'culture' | 'lesson' | 'practice'

export function PartTabs({
  active,
  levelSlug,
  unitSlug,
}: {
  active: PartTabId
  levelSlug: string
  unitSlug: string
}) {
  const base = `/levels/${levelSlug}/units/${unitSlug}`
  const tabs = [
    { id: 'culture' as const, label: 'Part 1: Cultural Insight', href: `${base}/culture` as Route },
    { id: 'lesson' as const, label: 'Part 2: Language Lesson', href: `${base}/lesson` as Route },
    {
      id: 'practice' as const,
      label: 'Part 3: Interactive Practice',
      href: `${base}/practice` as Route,
    },
  ]

  return (
    <div className="flex gap-1 overflow-x-auto border-b border-cream-300 sm:gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={cn(
            'shrink-0 border-b-2 px-4 py-3 text-xs font-semibold transition-all sm:px-5',
            active === tab.id
              ? 'rounded-t-lg border-gold-500 bg-cream-200/40 font-bold text-green-900'
              : 'border-transparent text-green-600 hover:text-green-900',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}

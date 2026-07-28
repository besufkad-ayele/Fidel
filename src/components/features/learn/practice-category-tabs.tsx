'use client'

import { cn } from '@/lib/utils'
import type { PracticeCategory } from '@/lib/validation/content'

export function PracticeCategoryTabs({
  categories,
  activeId,
  onChange,
}: {
  categories: PracticeCategory[]
  activeId: string
  onChange: (id: string) => void
}) {
  if (categories.length === 0) return null

  return (
    <div className="flex gap-1 overflow-x-auto border-b border-cream-300 sm:gap-2">
      {categories.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'shrink-0 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all sm:px-5',
            activeId === tab.id
              ? 'rounded-t-lg border-gold-500 bg-cream-200/40 font-bold text-green-900'
              : 'border-transparent text-green-600 hover:text-green-900',
          )}
        >
          {tab.name}
        </button>
      ))}
    </div>
  )
}

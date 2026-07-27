import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { BlockRenderer } from '@/components/content/block-renderer'
import { PartTabs } from '@/components/features/learn/part-tabs'
import { Button } from '@/components/ui/button'
import { getPublishedUnitPartPage, partKeyFromRoute } from '@/lib/data/curriculum'

const NEXT_PART: Record<string, { label: string; route: string } | null> = {
  culture: { label: 'Continue to Language Lesson', route: 'lesson' },
  lesson: { label: 'Continue to Practice', route: 'practice' },
  practice: null,
}

export async function UnitPartPage({
  levelSlug,
  unitSlug,
  partRoute,
}: {
  levelSlug: string
  unitSlug: string
  partRoute: 'culture' | 'lesson' | 'practice'
}) {
  const partKey = partKeyFromRoute(partRoute)
  if (!partKey) notFound()

  const page = await getPublishedUnitPartPage(levelSlug, unitSlug, partKey)
  if (!page) notFound()

  const { unit, content, vocabulary } = page

  if (!content) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PartTabs active={partRoute} levelSlug={levelSlug} unitSlug={unitSlug} />
        <div className="rounded-xl border border-dashed border-cream-400 bg-cream-50 p-8 text-center">
          <h1 className="font-display text-2xl text-green-900">{unit.title}</h1>
          <p className="mt-2 text-sm text-green-700">
            This part is not published yet. Your teacher is still preparing the content.
          </p>
        </div>
      </div>
    )
  }

  const next = NEXT_PART[partRoute]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PartTabs active={partRoute} levelSlug={levelSlug} unitSlug={unitSlug} />

      <div className="rounded-xl border border-cream-300 bg-cream-50 p-6 shadow-card sm:p-8">
        <BlockRenderer content={content} vocabulary={vocabulary} mode="student" />
      </div>

      {next ? (
        <div className="flex justify-end">
          <Button asChild>
            <Link href={`/levels/${levelSlug}/units/${unitSlug}/${next.route}`}>
              {next.label}
              <ChevronRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  )
}

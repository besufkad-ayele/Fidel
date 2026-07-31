import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { BlockRenderer } from '@/components/content/block-renderer'
import { CompletePartButton } from '@/components/features/learn/complete-part-button'
import { PartTabs } from '@/components/features/learn/part-tabs'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth/session'
import { getPublishedUnitPartPage, partKeyFromRoute } from '@/lib/data/curriculum'
import { createClient } from '@/lib/supabase/server'

const NEXT_PART: Record<string, { label: string; route: string } | null> = {
  culture: { label: 'Continue to Language Lesson', route: 'lesson' },
  lesson: { label: 'Continue to Practice', route: 'practice' },
  practice: null,
}

const COMPLETE_LABEL: Record<string, string> = {
  culture: 'Mark culture complete',
  lesson: 'Mark lesson complete',
  practice: 'Mark practice complete',
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
  const user = await getCurrentUser()
  let alreadyComplete = false

  if (user) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('part_progress')
      .select('status')
      .eq('student_id', user.id)
      .eq('unit_id', unit.id)
      .eq('part', partKey)
      .maybeSingle()
    alreadyComplete = data?.status === 'completed'
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PartTabs active={partRoute} levelSlug={levelSlug} unitSlug={unitSlug} />

      <div className="rounded-xl border border-cream-300 bg-cream-50 p-6 shadow-card sm:p-8">
        <BlockRenderer content={content} vocabulary={vocabulary} mode="student" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cream-300 bg-cream-50 px-4 py-4 shadow-card">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
            Progress
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {alreadyComplete
              ? 'This part is saved as complete on your progress.'
              : partRoute === 'practice'
                ? 'Finished the drills? Mark practice complete to update your pass/fail status.'
                : 'Mark this part complete so your teacher and dashboard stay in sync.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CompletePartButton
            unitId={unit.id}
            part={partKey}
            levelSlug={levelSlug}
            unitSlug={unitSlug}
            alreadyComplete={alreadyComplete}
            label={COMPLETE_LABEL[partRoute] ?? 'Mark complete'}
          />
          {next ? (
            <Button asChild variant="outline">
              <Link href={`/levels/${levelSlug}/units/${unitSlug}/${next.route}` as '/'}>
                {next.label}
                <ChevronRight className="ml-1 size-4" />
              </Link>
            </Button>
          ) : alreadyComplete ? (
            <Button asChild variant="outline">
              <Link href={'/progress' as '/'}>View progress</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

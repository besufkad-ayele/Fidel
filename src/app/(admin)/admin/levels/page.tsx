import Link from 'next/link'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { AmharicText } from '@/components/shared/amharic-text'
import { createAdminDb } from '@/lib/admin/db'
import { setLevelStatusFormAction } from '@/app/(admin)/admin/actions'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Levels' }

export default async function LevelsPage() {
  const db = await createAdminDb()
  const [{ data: levels }, { data: units }] = await Promise.all([
    db.from('levels').select('*').order('sort_order'),
    db.from('units').select('id, level_id, status'),
  ])

  const unitCount = new Map<string, number>()
  const publishedUnits = new Map<string, number>()
  for (const u of units ?? []) {
    unitCount.set(u.level_id, (unitCount.get(u.level_id) ?? 0) + 1)
    if (u.status === 'published') {
      publishedUnits.set(u.level_id, (publishedUnits.get(u.level_id) ?? 0) + 1)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Levels"
        description="The fidel ladder. Publish when units and parts are ready for students."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(levels ?? []).map(
          (level: {
            id: string
            fidel_char: string
            title: string
            subtitle: string | null
            cefr_equivalent: string
            status: string
            is_coming_soon: boolean
            sort_order: number
          }) => {
            const total = unitCount.get(level.id) ?? 0
            const published = publishedUnits.get(level.id) ?? 0
            return (
              <article
                key={level.id}
                className={cn(
                  'group relative flex flex-col overflow-hidden rounded-xl border border-cream-300 bg-cream-50 shadow-card transition-shadow duration-250 ease-brand hover:shadow-card-hover',
                )}
              >
                <div className="relative border-b border-cream-300 bg-gradient-to-br from-green-700 via-green-700 to-green-600 px-5 py-6">
                  <div className="absolute inset-0 opacity-[0.07]" style={{
                    backgroundImage:
                      'radial-gradient(circle at 20% 20%, #d6ad60 0, transparent 40%), radial-gradient(circle at 80% 60%, #d6ad60 0, transparent 35%)',
                  }} />
                  <div className="relative flex items-start justify-between gap-3">
                    <AmharicText size="xl" className="text-gold-400">
                      {level.fidel_char}
                    </AmharicText>
                    <span className="rounded-full bg-cream-50/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-cream-50 ring-1 ring-cream-50/20">
                      CEFR {level.cefr_equivalent}
                    </span>
                  </div>
                  <h2 className="relative mt-3 font-display text-xl text-cream-50">{level.title}</h2>
                  {level.subtitle ? (
                    <p className="relative mt-1 line-clamp-2 text-sm text-green-100/80">
                      {level.subtitle}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge status={level.status} />
                    {level.is_coming_soon ? <StatusBadge status="coming_soon" /> : null}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-cream-300 bg-cream-100 px-3 py-2.5">
                      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                        Units
                      </p>
                      <p className="mt-0.5 font-display text-xl text-green-700 tabular-nums">
                        {total}
                      </p>
                    </div>
                    <div className="rounded-lg border border-cream-300 bg-cream-100 px-3 py-2.5">
                      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                        Published
                      </p>
                      <p className="mt-0.5 font-display text-xl text-green-700 tabular-nums">
                        {published}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center gap-2 pt-1">
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link href={`/admin/levels/${level.id}` as '/'}>
                        Open
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                    {level.status !== 'published' ? (
                      <form action={setLevelStatusFormAction.bind(null, level.id, 'published')}>
                        <Button type="submit" size="sm">
                          Publish
                        </Button>
                      </form>
                    ) : (
                      <form action={setLevelStatusFormAction.bind(null, level.id, 'draft')}>
                        <Button type="submit" size="sm" variant="ghost">
                          Unpublish
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </article>
            )
          },
        )}
      </div>
    </div>
  )
}

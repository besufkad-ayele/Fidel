import Link from 'next/link'
import type { Metadata } from 'next'
import { AmharicText } from '@/components/shared/amharic-text'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'My levels' }

export default async function LevelsPage() {
  const supabase = await createClient()
  const { data: levels } = await supabase
    .from('levels')
    .select('id, fidel_char, title, cefr_equivalent, is_coming_soon, status, sort_order')
    .order('sort_order')

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">Curriculum</p>
        <h1 className="mt-1 font-display text-3xl text-green-900">My levels</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Six fidel levels from Foundations to Mastery. Published levels open into real unit content.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(levels ?? []).map((level) => {
          const locked = level.is_coming_soon || level.status !== 'published'
          return (
            <article
              key={level.id}
              className={
                locked
                  ? 'rounded-xl border border-cream-300 bg-cream-50/70 p-6 opacity-70'
                  : 'rounded-xl border-2 border-gold-400 bg-gold-50/40 p-6 shadow-card'
              }
            >
              <AmharicText
                size="xl"
                className={locked ? 'text-green-400' : 'text-gold-600'}
              >
                {level.fidel_char}
              </AmharicText>
              <p className="mt-2 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                CEFR {level.cefr_equivalent}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-green-900">{level.title}</h2>
              {locked ? (
                <p className="mt-4 text-xs font-medium text-muted-foreground">
                  {level.is_coming_soon ? 'Coming soon' : 'Not published yet'}
                </p>
              ) : (
                <Button asChild className="mt-5 bg-green-700 text-cream-50 hover:bg-green-600">
                  <Link href={`/levels/${level.id}`}>Open level</Link>
                </Button>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}

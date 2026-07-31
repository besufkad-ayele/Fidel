import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ChevronRight, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/auth/guards'
import { listPublishedHomeworkForStudent } from '@/lib/data/homework'

export const metadata: Metadata = { title: 'Homework' }

function formatDue(dueAt: string | null, locale: string) {
  if (!dueAt) return null
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dueAt))
  } catch {
    return null
  }
}

export default async function StudentHomeworkPage() {
  await requireRole('student')
  const t = await getTranslations('homework')
  const assignments = await listPublishedHomeworkForStudent()

  return (
    <div className="space-y-8">
      <header className="border-b border-cream-300 pb-5">
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
          {t('eyebrow')}
        </p>
        <h1 className="mt-1 font-display text-3xl text-green-900">{t('title')}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      {assignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cream-400 bg-cream-50 px-6 py-12 text-center">
          <FileText className="mx-auto size-8 text-gold-600" aria-hidden />
          <h2 className="mt-3 font-display text-xl text-green-900">{t('emptyTitle')}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {t('emptyBody')}
          </p>
          <Button asChild className="mt-5" variant="outline">
            <Link href={'/dashboard' as '/'}>{t('backDashboard')}</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {assignments.map((a) => {
            const due = formatDue(a.dueAt, 'en')
            return (
              <li key={a.id}>
                <Link
                  href={`/homework/${a.id}` as '/'}
                  className="group flex items-start justify-between gap-4 rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card transition-colors hover:border-gold-400"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg text-green-900 group-hover:text-green-800">
                        {a.title}
                      </h2>
                      <span
                        className={
                          a.submissionStatus === 'pending' ||
                          a.submissionStatus === 'needs_resubmission'
                            ? 'rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-semibold text-gold-800'
                            : 'rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800'
                        }
                      >
                        {t(`status.${a.submissionStatus}`)}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-green-800/80">{a.instructions}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {a.unitTitle ? (
                        <span>
                          {a.levelId ? `${a.levelId.toUpperCase()} · ` : ''}
                          {a.unitTitle}
                        </span>
                      ) : null}
                      {due ? <span>{t('due', { date: due })}</span> : null}
                    </div>
                  </div>
                  <span className="mt-1 inline-flex shrink-0 items-center gap-1 text-sm font-medium text-gold-700">
                    {a.submissionStatus === 'pending' ||
                    a.submissionStatus === 'needs_resubmission'
                      ? t('open')
                      : t('view')}
                    <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

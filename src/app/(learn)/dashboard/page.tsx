import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Video,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { AmharicText } from '@/components/shared/amharic-text'
import { FidelBadge } from '@/components/shared/fidel-badge'
import { StatusChip } from '@/components/shared/status-chip'
import { Button } from '@/components/ui/button'
import { getCurrentProfile } from '@/lib/auth/session'
import { listActionableHomeworkForStudent } from '@/lib/data/homework'
import { listUnconfirmedPastSessionsForUser } from '@/lib/data/sessions'
import { getCurrentStudentProgress } from '@/lib/data/progress'
import { LEVELS } from '@/lib/constants/brand'
import { HA_UNITS, UNIT_PARTS } from '@/lib/constants/curriculum'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function StudentDashboardPage() {
  const profile = await getCurrentProfile()
  const [progress, actionableHomework, unconfirmedSessions] = await Promise.all([
    getCurrentStudentProgress(),
    listActionableHomeworkForStudent(),
    profile
      ? listUnconfirmedPastSessionsForUser({ userId: profile.id, role: 'student' })
      : Promise.resolve([]),
  ])
  const t = await getTranslations('dashboard')
  const firstName = profile?.full_name?.split(/\s+/)[0]
  const hour = new Date().getHours()
  const greetingKey = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
  const level = LEVELS[0]!
  const activeUnit = HA_UNITS[0]!
  const haUnits = progress?.units.filter((u) => u.level?.id === 'ha') ?? []
  const unitsComplete = haUnits.filter((u) => u.grade.isComplete).length
  const unitsTotal = haUnits.length || 10
  const overallPct =
    progress?.averageGrade != null
      ? Math.round(progress.averageGrade)
      : unitsTotal > 0
        ? Math.round((unitsComplete / unitsTotal) * 100)
        : 0
  const practicePassed = haUnits.filter((u) => u.grade.practicePassed).length
  const homeworkHref =
    actionableHomework.length === 1
      ? (`/homework/${actionableHomework[0]!.id}` as '/')
      : ('/homework' as '/')
  const homeworkTitle =
    actionableHomework.length === 1
      ? actionableHomework[0]!.title
      : t('attention.homeworkPendingTitle', { count: actionableHomework.length })
  const sessionConfirmTitle =
    unconfirmedSessions.length === 1
      ? t('attention.sessionConfirmTitleOne')
      : t('attention.sessionConfirmTitle', { count: unconfirmedSessions.length })

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-cream-300 pb-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
            {t('courseLabel')}
          </p>
          <h1 className="mt-1 font-display text-2xl text-green-900 sm:text-3xl">
            {t(`greeting.${greetingKey}`, { name: firstName || t('learner') })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip state={overallPct > 0 ? 'in_progress' : 'not_started'} />
          <Button asChild size="sm" variant="outline">
            <Link href={'/progress' as '/'}>{t('viewProgress')}</Link>
          </Button>
          <Button asChild size="sm" className="bg-gold-500 text-green-950 hover:bg-gold-600">
            <Link href={'/certificates' as '/'}>
              <Award className="size-3.5" />
              {t('viewCertificate')}
            </Link>
          </Button>
        </div>
      </header>

      {unconfirmedSessions.length > 0 ? (
        <Link
          href={'/sessions' as '/'}
          className="group flex items-start justify-between gap-4 rounded-xl border-2 border-warning-400 bg-warning-50 p-5 shadow-sm transition-colors hover:bg-warning-100/80"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-warning-500/15 text-warning-700">
              <Video className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold tracking-[0.14em] text-warning-700 uppercase">
                {t('attention.eyebrow')}
              </p>
              <h2 className="font-display text-xl text-green-900 group-hover:text-green-800">
                {sessionConfirmTitle}
              </h2>
              <p className="text-sm text-green-800/80">
                {unconfirmedSessions.length === 1
                  ? t('attention.sessionConfirmBodyOne')
                  : t('attention.sessionConfirmBody', { count: unconfirmedSessions.length })}
              </p>
            </div>
          </div>
          <span className="mt-1 inline-flex shrink-0 items-center gap-1 text-sm font-medium text-warning-700">
            {t('attention.sessionConfirmCta')}
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ) : null}

      {actionableHomework.length > 0 ? (
        <Link
          href={homeworkHref}
          className="group flex items-start justify-between gap-4 rounded-xl border-2 border-gold-400 bg-gold-50 p-5 shadow-sm transition-colors hover:bg-gold-100/80"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold-500/15 text-gold-700">
              <FileText className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
                {t('attention.eyebrow')}
              </p>
              <h2 className="font-display text-xl text-green-900 group-hover:text-green-800">
                {homeworkTitle}
              </h2>
              <p className="text-sm text-green-800/80">
                {actionableHomework.length === 1
                  ? t('attention.homeworkPendingBodyOne')
                  : t('attention.homeworkPendingBody', { count: actionableHomework.length })}
              </p>
            </div>
          </div>
          <span className="mt-1 inline-flex shrink-0 items-center gap-1 text-sm font-medium text-gold-700">
            {t('attention.homeworkCta')}
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ) : null}

      <section className="relative overflow-hidden rounded-2xl bg-green-900 p-6 text-cream-50 shadow-overlay sm:p-8">
        <div className="img-card-overlay-center absolute inset-0" aria-hidden />
        <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="max-w-xl space-y-3 text-center md:text-left">
            <span className="text-xs font-semibold tracking-[0.14em] text-gold-400 uppercase">
              {t('hero.eyebrow', { cefr: level.cefr })}
            </span>
            <h2 className="font-display text-3xl text-cream-50 sm:text-4xl">
              <AmharicText size="xl" className="mr-2 inline text-gold-400">
                {level.fidel}
              </AmharicText>
              — {level.title}
            </h2>
            <p className="text-sm text-cream-100/85">{t('hero.body')}</p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-xs md:justify-start">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-gold-400" />
                {t('hero.unitsComplete', { done: unitsComplete, total: unitsTotal })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-4 text-gold-400" />
                {t('hero.minutes')}
              </span>
            </div>
            <div className="pt-2">
              <Button asChild className="bg-gold-500 text-green-950 hover:bg-gold-400">
                <Link href={'/levels/ha' as '/'}>
                  {t('hero.cta')}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center rounded-xl border border-gold-400/30 bg-green-800/80 p-6 text-center shadow-lg">
            <FidelBadge level="ha" size="lg" dark />
            <span className="mt-2 text-xs font-bold text-gold-300">{t('hero.progressLabel')}</span>
            <div className="mt-2 h-2 w-32 overflow-hidden rounded-full bg-green-950">
              <div
                className="h-full bg-gold-500 transition-all"
                style={{ width: `${Math.min(100, Math.max(0, overallPct))}%` }}
              />
            </div>
            <span className="mt-1 text-[10px] text-cream-200">
              {t('hero.percent', { value: overallPct })}
            </span>
            <span className="mt-2 text-[10px] text-cream-200/80">
              {t('hero.practicePassed', { done: practicePassed, total: unitsTotal })}
            </span>
            <Button asChild size="sm" variant="ghost" className="mt-3 text-gold-300 hover:text-gold-200">
              <Link href={'/progress' as '/'}>{t('hero.seeDetail')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-4 font-display text-xl text-green-900">{t('parts.title')}</h3>
        <div className="grid gap-4 md:grid-cols-3 md:gap-6">
          {UNIT_PARTS.map((part) => (
            <Link
              key={part.id}
              href={part.href as '/'}
              className="group relative overflow-hidden rounded-xl border border-cream-300 bg-cream-50 p-6 shadow-card transition-all hover:shadow-card-hover"
            >
              <span className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
                {part.part}
              </span>
              <h4 className="mt-1 font-display text-2xl text-green-900">{part.title}</h4>
              <p className="mt-2 text-xs leading-relaxed text-green-600">{part.body}</p>
              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-gold-700 transition-transform group-hover:translate-x-0.5">
                <span>{part.cta}</span>
                <ChevronRight className="size-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-xl text-green-900">{t('units.title')}</h3>

        <div className="flex flex-col gap-4 rounded-xl border-2 border-gold-400 bg-gold-50/50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <AmharicText size="lg" className="text-gold-600">
              {activeUnit.number}
            </AmharicText>
            <div>
              <span className="text-[10px] font-bold tracking-[0.14em] text-gold-700 uppercase">
                {t('units.active')}
              </span>
              <h4 className="text-base font-bold text-green-900">
                {activeUnit.title}
                {activeUnit.amharic ? (
                  <>
                    {' '}
                    (
                    <AmharicText size="sm" className="inline text-base text-gold-700">
                      {activeUnit.amharic}
                    </AmharicText>
                    )
                  </>
                ) : null}
              </h4>
              <p className="text-xs text-green-600">{activeUnit.description}</p>
            </div>
          </div>
          <Button asChild className="shrink-0 bg-green-700 text-cream-50 hover:bg-green-600">
            <Link href={'/levels/ha' as '/'}>{t('units.openUnit')}</Link>
          </Button>
        </div>

        {HA_UNITS.filter((u) => u.locked).map((unit) => (
          <div
            key={unit.id}
            className="flex items-center justify-between rounded-xl border border-cream-300 bg-cream-50 p-4 opacity-75"
          >
            <div className="flex items-center gap-4">
              <AmharicText size="lg" className="text-green-400">
                {unit.number}
              </AmharicText>
              <div>
                <span className="text-[10px] font-bold tracking-[0.14em] text-green-500 uppercase">
                  {t('units.locked')}
                </span>
                <h4 className="text-base font-bold text-green-900">{unit.title}</h4>
                <p className="text-xs text-green-600">{unit.description}</p>
              </div>
            </div>
            <StatusChip state="locked" />
          </div>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {t('ladder.eyebrow')}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-green-700">{t('ladder.title')}</h2>
          </div>
          <Link href={'/levels' as '/'} className="text-sm font-medium text-green-700 hover:underline">
            {t('ladder.viewAll')}
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {LEVELS.map((item) => (
            <div
              key={item.id}
              className={
                item.comingSoon
                  ? 'flex flex-col items-center rounded-xl border border-cream-300 bg-cream-50/70 px-3 py-5 text-center opacity-60'
                  : 'flex flex-col items-center rounded-xl border border-gold-300 bg-gold-50 px-3 py-5 text-center shadow-card ring-1 ring-gold-200'
              }
            >
              <AmharicText
                size="lg"
                className={item.comingSoon ? 'text-green-400' : 'text-gold-500'}
              >
                {item.fidel}
              </AmharicText>
              <p className="mt-2 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                {item.cefr}
              </p>
              <p className="mt-1 text-sm font-medium text-green-700">{item.title}</p>
              <span
                className={
                  item.comingSoon
                    ? 'mt-2 text-[11px] font-medium text-muted-foreground'
                    : 'mt-2 text-[11px] font-semibold text-gold-700'
                }
              >
                {item.comingSoon ? t('ladder.comingSoon') : t('ladder.available')}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { BookOpen, GraduationCap, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { routes } from '@/lib/auth/routes'
import { getRequestAccessUrl } from '@/lib/public-config'

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Self-paced Amharic curriculum, live teacher sessions, and verifiable certificates — one path for every learner.',
}

export default async function ServicesPage() {
  const t = await getTranslations('marketing.services')
  const requestUrl = getRequestAccessUrl()

  const items = [
    {
      icon: BookOpen,
      title: t('selfTitle'),
      body: t('selfBody'),
    },
    {
      icon: Users,
      title: t('liveTitle'),
      body: t('liveBody'),
    },
    {
      icon: GraduationCap,
      title: t('certTitle'),
      body: t('certBody'),
    },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold tracking-widest text-gold-700 uppercase">{t('eyebrow')}</p>
        <h1 className="font-display mt-3 text-4xl text-green-700 sm:text-5xl">{t('title')}</h1>
        <p className="mt-5 text-lg leading-relaxed text-green-700/70">{t('lead')}</p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {items.map(({ icon: Icon, title, body }) => (
          <article
            key={title}
            className="rounded-2xl border border-cream-300 bg-cream-50 p-7 shadow-card"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/15 text-gold-700">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold text-green-700">{title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-green-700/65">{body}</p>
          </article>
        ))}
      </div>

      <div className="mt-14 rounded-[2rem] bg-green-700 px-8 py-12 text-center text-cream-50 sm:px-12">
        <h2 className="font-display text-3xl sm:text-4xl">{t('ctaTitle')}</h2>
        <p className="mx-auto mt-3 max-w-xl text-cream-50/75">{t('ctaBody')}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {requestUrl ? (
            <Button
              asChild
              className="rounded-full bg-gold-500 text-green-900 hover:bg-gold-400"
            >
              <a href={requestUrl} target="_blank" rel="noopener noreferrer">
                {t('ctaPrimary')}
              </a>
            </Button>
          ) : (
            <Button asChild className="rounded-full bg-gold-500 text-green-900 hover:bg-gold-400">
              <Link href={routes.login}>{t('ctaLogin')}</Link>
            </Button>
          )}
          <Button
            asChild
            variant="outline"
            className="rounded-full border-cream-50/20 bg-transparent text-cream-50 hover:bg-cream-50/10"
          >
            <Link href={routes.contact}>{t('ctaContact')}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

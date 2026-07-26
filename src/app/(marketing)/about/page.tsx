import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/shared/brand-logo'
import { routes } from '@/lib/auth/routes'
import { getRequestAccessUrl } from '@/lib/public-config'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Fidel teaches Amharic the way Ethiopia is actually spoken — for diplomats, NGO staff, researchers, and diaspora.',
}

export default async function AboutPage() {
  const t = await getTranslations('marketing.about')
  const requestUrl = getRequestAccessUrl()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-bold tracking-widest text-gold-700 uppercase">{t('eyebrow')}</p>
      <h1 className="font-display mt-3 text-4xl text-green-700 sm:text-5xl">{t('title')}</h1>
      <p className="mt-5 text-lg leading-relaxed text-green-700/70">{t('lead')}</p>

      <div className="mt-10 space-y-8 text-base leading-relaxed text-green-700/75">
        <p>{t('p1')}</p>
        <p>{t('p2')}</p>
        <p>{t('p3')}</p>
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-6 rounded-2xl border border-cream-300 bg-cream-50 p-6 sm:p-8">
        <BrandLogo size={88} showWordmark={false} />
        <div className="flex-1 space-y-3">
          <p className="font-display text-2xl text-green-700">{t('ctaTitle')}</p>
          <p className="text-sm text-green-700/65">{t('ctaBody')}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            {requestUrl ? (
              <Button asChild className="rounded-full bg-green-700 text-cream-100 hover:bg-green-800">
                <a href={requestUrl} target="_blank" rel="noopener noreferrer">
                  {t('ctaPrimary')}
                </a>
              </Button>
            ) : (
              <Button asChild className="rounded-full bg-green-700 text-cream-100 hover:bg-green-800">
                <Link href={routes.login}>{t('ctaLogin')}</Link>
              </Button>
            )}
            <Button asChild variant="outline" className="rounded-full">
              <Link href={routes.contact}>{t('ctaContact')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

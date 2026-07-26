import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Mail, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { routes } from '@/lib/auth/routes'
import { getRequestAccessUrl } from '@/lib/public-config'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Request access to Fidel or get in touch with the team.',
}

export default async function ContactPage() {
  const t = await getTranslations('marketing.contact')
  const requestUrl = getRequestAccessUrl()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-bold tracking-widest text-gold-700 uppercase">{t('eyebrow')}</p>
      <h1 className="font-display mt-3 text-4xl text-green-700 sm:text-5xl">{t('title')}</h1>
      <p className="mt-5 text-lg leading-relaxed text-green-700/70">{t('lead')}</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-cream-300 bg-cream-50 p-6 shadow-card">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/15 text-gold-700">
            <MessageSquare className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-green-700">{t('accessTitle')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-green-700/65">{t('accessBody')}</p>
          <div className="mt-5">
            {requestUrl ? (
              <Button asChild className="rounded-full bg-green-700 text-cream-100 hover:bg-green-800">
                <a href={requestUrl} target="_blank" rel="noopener noreferrer">
                  {t('accessCta')}
                </a>
              </Button>
            ) : (
              <Button asChild className="rounded-full bg-green-700 text-cream-100 hover:bg-green-800">
                <Link href={routes.login}>{t('loginCta')}</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-cream-300 bg-cream-50 p-6 shadow-card">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/15 text-gold-700">
            <Mail className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-green-700">{t('emailTitle')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-green-700/65">{t('emailBody')}</p>
          <a
            href="mailto:hello@fidel.et"
            className="mt-5 inline-block text-sm font-semibold text-gold-700 underline-offset-4 hover:underline"
          >
            hello@fidel.et
          </a>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-green-700/55">{t('note')}</p>
    </div>
  )
}

import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { routes } from '@/lib/auth/routes'
import { getRequestAccessUrl } from '@/lib/public-config'

export async function ServicesCta() {
  const t = await getTranslations('marketing.services')
  const requestUrl = getRequestAccessUrl()

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="relative overflow-hidden rounded-[2rem] bg-green-700 px-8 py-12 text-center text-cream-50 sm:rounded-[3rem] sm:px-12 sm:py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/15 to-transparent" />
        <div className="relative z-10">
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
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            ) : (
              <Button asChild className="rounded-full bg-gold-500 text-green-900 hover:bg-gold-400">
                <Link href={routes.login}>
                  {t('ctaLogin')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
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
    </section>
  )
}

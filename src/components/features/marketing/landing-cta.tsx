'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getRequestAccessUrl } from '@/lib/public-config'
import { routes } from '@/lib/auth/routes'

export function LandingCta() {
  const t = useTranslations('marketing.cta')
  const tNav = useTranslations('marketing.nav')
  const requestUrl = getRequestAccessUrl()

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="group relative overflow-hidden rounded-[2rem] bg-green-700 p-10 text-center text-cream-50 sm:rounded-[3rem] sm:p-16">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/20 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

        <div className="relative z-10 space-y-6 sm:space-y-8">
          <h2 className="font-display mx-auto max-w-2xl text-3xl sm:text-4xl lg:text-5xl">
            {t('title')}
          </h2>
          <p className="mx-auto max-w-xl text-base opacity-80 sm:text-xl">{t('body')}</p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {requestUrl ? (
              <Button
                asChild
                className="rounded-full border border-gold-500/30 bg-transparent px-8 py-4 font-bold text-gold-400 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-gold-500 hover:text-green-900 sm:px-10"
              >
                <a href={requestUrl} target="_blank" rel="noopener noreferrer">
                  {t('primary')}
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Button>
            ) : (
              <Button
                asChild
                className="rounded-full border border-gold-500/30 bg-transparent px-8 py-4 font-bold text-gold-400 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-gold-500 hover:text-green-900 sm:px-10"
              >
                <Link href={routes.login}>
                  {tNav('login')}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              className="rounded-full border-cream-50/10 bg-cream-50/10 px-8 py-4 font-bold text-cream-50 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-cream-50/20 hover:bg-cream-50/20 sm:px-10"
            >
              <Link href={routes.login}>{t('secondary')}</Link>
            </Button>
          </div>
        </div>

        <div className="pointer-events-none absolute top-0 right-0 h-full w-1/2 opacity-10">
          <svg
            className="h-full w-full transition-transform duration-1000 group-hover:scale-110"
            viewBox="0 0 400 400"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M47.7,-63.3C61.4,-54.6,71.7,-39.8,76.5,-23.6C81.3,-7.4,80.7,10.2,74.5,25.8C68.4,41.4,56.7,55,42.4,63.9C28.2,72.9,11.4,77.2,-5.1,84.3C-21.7,91.3,-38.1,101.1,-52,97.3C-65.8,93.5,-77,76.1,-83.4,58C-89.8,39.9,-91.4,21.1,-87.3,4.4C-83.3,-12.3,-73.6,-26.8,-63.1,-39.1C-52.6,-51.4,-41.2,-61.6,-28.4,-67.9C-15.6,-74.1,-1.3,-76.3,12.7,-74.2C26.6,-72,41.1,-65.4,47.7,-63.3Z"
              fill="currentColor"
              transform="translate(200 200)"
            />
          </svg>
        </div>
      </div>
    </section>
  )
}

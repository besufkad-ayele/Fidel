'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AmharicText } from '@/components/shared/amharic-text'
import { BrandLogo } from '@/components/shared/brand-logo'
import { LEVELS } from '@/lib/constants/brand'
import { getRequestAccessUrl } from '@/lib/public-config'
import { routes } from '@/lib/auth/routes'

export function LandingHero() {
  const t = useTranslations('marketing.hero')
  const tNav = useTranslations('marketing.nav')
  const [hoveredCard, setHoveredCard] = useState(false)
  const requestUrl = getRequestAccessUrl()

  return (
    <header className="hero-gradient relative overflow-hidden pt-8 pb-20 sm:pt-12 sm:pb-32">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="absolute right-10 bottom-20 h-96 w-96 rounded-full bg-green-700/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-gold-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-6 sm:space-y-8">
          <div className="inline-flex cursor-default items-center gap-2 rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-xs font-bold tracking-widest text-gold-700 uppercase transition-colors hover:bg-gold-500/20">
            <Sparkles className="h-3 w-3" />
            {t('eyebrow')}
          </div>

          <h1 className="font-display text-4xl leading-tight text-green-700 sm:text-5xl lg:text-7xl xl:text-8xl">
            <span className="inline-block">{t('titleLine1')}</span>
            <br />
            <span className="inline-block text-gold-500 italic">{t('titleLine2')}</span>
          </h1>

          <p className="max-w-lg text-base leading-relaxed text-green-700/70 sm:text-lg lg:text-xl">
            {t('body')}
          </p>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:flex-wrap sm:gap-4">
            {requestUrl ? (
              <Button
                asChild
                size="lg"
                className="group rounded-full bg-green-700 px-6 py-3 text-base font-semibold text-cream-100 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-green-800 hover:shadow-xl sm:px-8 sm:py-4 sm:text-lg"
              >
                <a href={requestUrl} target="_blank" rel="noopener noreferrer">
                  {t('primaryCta')}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="group rounded-full bg-green-700 px-6 py-3 text-base font-semibold text-cream-100 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-green-800 hover:shadow-xl sm:px-8 sm:py-4 sm:text-lg"
              >
                <Link href={routes.login}>
                  {tNav('login')}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            )}
            <Button
              asChild
              size="lg"
              variant="outline"
              className="group rounded-full border-cream-400 px-6 py-3 text-base font-semibold transition-all duration-300 hover:bg-cream-50 sm:px-8 sm:py-4 sm:text-lg"
            >
              <a href="#levels">
                <BookOpen className="h-5 w-5 text-gold-500 transition-transform group-hover:scale-110 sm:h-6 sm:w-6" />
                {t('secondaryCta')}
              </a>
            </Button>
          </div>

          <div className="flex items-center gap-4 pt-6 sm:pt-8">
            <div className="flex -space-x-2">
              {LEVELS.slice(0, 4).map((level) => (
                <span
                  key={level.id}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-cream-100 bg-cream-50 text-gold-600 shadow-sm sm:h-10 sm:w-10"
                >
                  <AmharicText size="sm" className="text-base leading-none">
                    {level.fidel}
                  </AmharicText>
                </span>
              ))}
            </div>
            <p className="text-xs font-medium text-green-700/60 sm:text-sm">{t('socialProof')}</p>
          </div>
        </div>

        <div className="relative mt-8 lg:mt-0">
          <div
            className={`cursor-default rounded-2xl border border-cream-300 bg-cream-50 p-3 shadow-2xl transition-all duration-500 sm:p-4 ${
              hoveredCard ? 'scale-105 rotate-0 shadow-overlay' : 'rotate-2 hover:rotate-0'
            }`}
            onMouseEnter={() => setHoveredCard(true)}
            onMouseLeave={() => setHoveredCard(false)}
          >
            <div className="img-card-fallback relative aspect-[4/3] overflow-hidden rounded-xl">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-6">
                <BrandLogo size={140} showWordmark={false} priority />
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {LEVELS.map((level) => (
                    <span
                      key={level.id}
                      className={`flex h-12 w-12 items-center justify-center rounded-lg border sm:h-14 sm:w-14 ${
                        level.comingSoon
                          ? 'border-cream-50/15 bg-cream-50/5 text-cream-50/40'
                          : 'border-gold-500/40 bg-gold-500/20 text-gold-300'
                      }`}
                    >
                      <AmharicText size="md" className="text-2xl leading-none">
                        {level.fidel}
                      </AmharicText>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div
              className={`absolute -bottom-4 -left-4 max-w-[200px] rounded-xl bg-gold-500 p-4 text-green-900 shadow-xl transition-all duration-300 sm:-bottom-6 sm:-left-6 sm:max-w-[240px] sm:p-6 ${
                hoveredCard ? 'scale-105 shadow-2xl' : ''
              }`}
            >
              <p className="font-display text-sm leading-tight sm:text-2xl">{t('badge')}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

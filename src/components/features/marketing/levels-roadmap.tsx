import { getTranslations } from 'next-intl/server'
import { Lock } from 'lucide-react'
import { AmharicText } from '@/components/shared/amharic-text'
import { LEVELS } from '@/lib/constants/brand'

export async function LevelsRoadmap() {
  const t = await getTranslations('marketing.levels')

  return (
    <section id="levels" className="py-16 sm:py-24 lg:py-32">
      <div className="mx-auto mb-12 max-w-7xl px-4 text-center sm:mb-16 sm:px-6 lg:mb-20">
        <span className="mb-4 block text-xs font-bold tracking-widest text-gold-700 uppercase">
          {t('eyebrow')}
        </span>
        <h2 className="font-display mb-4 text-3xl text-green-700 sm:mb-6 sm:text-4xl lg:text-5xl">
          {t('title')}
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-green-700/65 sm:text-base">{t('body')}</p>
      </div>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 sm:gap-6 sm:px-6 lg:grid-cols-3">
        {LEVELS.map((level) => {
          const available = !level.comingSoon

          return (
            <article
              key={level.id}
              className={`relative rounded-2xl p-6 transition-all sm:p-8 ${
                available
                  ? 'z-10 scale-[1.02] border-2 border-green-700 bg-cream-50 shadow-xl'
                  : 'border border-cream-300 bg-cream-50/50 opacity-70'
              }`}
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg sm:mb-6 ${
                  available ? 'bg-green-700 text-cream-50' : 'bg-cream-200 text-green-700/40'
                }`}
              >
                {available ? (
                  <AmharicText size="md" className="text-2xl leading-none text-gold-400">
                    {level.fidel}
                  </AmharicText>
                ) : (
                  <Lock className="h-5 w-5" />
                )}
              </div>

              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-green-700">
                  <AmharicText size="sm" className="mr-1 inline text-xl leading-none text-gold-600">
                    {level.fidel}
                  </AmharicText>
                  {level.title}
                </h3>
                <span
                  className={`shrink-0 rounded-sm px-2 py-1 text-xs font-medium ${
                    available
                      ? 'bg-gold-100 text-gold-800'
                      : 'bg-cream-200 text-green-700/60'
                  }`}
                >
                  {available ? t('available') : t('comingSoon')}
                </span>
              </div>

              <p className="mb-4 text-xs tracking-widest text-green-700/50 uppercase sm:mb-6">
                CEFR {level.cefr}
              </p>

              {available ? (
                <div className="w-full rounded-md bg-green-700 py-2 text-center text-xs font-bold tracking-widest text-cream-50 uppercase">
                  {t('unlocked')}
                </div>
              ) : (
                <div className="h-1 w-full rounded bg-cream-300" />
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

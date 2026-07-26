import { BookOpen, CheckCircle, GraduationCap, Target, Users } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { AmharicText } from '@/components/shared/amharic-text'

export async function HybridBand() {
  const t = await getTranslations('marketing.hybrid')

  return (
    <section className="overflow-hidden bg-green-700 py-16 text-cream-50 sm:py-20 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20">
        <div className="relative order-2 lg:order-1">
          <div className="rounded-2xl border border-cream-50/20 bg-cream-50/5 p-6 backdrop-blur-sm sm:p-8">
            <div className="mb-4 flex gap-2 sm:mb-6">
              <div className="h-3 w-3 rounded-full bg-red-400/50" />
              <div className="h-3 w-3 rounded-full bg-yellow-400/50" />
              <div className="h-3 w-3 rounded-full bg-green-400/50" />
            </div>
            <div className="space-y-4 sm:space-y-6">
              <div className="rounded-lg border border-cream-50/10 bg-cream-50/5 p-3 sm:p-4">
                <div className="mb-2 flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-gold-500" />
                  <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">
                    {t('mockCultureLabel')}
                  </span>
                </div>
                <p className="text-xs italic opacity-90 sm:text-sm">{t('mockCulture')}</p>
              </div>
              <div className="ml-4 rounded-lg border border-gold-500/30 bg-gold-500/20 p-3 sm:ml-8 sm:p-4">
                <div className="mb-2 flex items-center gap-2">
                  <AmharicText size="sm" className="text-lg leading-none text-gold-300">
                    ሰላም
                  </AmharicText>
                  <span className="text-xs font-medium text-cream-50/80 sm:text-sm">
                    {t('mockLesson')}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-cream-50/10 bg-cream-50/5 p-3 sm:p-4">
                <div className="mb-2 flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-300" />
                  <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">
                    {t('mockReadyLabel')}
                  </span>
                </div>
                <p className="text-xs sm:text-sm">{t('mockReady')}</p>
              </div>
            </div>
          </div>
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gold-500/20 blur-3xl sm:h-40 sm:w-40" />
          <div className="absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl sm:h-64 sm:w-64" />
        </div>

        <div className="order-1 space-y-6 sm:space-y-8 lg:order-2">
          <h2 className="font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">
            {t('titleLine1')}
            <br />
            {t('titleLine2')}
          </h2>
          <p className="text-base leading-relaxed opacity-80 sm:text-lg">{t('body')}</p>
          <div className="space-y-4 sm:space-y-6">
            <div className="flex gap-3 sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500/20">
                <Target className="h-5 w-5 text-gold-500" />
              </div>
              <div>
                <h4 className="mb-1 text-base font-bold sm:text-lg">{t('feature1Title')}</h4>
                <p className="text-xs opacity-70 sm:text-sm">{t('feature1Body')}</p>
              </div>
            </div>
            <div className="flex gap-3 sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500/20">
                <Users className="h-5 w-5 text-gold-500" />
              </div>
              <div>
                <h4 className="mb-1 text-base font-bold sm:text-lg">{t('feature2Title')}</h4>
                <p className="text-xs opacity-70 sm:text-sm">{t('feature2Body')}</p>
              </div>
            </div>
            <div className="flex gap-3 sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500/20">
                <GraduationCap className="h-5 w-5 text-gold-500" />
              </div>
              <div>
                <h4 className="mb-1 text-base font-bold sm:text-lg">{t('feature3Title')}</h4>
                <p className="text-xs opacity-70 sm:text-sm">{t('feature3Body')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

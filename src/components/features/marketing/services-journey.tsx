import { getTranslations } from 'next-intl/server'
import { BookMarked, CalendarCheck, KeyRound, Award } from 'lucide-react'

export async function ServicesJourney() {
  const t = await getTranslations('marketing.services.journey')

  const steps = [
    { icon: KeyRound, title: t('step1Title'), body: t('step1Body') },
    { icon: BookMarked, title: t('step2Title'), body: t('step2Body') },
    { icon: CalendarCheck, title: t('step3Title'), body: t('step3Body') },
    { icon: Award, title: t('step4Title'), body: t('step4Body') },
  ]

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <span className="mb-4 block text-xs font-bold tracking-widest text-gold-700 uppercase">
            {t('eyebrow')}
          </span>
          <h2 className="font-display mb-4 text-3xl text-green-700 sm:text-4xl">{t('title')}</h2>
          <p className="text-base text-green-700/65 sm:text-lg">{t('body')}</p>
        </div>

        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, body }, index) => (
            <li
              key={title}
              className="relative rounded-2xl border border-cream-300 bg-cream-50 p-6 sm:p-7"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="font-display text-3xl text-gold-500/40">{index + 1}</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-700/10 text-green-700">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-green-700">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-green-700/65">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

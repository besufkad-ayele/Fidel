import { getTranslations } from 'next-intl/server'
import { Landmark, Languages, Mic2 } from 'lucide-react'

export async function LessonParts() {
  const t = await getTranslations('marketing.parts')

  const parts = [
    {
      icon: Landmark,
      part: t('culture.part'),
      title: t('culture.title'),
      body: t('culture.body'),
      points: [t('culture.point1'), t('culture.point2'), t('culture.point3')],
    },
    {
      icon: Languages,
      part: t('language.part'),
      title: t('language.title'),
      body: t('language.body'),
      points: [t('language.point1'), t('language.point2'), t('language.point3')],
    },
    {
      icon: Mic2,
      part: t('practice.part'),
      title: t('practice.title'),
      body: t('practice.body'),
      points: [t('practice.point1'), t('practice.point2'), t('practice.point3')],
    },
  ]

  return (
    <section id="parts" className="border-t border-cream-300/70 bg-cream-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center sm:mb-16">
          <span className="mb-4 block text-xs font-bold tracking-widest text-gold-700 uppercase">
            {t('eyebrow')}
          </span>
          <h2 className="font-display mb-4 text-3xl text-green-700 sm:text-4xl lg:text-5xl">
            {t('title')}
          </h2>
          <p className="text-base text-green-700/65 sm:text-lg">{t('body')}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {parts.map(({ icon: Icon, part, title, body, points }) => (
            <article
              key={part}
              className="flex flex-col rounded-2xl border border-cream-300 bg-cream-100 p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover sm:p-8"
            >
              <div className="mb-6 flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold tracking-[0.18em] text-gold-700 uppercase">
                  {part}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/15 text-gold-700">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="font-display text-2xl text-green-700">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-green-700/65">{body}</p>
              <ul className="mt-6 space-y-2.5 border-t border-cream-300 pt-5">
                {points.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm text-green-700/75">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

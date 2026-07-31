import { getTranslations } from 'next-intl/server'
import { BookOpen, GraduationCap, Users } from 'lucide-react'

export async function ServicesOfferings() {
  const t = await getTranslations('marketing.services')

  const offerings = [
    {
      icon: BookOpen,
      key: 'self' as const,
    },
    {
      icon: Users,
      key: 'live' as const,
    },
    {
      icon: GraduationCap,
      key: 'cert' as const,
    },
  ]

  return (
    <section className="border-t border-cream-300/70 bg-cream-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <span className="mb-4 block text-xs font-bold tracking-widest text-gold-700 uppercase">
            {t('offeringsEyebrow')}
          </span>
          <h2 className="font-display mb-4 text-3xl text-green-700 sm:text-4xl">
            {t('offeringsTitle')}
          </h2>
          <p className="text-base text-green-700/65 sm:text-lg">{t('offeringsBody')}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {offerings.map(({ icon: Icon, key }) => (
            <article
              key={key}
              className="flex flex-col rounded-2xl border border-cream-300 bg-cream-100 p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover sm:p-8"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/15 text-gold-700">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-2xl text-green-700">{t(`${key}.title`)}</h3>
              <p className="mt-3 text-sm leading-relaxed text-green-700/65">{t(`${key}.body`)}</p>
              <ul className="mt-6 space-y-2.5 border-t border-cream-300 pt-5">
                {([1, 2, 3, 4] as const).map((n) => (
                  <li key={n} className="flex gap-2.5 text-sm text-green-700/75">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                    {t(`${key}.point${n}`)}
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

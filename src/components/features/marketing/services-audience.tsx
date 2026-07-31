import { getTranslations } from 'next-intl/server'
import { Briefcase, Globe2, HeartHandshake, Microscope } from 'lucide-react'

export async function ServicesAudience() {
  const t = await getTranslations('marketing.services.audience')

  const audiences = [
    {
      icon: Briefcase,
      title: t('diplomatTitle'),
      body: t('diplomatBody'),
    },
    {
      icon: Globe2,
      title: t('ngoTitle'),
      body: t('ngoBody'),
    },
    {
      icon: Microscope,
      title: t('researchTitle'),
      body: t('researchBody'),
    },
    {
      icon: HeartHandshake,
      title: t('diasporaTitle'),
      body: t('diasporaBody'),
    },
  ]

  return (
    <section className="border-t border-cream-300/70 bg-cream-200/40 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <span className="mb-4 block text-xs font-bold tracking-widest text-gold-700 uppercase">
            {t('eyebrow')}
          </span>
          <h2 className="font-display mb-4 text-3xl text-green-700 sm:text-4xl">{t('title')}</h2>
          <p className="text-base text-green-700/65 sm:text-lg">{t('body')}</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-2xl border border-cream-300 bg-cream-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/15 text-gold-700">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-green-700">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-green-700/65">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

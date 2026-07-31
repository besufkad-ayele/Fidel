import { getTranslations } from 'next-intl/server'
import { Building2, Layers, Eye } from 'lucide-react'

export async function ServicesOrg() {
  const t = await getTranslations('marketing.services.org')

  const features = [
    {
      icon: Building2,
      title: t('feature1Title'),
      body: t('feature1Body'),
    },
    {
      icon: Layers,
      title: t('feature2Title'),
      body: t('feature2Body'),
    },
    {
      icon: Eye,
      title: t('feature3Title'),
      body: t('feature3Body'),
    },
  ]

  return (
    <section className="overflow-hidden bg-green-700 py-16 text-cream-50 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-14">
          <span className="mb-4 block text-xs font-bold tracking-widest text-gold-400 uppercase">
            {t('eyebrow')}
          </span>
          <h2 className="font-display mb-4 text-3xl sm:text-4xl">{t('title')}</h2>
          <p className="text-base text-cream-50/75 sm:text-lg">{t('body')}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-cream-50/15 bg-cream-50/5 p-6 backdrop-blur-sm sm:p-8"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-gold-500/20 text-gold-400">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream-50/70">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

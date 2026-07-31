import { getTranslations } from 'next-intl/server'

export async function ServicesHero() {
  const t = await getTranslations('marketing.services')

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 pb-4 sm:px-6 sm:pt-10 sm:pb-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold tracking-widest text-gold-700 uppercase">{t('eyebrow')}</p>
        <h1 className="font-display mt-3 text-4xl text-green-700 sm:text-5xl lg:text-6xl">
          {t('title')}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-green-700/70">{t('lead')}</p>
      </div>
    </section>
  )
}

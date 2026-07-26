import { getTranslations } from 'next-intl/server'
import { WhyLearnStack, type WhyCard, type WhyIconKey } from './why-learn-stack'

const REASON_KEYS = [
  'nativeTeachers',
  'personalized',
  'flexible',
  'online',
  'culture',
  'homework',
  'levels',
] as const satisfies readonly WhyIconKey[]

export async function WhyLearnWithUs() {
  const t = await getTranslations('marketing.why')

  const cards: WhyCard[] = REASON_KEYS.map((key) => ({
    key,
    icon: key,
    title: t(`items.${key}.title`),
    body: t(`items.${key}.body`),
  }))

  return (
    <WhyLearnStack
      eyebrow={t('eyebrow')}
      title={t('title')}
      body={t('body')}
      scrollHint={t('scrollHint')}
      cards={cards}
    />
  )
}

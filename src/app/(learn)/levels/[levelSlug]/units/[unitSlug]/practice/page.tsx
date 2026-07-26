import type { Metadata } from 'next'
import { UnitPartPage } from '@/components/features/learn/unit-part-page'

type Props = {
  params: Promise<{ levelSlug: string; unitSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { unitSlug } = await params
  return { title: `Practice · ${unitSlug}` }
}

export default async function PracticePage({ params }: Props) {
  const { levelSlug, unitSlug } = await params
  return (
    <UnitPartPage levelSlug={levelSlug} unitSlug={unitSlug} partRoute="practice" />
  )
}

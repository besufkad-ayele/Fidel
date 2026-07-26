import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ levelSlug: string; unitSlug: string }>
}

export default async function UnitIndexPage({ params }: Props) {
  const { levelSlug, unitSlug } = await params
  redirect(`/levels/${levelSlug}/units/${unitSlug}/culture`)
}

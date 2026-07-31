import type { Metadata } from 'next'
import { ServicesHero } from '@/components/features/marketing/services-hero'
import { ServicesOfferings } from '@/components/features/marketing/services-offerings'
import { ServicesJourney } from '@/components/features/marketing/services-journey'
import { ServicesAudience } from '@/components/features/marketing/services-audience'
import { ServicesOrg } from '@/components/features/marketing/services-org'
import { ServicesCta } from '@/components/features/marketing/services-cta'

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Self-paced Amharic curriculum, live teacher sessions, and verifiable certificates — one path for every learner.',
}

export default function ServicesPage() {
  return (
    <>
      <ServicesHero />
      <ServicesOfferings />
      <ServicesJourney />
      <ServicesAudience />
      <ServicesOrg />
      <ServicesCta />
    </>
  )
}

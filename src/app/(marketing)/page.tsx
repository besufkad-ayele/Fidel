import { LandingHero } from '@/components/features/marketing/landing-hero'
import { WhyLearnWithUs } from '@/components/features/marketing/why-learn-with-us'
import { HowItWorks } from '@/components/features/marketing/how-it-works'
import { LessonParts } from '@/components/features/marketing/lesson-parts'
import { HybridBand } from '@/components/features/marketing/hybrid-band'
import { LevelsRoadmap } from '@/components/features/marketing/levels-roadmap'
import { LandingCta } from '@/components/features/marketing/landing-cta'

export default function LandingPage() {
  return (
    <>
      <LandingHero />
      <WhyLearnWithUs />
      <HowItWorks />
      <LessonParts />
      <HybridBand />
      <LevelsRoadmap />
      <LandingCta />
    </>
  )
}

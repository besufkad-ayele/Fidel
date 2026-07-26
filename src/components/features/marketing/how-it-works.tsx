'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { BookOpen, GraduationCap, Users } from 'lucide-react'

export function HowItWorks() {
  const t = useTranslations('marketing.how')
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const cards = [
    { icon: BookOpen, title: t('selfTitle'), description: t('selfBody') },
    { icon: Users, title: t('liveTitle'), description: t('liveBody') },
    { icon: GraduationCap, title: t('certTitle'), description: t('certBody') },
  ]

  return (
    <section id="how" className="bg-cream-200/50 py-24 sm:py-32">
      <div className="mx-auto mb-16 max-w-7xl px-4 text-center sm:mb-20 sm:px-6">
        <span className="mb-4 block text-xs font-bold tracking-widest text-gold-700 uppercase">
          {t('eyebrow')}
        </span>
        <h2 className="font-display mb-6 text-3xl text-green-700 sm:text-4xl lg:text-5xl">
          {t('title')}
        </h2>
        <p className="mx-auto max-w-2xl text-base text-green-700/65 sm:text-lg">{t('body')}</p>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-3 md:gap-8">
        {cards.map((card, index) => {
          const Icon = card.icon
          const active = hoveredCard === index

          return (
            <div
              key={card.title}
              className={`cursor-default rounded-2xl border bg-cream-50 p-8 transition-all duration-300 sm:p-10 ${
                active
                  ? '-translate-y-4 scale-105 border-gold-500/20 shadow-overlay'
                  : 'border-cream-300 shadow-card hover:-translate-y-2 hover:shadow-card-hover'
              }`}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div
                className={`mb-8 flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-300 ${
                  active
                    ? 'scale-110 bg-gold-500 text-green-900 shadow-lg'
                    : 'bg-gold-500/10 text-gold-700'
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-4 text-xl font-semibold text-green-700 sm:text-2xl">
                {card.title}
              </h3>
              <p className="leading-relaxed text-green-700/60">{card.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

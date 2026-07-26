'use client'

import { useEffect, useRef, useState } from 'react'
import {
  BookOpenCheck,
  CalendarClock,
  Globe2,
  GraduationCap,
  Sparkles,
  Users,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type WhyCard = {
  key: string
  title: string
  body: string
  icon: WhyIconKey
}

export type WhyIconKey =
  | 'nativeTeachers'
  | 'personalized'
  | 'flexible'
  | 'online'
  | 'culture'
  | 'homework'
  | 'levels'

const ICONS: Record<WhyIconKey, LucideIcon> = {
  nativeTeachers: Users,
  personalized: Sparkles,
  flexible: CalendarClock,
  online: Video,
  culture: Globe2,
  homework: BookOpenCheck,
  levels: GraduationCap,
}

/** Soft brand surfaces that stay within Fidel green/gold/cream */
const CARD_TONES = [
  'from-green-700 to-green-600',
  'from-green-800 to-green-700',
  'from-[#1f4542] to-green-700',
  'from-green-700 via-green-700 to-gold-800',
  'from-green-800 to-[#243f3d]',
  'from-[#183634] to-green-700',
  'from-green-700 to-[#2a4a48]',
] as const

/** Clear floating marketing nav + leave air above the stack */
const STICKY_BASE_PX = 128
/** Visible ledge of each previous card in the pile */
const STICKY_STEP_PX = 22

function stickyTopFor(index: number) {
  return STICKY_BASE_PX + index * STICKY_STEP_PX
}

type WhyStackProps = {
  eyebrow: string
  title: string
  body: string
  scrollHint: string
  cards: WhyCard[]
}

export function WhyLearnStack({ eyebrow, title, body, scrollHint, cards }: WhyStackProps) {
  const refs = useRef<(HTMLElement | null)[]>([])
  const [scales, setScales] = useState<number[]>(() => cards.map(() => 1))
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (reducedMotion) {
      setScales(cards.map(() => 1))
      return
    }

    let frame = 0

    const update = () => {
      const next = cards.map((_, i) => {
        const el = refs.current[i]
        if (!el) return 1
        const rect = el.getBoundingClientRect()
        // As a card sticks and the next one covers it, scale it down slightly
        const stickTop = stickyTopFor(i)
        const covered = stickTop - rect.top
        if (covered <= 0) return 1
        const progress = Math.min(1, covered / 220)
        return 1 - progress * 0.08
      })
      setScales(next)
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [cards, reducedMotion])

  return (
    <section id="why" className="relative border-t border-cream-300/70 bg-cream-100">
      {/* Atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-green-700/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 pt-20 pb-8 text-center sm:px-6 sm:pt-28">
        <span className="mb-4 block text-xs font-bold tracking-widest text-gold-700 uppercase">
          {eyebrow}
        </span>
        <h2 className="font-display text-3xl text-green-700 sm:text-4xl lg:text-5xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-green-700/65 sm:text-lg">{body}</p>
        <p className="mt-8 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-gold-700 uppercase">
          <span className="inline-block h-px w-8 bg-gold-500/60" />
          {scrollHint}
          <span className="inline-block h-px w-8 bg-gold-500/60" />
        </p>
      </div>

      <div className="relative mx-auto max-w-3xl px-4 pt-6 pb-[36vh] sm:px-6 sm:pt-10">
        {cards.map((card, index) => {
          const Icon = ICONS[card.icon]
          const tone = CARD_TONES[index % CARD_TONES.length]
          const scale = scales[index] ?? 1
          const stickyTop = stickyTopFor(index)

          return (
            <article
              key={card.key}
              ref={(el) => {
                refs.current[index] = el
              }}
              className={cn(
                'sticky mb-8 origin-top will-change-transform sm:mb-10',
                !reducedMotion && 'transition-[transform,filter] duration-150 ease-out',
              )}
              style={{
                top: stickyTop,
                zIndex: index + 1,
                transform: reducedMotion ? undefined : `scale(${scale})`,
                filter: reducedMotion
                  ? undefined
                  : `brightness(${(0.86 + (scale - 0.92) * (0.14 / 0.08)).toFixed(3)})`,
              }}
            >
              <div
                className={cn(
                  'group relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br p-1 shadow-overlay sm:rounded-[2rem]',
                  tone,
                )}
              >
                {/* Gold edge shimmer */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-40"
                  style={{
                    background:
                      'radial-gradient(ellipse at 20% 0%, rgb(214 173 96 / 0.35), transparent 55%)',
                  }}
                />

                <div className="relative overflow-hidden rounded-[1.5rem] bg-cream-50/95 backdrop-blur-sm sm:rounded-[1.75rem]">
                  <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:gap-8 sm:p-9">
                    <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-start">
                      <span className="flex size-14 items-center justify-center rounded-2xl bg-green-700 text-gold-400 shadow-card transition-transform duration-300 group-hover:scale-105 sm:size-16">
                        <Icon className="size-7 sm:size-8" strokeWidth={1.6} />
                      </span>
                      <span className="font-display text-4xl leading-none text-gold-500/80 tabular-nums sm:text-5xl">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 text-left">
                      <h3 className="font-display text-2xl tracking-tight text-green-700 sm:text-3xl">
                        {card.title}
                      </h3>
                      <p className="mt-3 text-base leading-relaxed text-green-700/65 sm:text-lg">
                        {card.body}
                      </p>
                      <div className="mt-6 h-px w-16 bg-gradient-to-r from-gold-500 to-transparent" />
                    </div>
                  </div>

                  {/* Bottom gold hairline */}
                  <div
                    aria-hidden
                    className="h-1 w-full bg-gradient-to-r from-transparent via-gold-500/50 to-transparent"
                  />
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

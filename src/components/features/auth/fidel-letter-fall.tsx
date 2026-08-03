'use client'

import { useEffect, useId, useState } from 'react'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/constants/brand'

const WORD = ['ፊ', 'ደ', 'ል'] as const

/** Soft ambient rain — other fidel syllables, not the word itself. */
const RAIN = ['ሀ', 'ለ', 'ሐ', 'መ', 'ሠ', 'ረ', 'ሰ', 'ሸ', 'ቀ', 'በ', 'ተ', 'ቸ', 'ነ', 'አ', 'ከ', 'ወ', 'ዘ', 'የ'] as const

type FidelLetterFallProps = {
  className?: string
  /** Dark green panel vs light form column */
  tone?: 'onDark' | 'onLight'
  /** Large hero vs compact mark above the form */
  size?: 'hero' | 'compact'
}

/**
 * SVG wordmark: Ethiopic letters fall and settle into ፊደል.
 * Uses Noto Sans Ethiopic via CSS variable. Honors prefers-reduced-motion.
 */
export function FidelLetterFall({
  className,
  tone = 'onDark',
  size = 'hero',
}: FidelLetterFallProps) {
  const uid = useId().replace(/:/g, '')
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const onChange = () => setReduceMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const isHero = size === 'hero'
  const fill = tone === 'onDark' ? '#fefdfb' : '#1a3636'
  const accent = tone === 'onDark' ? '#e0ba6f' : '#be9345'
  const rainFill = tone === 'onDark' ? 'rgba(254, 253, 251, 0.18)' : 'rgba(26, 54, 54, 0.12)'
  const viewW = isHero ? 520 : 280
  const viewH = isHero ? 280 : 120
  const wordY = isHero ? 168 : 78
  const fontSize = isHero ? 92 : 48
  const letterGap = isHero ? 118 : 64
  const startX = (viewW - (WORD.length - 1) * letterGap) / 2
  const ethiopicFont =
    'var(--font-zemenay), var(--font-noto-ethiopic), "Noto Sans Ethiopic", Nyala, sans-serif'

  return (
    <div
      className={cn('relative w-full select-none', className)}
      role="img"
      aria-label={`${BRAND.amharic} — ${BRAND.name}`}
    >
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        className="h-auto w-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id={`fidel-glow-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={accent} stopOpacity="0" />
            <stop offset="50%" stopColor={accent} stopOpacity="0.55" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        {!reduceMotion
          ? RAIN.map((ch, i) => {
              const x = 18 + ((i * 47) % (viewW - 36))
              const delay = (i % 9) * 0.55
              const dur = 7.5 + (i % 5) * 1.1
              const fs = isHero ? 18 + (i % 4) * 6 : 12 + (i % 3) * 3
              return (
                <g
                  key={`${ch}-${i}`}
                  className="fidel-rain-glyph"
                  style={
                    {
                      animationDelay: `${delay}s`,
                      animationDuration: `${dur}s`,
                      ['--rain-end' as string]: `${viewH + 40}px`,
                      transformOrigin: `${x}px 0px`,
                    } as React.CSSProperties
                  }
                >
                  <text
                    x={x}
                    y={-12}
                    fill={rainFill}
                    fontSize={fs}
                    style={{ fontFamily: ethiopicFont }}
                  >
                    {ch}
                  </text>
                </g>
              )
            })
          : null}

        <rect
          x={startX - fontSize * 0.35}
          y={wordY + fontSize * 0.28}
          width={(WORD.length - 1) * letterGap + fontSize * 0.7}
          height={isHero ? 3 : 2}
          rx={2}
          fill={`url(#fidel-glow-${uid})`}
          className={cn('fidel-word-underline', reduceMotion && 'fidel-motion-off')}
          style={{ transformOrigin: `${viewW / 2}px ${wordY + fontSize * 0.28}px` }}
        />

        {WORD.map((ch, i) => {
          const x = startX + i * letterGap
          return (
            <g
              key={ch}
              className={cn('fidel-fall-glyph', reduceMotion && 'fidel-motion-off')}
              style={
                {
                  animationDelay: reduceMotion ? '0s' : `${0.12 + i * 0.28}s`,
                  transformOrigin: `${x}px ${wordY}px`,
                } as React.CSSProperties
              }
            >
              <text
                x={x}
                y={wordY}
                textAnchor="middle"
                fill={i === 1 ? accent : fill}
                fontSize={fontSize}
                fontWeight={600}
                style={{ fontFamily: ethiopicFont }}
              >
                {ch}
              </text>
            </g>
          )
        })}
      </svg>

      <style>{`
        @keyframes fidelGlyphFall {
          0% {
            opacity: 0;
            transform: translateY(-120px) rotate(-9deg);
          }
          64% {
            opacity: 1;
            transform: translateY(8px) rotate(1.8deg);
          }
          80% {
            transform: translateY(-4px) rotate(-0.7deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
        }
        @keyframes fidelUnderlineIn {
          0%, 40% { opacity: 0; transform: scaleX(0.15); }
          100% { opacity: 1; transform: scaleX(1); }
        }
        @keyframes fidelRain {
          0% {
            opacity: 0;
            transform: translateY(0) rotate(0deg);
          }
          10% { opacity: 1; }
          90% { opacity: 0.25; }
          100% {
            opacity: 0;
            transform: translateY(var(--rain-end, 320px)) rotate(14deg);
          }
        }
        @keyframes fidelBreath {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }
        .fidel-fall-glyph {
          animation: fidelGlyphFall 1.2s cubic-bezier(0.22, 1, 0.36, 1) both,
            fidelBreath 5s ease-in-out 1.7s infinite;
        }
        .fidel-word-underline {
          animation: fidelUnderlineIn 1.55s cubic-bezier(0.22, 1, 0.36, 1) 0.5s both;
        }
        .fidel-rain-glyph {
          animation-name: fidelRain;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .fidel-motion-off {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .fidel-fall-glyph,
          .fidel-word-underline,
          .fidel-rain-glyph {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  )
}

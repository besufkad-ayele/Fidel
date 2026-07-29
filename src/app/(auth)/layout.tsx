import Link from 'next/link'
import { BrandLogo } from '@/components/shared/brand-logo'
import { FidelLetterFall } from '@/components/features/auth/fidel-letter-fall'
import { routes } from '@/lib/auth/routes'
import { BRAND } from '@/lib/constants/brand'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[46%_54%]">
      <aside className="relative hidden overflow-hidden lg:block">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 90% 70% at 20% 15%, #3d6360 0%, transparent 55%), radial-gradient(ellipse 70% 60% at 90% 80%, #2a4a48 0%, transparent 50%), linear-gradient(165deg, #1a3636 0%, #142a2a 48%, #0f2020 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(224,186,111,0.45) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="img-card-overlay absolute inset-0 opacity-40" />

        <div className="relative z-10 flex h-full min-h-[640px] flex-col justify-between p-10 text-cream-50 xl:p-12">
          <Link
            href={routes.home}
            className="inline-flex w-fit items-center gap-3"
            aria-label="Back to Fidel home"
          >
            <BrandLogo size={48} showWordmark={false} priority />
            <span className="font-display text-lg tracking-wide text-cream-100/90">{BRAND.name}</span>
          </Link>

          <div className="my-auto py-10">
            <FidelLetterFall tone="onDark" size="hero" className="max-w-xl" />
            <p className="mt-6 max-w-md font-display text-xl leading-snug text-cream-100/90 xl:text-2xl">
              Culture first. Language next. Practice until it sticks.
            </p>
            <p className="mt-3 max-w-sm text-sm text-cream-100/55">
              Built for diplomats, NGO staff, and returning diaspora in Ethiopia.
            </p>
          </div>

          <p className="text-xs tracking-wide text-cream-100/40 uppercase">
            {BRAND.amharic} · Amharic script
          </p>
        </div>
      </aside>

      <div className="relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-cream-50 via-cream-100/80 to-white px-4 py-10 sm:px-8">
        <div
          className="pointer-events-none absolute -top-24 right-[-10%] h-72 w-72 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #e0ba6f 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute bottom-[-10%] left-[-8%] h-80 w-80 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, #8fb0ac 0%, transparent 70%)' }}
        />

        <div className="relative z-10 w-full max-w-[460px] rounded-2xl border border-cream-300 bg-white/90 p-6 shadow-card backdrop-blur-sm sm:p-8">
          <div className="mb-2 flex flex-col items-center lg:mb-4">
            <Link href={routes.home} aria-label="Back to Fidel home" className="w-full max-w-[240px]">
              <FidelLetterFall tone="onLight" size="compact" />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

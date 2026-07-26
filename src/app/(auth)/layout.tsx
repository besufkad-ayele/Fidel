import Link from 'next/link'
import { AmharicText } from '@/components/shared/amharic-text'
import { routes } from '@/lib/auth/routes'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[42%_58%]">
      <aside className="relative hidden overflow-hidden bg-green-700 lg:block">
        <div className="img-card-overlay absolute inset-0" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-cream-50">
          <Link href={routes.home} className="flex items-center gap-2">
            <AmharicText size="xl" className="text-gold-400">
              ፊደል
            </AmharicText>
            <span className="font-display text-2xl">Fidel</span>
          </Link>
          <blockquote className="max-w-sm">
            <p className="font-display text-2xl leading-snug">
              Culture first. Language next. Practice until it sticks.
            </p>
            <footer className="mt-4 text-sm text-cream-100/70">
              Built for diplomats, NGO staff, and returning diaspora in Ethiopia.
            </footer>
          </blockquote>
        </div>
      </aside>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  )
}

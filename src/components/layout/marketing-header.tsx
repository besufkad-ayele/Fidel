'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/shared/brand-logo'
import { getRequestAccessUrl } from '@/lib/public-config'
import { routes } from '@/lib/auth/routes'
import { cn } from '@/lib/utils'

const NAV = [
  { href: routes.home, labelKey: 'home' as const },
  { href: routes.services, labelKey: 'services' as const },
  { href: routes.about, labelKey: 'about' as const },
  { href: routes.blog, labelKey: 'blog' as const },
  { href: routes.contact, labelKey: 'contact' as const },
]

export function MarketingHeader() {
  const t = useTranslations('marketing.nav')
  const pathname = usePathname()
  const requestUrl = getRequestAccessUrl()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <nav
        className={cn(
          'pointer-events-auto mx-auto max-w-5xl rounded-2xl border transition-all duration-300 sm:rounded-full',
          isScrolled
            ? 'border-cream-300/60 bg-cream-50/75 shadow-overlay backdrop-blur-xl'
            : 'border-cream-50/50 bg-cream-50/55 shadow-card backdrop-blur-lg',
        )}
      >
        <div className="flex h-16 items-center justify-between gap-3 px-3 sm:h-[4.5rem] sm:px-5">
          <Link href={routes.home} className="shrink-0" aria-label="Fidel home">
            <BrandLogo size={52} priority />
          </Link>

          <div className="hidden items-center gap-1 text-sm font-medium text-green-700/75 md:flex">
            {NAV.map((item) => {
              const active =
                item.href === routes.home
                  ? pathname === routes.home
                  : pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-full px-3.5 py-2 transition-colors hover:bg-cream-200/70 hover:text-green-700',
                    active && 'bg-cream-200/80 text-green-700',
                  )}
                >
                  {t(item.labelKey)}
                </Link>
              )
            })}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {requestUrl ? (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-sm font-medium hover:bg-cream-200/80"
                >
                  <Link href={routes.login}>{t('login')}</Link>
                </Button>
                <a
                  href={requestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-green-700 px-5 py-2 text-sm font-semibold text-cream-100 shadow-md transition-all hover:scale-[1.02] hover:bg-green-800"
                >
                  {t('requestAccess')}
                </a>
              </>
            ) : (
              <Link
                href={routes.login}
                className="rounded-full bg-green-700 px-5 py-2 text-sm font-semibold text-cream-100 shadow-md transition-all hover:scale-[1.02] hover:bg-green-800"
              >
                {t('login')}
              </Link>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full hover:bg-cream-200/80 md:hidden"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <div
          className={cn(
            'overflow-hidden transition-all duration-300 md:hidden',
            isMobileMenuOpen ? 'max-h-[32rem] opacity-100' : 'max-h-0 opacity-0',
          )}
        >

          <div className="space-y-1 border-t border-cream-300/60 px-3 py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-green-700/80 hover:bg-cream-200/70"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t(item.labelKey)}
              </Link>
            ))}
            <div className="flex flex-col gap-2 border-t border-cream-300/60 pt-3">
              <Link
                href={routes.login}
                className="rounded-full bg-green-700 px-5 py-2.5 text-center text-sm font-semibold text-cream-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('login')}
              </Link>
              {requestUrl ? (
                <a
                  href={requestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-cream-300 px-5 py-2.5 text-center text-sm font-semibold text-green-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('requestAccess')}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </nav>
    </div>
  )
}

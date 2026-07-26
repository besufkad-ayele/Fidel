import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { BrandLogo } from '@/components/shared/brand-logo'
import { BRAND } from '@/lib/constants/brand'
import { routes } from '@/lib/auth/routes'

export async function MarketingFooter() {
  const t = await getTranslations('marketing.footer')
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-cream-300/80 bg-cream-100">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
        <Link href={routes.home} aria-label="Fidel home">
          <BrandLogo size={64} />
        </Link>
        <p className="text-center text-sm text-green-700/55 sm:text-right">
          © {year} {BRAND.name}. {t('rights')}
        </p>
      </div>
    </footer>
  )
}

import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { routes } from '@/lib/auth/routes'

export default async function NotFound() {
  const t = await getTranslations('common')

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-cream-100 px-4 text-center">
      <h1 className="font-display text-3xl text-green-700">{t('notFoundTitle')}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{t('notFoundBody')}</p>
      <Button asChild className="bg-green-700 hover:bg-green-600">
        <Link href={routes.home}>{t('goHome')}</Link>
      </Button>
    </div>
  )
}

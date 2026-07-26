'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/shared/brand-logo'
import { routes } from '@/lib/auth/routes'

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[marketing]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 py-24 text-center">
      <BrandLogo size={72} />
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-green-700">This page couldn’t load</h1>
        <p className="max-w-md text-sm text-green-700/65">
          Something went wrong rendering this page. Reload to try again, or go back home.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={reset}
          className="rounded-full bg-green-700 text-cream-100 hover:bg-green-800"
        >
          Reload
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href={routes.home}>Back</Link>
        </Button>
      </div>
    </div>
  )
}

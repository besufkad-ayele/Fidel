import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Construction } from 'lucide-react'
import { EmptyState } from '@/components/admin/empty-state'

type ComingSoonProps = {
  title: string
  homeHref: string
  homeLabel: string
}

export async function ComingSoonPage({ title, homeHref, homeLabel }: ComingSoonProps) {
  const t = await getTranslations('shell')

  return (
    <div>
      <header className="mb-8 border-b border-cream-300/80 pb-6">
        <h1 className="font-display text-[2rem] leading-10 tracking-tight text-green-700">
          {title}
        </h1>
      </header>
      <div className="rounded-xl border border-cream-300 bg-cream-50 shadow-card">
        <EmptyState
          icon={Construction}
          title={t('comingSoonTitle')}
          description={t('comingSoonBody')}
          actionLabel={homeLabel}
          actionHref={homeHref}
        />
      </div>
    </div>
  )
}

export function comingSoonMetadata(title: string): Metadata {
  return { title }
}

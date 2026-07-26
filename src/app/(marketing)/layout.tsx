import { MarketingFooter } from '@/components/layout/marketing-footer'
import { MarketingHeader } from '@/components/layout/marketing-header'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-cream-100">
      <MarketingHeader />
      {/* Fixed floating nav clearance */}
      <main className="flex-1 pt-24 sm:pt-28">{children}</main>
      <MarketingFooter />
    </div>
  )
}

import { ComingSoonPage, comingSoonMetadata } from '@/components/shared/coming-soon-page'

export const metadata = comingSoonMetadata('Account')

export default function Page() {
  return (
    <ComingSoonPage title="Account" homeHref="/dashboard" homeLabel="Back to dashboard" />
  )
}

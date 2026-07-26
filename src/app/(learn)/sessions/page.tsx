import { ComingSoonPage, comingSoonMetadata } from '@/components/shared/coming-soon-page'

export const metadata = comingSoonMetadata('Live sessions')

export default function Page() {
  return (
    <ComingSoonPage title="Live sessions" homeHref="/dashboard" homeLabel="Back to dashboard" />
  )
}

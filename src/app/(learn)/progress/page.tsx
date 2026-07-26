import { ComingSoonPage, comingSoonMetadata } from '@/components/shared/coming-soon-page'

export const metadata = comingSoonMetadata('Progress')

export default function Page() {
  return (
    <ComingSoonPage title="Progress" homeHref="/dashboard" homeLabel="Back to dashboard" />
  )
}

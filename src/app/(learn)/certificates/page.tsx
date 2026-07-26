import { ComingSoonPage, comingSoonMetadata } from '@/components/shared/coming-soon-page'

export const metadata = comingSoonMetadata('Certificates')

export default function Page() {
  return (
    <ComingSoonPage title="Certificates" homeHref="/dashboard" homeLabel="Back to dashboard" />
  )
}

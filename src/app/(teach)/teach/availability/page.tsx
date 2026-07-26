import { ComingSoonPage, comingSoonMetadata } from '@/components/shared/coming-soon-page'

export const metadata = comingSoonMetadata('Availability')

export default function Page() {
  return <ComingSoonPage title="Availability" homeHref="/teach" homeLabel="Back to Today" />
}

import { ComingSoonPage, comingSoonMetadata } from '@/components/shared/coming-soon-page'

export const metadata = comingSoonMetadata('Schedule')

export default function Page() {
  return <ComingSoonPage title="Schedule" homeHref="/teach" homeLabel="Back to Today" />
}

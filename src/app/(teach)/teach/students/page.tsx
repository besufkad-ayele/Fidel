import { ComingSoonPage, comingSoonMetadata } from '@/components/shared/coming-soon-page'

export const metadata = comingSoonMetadata('Students')

export default function Page() {
  return <ComingSoonPage title="Students" homeHref="/teach" homeLabel="Back to Today" />
}

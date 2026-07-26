import { ComingSoonPage, comingSoonMetadata } from '@/components/shared/coming-soon-page'

export const metadata = comingSoonMetadata('Homework')

export default function Page() {
  return <ComingSoonPage title="Homework" homeHref="/teach" homeLabel="Back to Today" />
}

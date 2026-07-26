import { ComingSoonPage, comingSoonMetadata } from '@/components/shared/coming-soon-page'

export const metadata = comingSoonMetadata('Settings')

export default function Page() {
  return <ComingSoonPage title="Settings" homeHref="/teach" homeLabel="Back to Today" />
}

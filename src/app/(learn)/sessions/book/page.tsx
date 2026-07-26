import { ComingSoonPage, comingSoonMetadata } from '@/components/shared/coming-soon-page'

export const metadata = comingSoonMetadata('Book a session')

export default function Page() {
  return (
    <ComingSoonPage title="Book a session" homeHref="/sessions" homeLabel="Back to sessions" />
  )
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/shared/brand-logo'
import { requireAuth } from '@/lib/auth/guards'
import { homeForRole } from '@/lib/auth/roles'
import { routes } from '@/lib/auth/routes'
import { getCurrentProfile } from '@/lib/auth/session'
import { completeWelcome } from '@/lib/actions/welcome'

export const metadata: Metadata = { title: 'Welcome' }

export default async function WelcomePage() {
  await requireAuth()
  const profile = await getCurrentProfile()
  if (!profile) redirect(routes.login)

  const home = homeForRole(profile.role) as Route

  // Teachers / admins skip the student tour.
  if (profile.role !== 'student') redirect(home)
  if (profile.welcome_seen_at) redirect(home)

  const firstName = profile.full_name?.split(/\s+/)[0]

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream-100 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-cream-300 bg-cream-50 p-8 text-center shadow-card">
        <div className="flex justify-center">
          <BrandLogo size={88} showWordmark={false} priority />
        </div>
        <h1 className="mt-5 font-display text-3xl text-green-700">
          Welcome{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your administrator has set up your Fidel account. Open your first unit when you are ready —
          culture, language, then practice.
        </p>
        <form action={completeWelcome} className="mt-8">
          <Button type="submit" size="lg" className="bg-gold-500 text-green-900 hover:bg-gold-600">
            Go to dashboard
          </Button>
        </form>
      </div>
    </div>
  )
}

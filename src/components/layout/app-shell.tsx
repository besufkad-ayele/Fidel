'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Award,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Settings,
  Sun,
  TrendingUp,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { BrandLogo } from '@/components/shared/brand-logo'
import { initialsFromName } from '@/lib/admin/nav'
import { cn } from '@/lib/utils'
import { SessionTimeoutGuard } from '@/components/features/auth/session-timeout-guard'
import type { CurrentProfile } from '@/lib/auth/session'

/** Serializable icon keys — resolve inside this client module. */
export type AppNavIcon =
  | 'dashboard'
  | 'levels'
  | 'vocabulary'
  | 'sessions'
  | 'homework'
  | 'progress'
  | 'certificates'
  | 'account'
  | 'today'
  | 'schedule'
  | 'students'
  | 'availability'
  | 'settings'

const NAV_ICONS: Record<AppNavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  levels: Layers,
  vocabulary: BookOpen,
  sessions: CalendarDays,
  homework: ClipboardList,
  progress: TrendingUp,
  certificates: Award,
  account: UserRound,
  today: Sun,
  schedule: CalendarDays,
  students: Users,
  availability: Clock3,
  settings: Settings,
}

export type AppNavItem = {
  href: string
  label: string
  icon: AppNavIcon
  badge?: number
}

type AppShellProps = {
  profile: CurrentProfile
  nav: AppNavItem[]
  children: React.ReactNode
  brandHref: string
  roleLabel: string
}

function BrandMark({
  href,
  roleLabel,
  compact = false,
  onDark = true,
}: {
  href: string
  roleLabel: string
  compact?: boolean
  onDark?: boolean
}) {
  return (
    <Link href={href as '/'} className="flex items-center gap-3">
      <BrandLogo size={compact ? 52 : 68} showWordmark={false} priority />
      <div className="min-w-0 leading-tight">
        <p
          className={
            onDark
              ? 'font-display text-xl tracking-tight text-cream-50'
              : 'font-display text-xl tracking-tight text-green-700'
          }
        >
          Fidel
        </p>
        <p
          className={
            onDark
              ? 'text-[11px] font-semibold tracking-[0.14em] text-gold-400 uppercase'
              : 'text-[11px] font-semibold tracking-[0.14em] text-gold-700 uppercase'
          }
        >
          {roleLabel}
        </p>
      </div>
    </Link>
  )
}

function ShellNav({
  nav,
  onNavigate,
}: {
  nav: AppNavItem[]
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain px-3 pb-3 [scrollbar-width:thin] [scrollbar-color:rgb(214_173_96_/_0.35)_transparent]">
      {nav.map((item) => {
        const active =
          item.href === '/dashboard' || item.href === '/teach'
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = NAV_ICONS[item.icon] ?? LayoutDashboard

        return (
          <Link
            key={item.href}
            href={item.href as '/'}
            onClick={onNavigate}
            className={cn(
              'group relative flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150',
              active
                ? 'bg-gold-500/15 text-gold-300'
                : 'text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )}
          >
            {active ? (
              <span
                aria-hidden
                className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-r-full bg-gold-500"
              />
            ) : null}
            <Icon
              className={cn(
                'size-[18px] shrink-0',
                active ? 'text-gold-400' : 'text-green-300/80 group-hover:text-cream-50',
              )}
            />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.badge && item.badge > 0 ? (
              <span className="min-w-5 rounded-full bg-gold-500 px-1.5 text-center text-[11px] font-semibold text-green-900 tabular-nums">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}

function UserFooter({ profile, roleLabel }: { profile: CurrentProfile; roleLabel: string }) {
  const initials = initialsFromName(profile.full_name, profile.email)

  return (
    <div className="shrink-0 border-t border-sidebar-border p-3">
      <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-2.5 py-2.5">
        <Avatar className="size-9 ring-1 ring-gold-500/30">
          {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
          <AvatarFallback className="bg-green-600 text-xs font-semibold text-cream-50">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-cream-50">
            {profile.full_name || profile.email}
          </p>
          <p className="truncate text-[11px] capitalize text-green-300">{roleLabel}</p>
        </div>
        <form action="/auth/signout" method="post">
          <Button
            type="submit"
            size="icon-sm"
            variant="ghost"
            className="text-gold-400 hover:bg-sidebar-accent hover:text-gold-300"
            title="Sign out"
          >
            <LogOut className="size-4" />
            <span className="sr-only">Sign out</span>
          </Button>
        </form>
      </div>
    </div>
  )
}

function SidebarBody({
  profile,
  nav,
  brandHref,
  roleLabel,
  onNavigate,
}: {
  profile: CurrentProfile
  nav: AppNavItem[]
  brandHref: string
  roleLabel: string
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-sidebar-border px-4 py-4">
        <BrandMark href={brandHref} roleLabel={roleLabel} />
      </div>
      <ShellNav nav={nav} onNavigate={onNavigate} />
      <UserFooter profile={profile} roleLabel={roleLabel} />
    </div>
  )
}

export function AppShell({ profile, nav, children, brandHref, roleLabel }: AppShellProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-cream-100">
      <SessionTimeoutGuard />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col overflow-hidden border-r border-green-800 bg-sidebar text-sidebar-foreground xl:w-[264px] lg:flex">
        <SidebarBody
          profile={profile}
          nav={nav}
          brandHref={brandHref}
          roleLabel={roleLabel}
        />
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col lg:pl-[240px] xl:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-cream-300 bg-cream-100/95 px-3 backdrop-blur-md sm:h-16 sm:gap-3 sm:px-4 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 border-cream-400 bg-cream-50">
                <Menu className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[min(100vw-2rem,300px)] border-green-800 bg-sidebar p-0 text-sidebar-foreground [&>button]:text-cream-50"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="flex h-full min-h-0 flex-col">
                <SidebarBody
                  profile={profile}
                  nav={nav}
                  brandHref={brandHref}
                  roleLabel={roleLabel}
                  onNavigate={() => setOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex min-w-0 items-center gap-2">
            <BrandLogo size={48} showWordmark={false} />
            <span className="truncate font-display text-xl text-green-700">Fidel</span>
          </div>
        </header>

        <div className="admin-canvas relative flex-1">
          <main className="relative mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

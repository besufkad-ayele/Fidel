'use client'

import Link from 'next/link'
import { Menu, LogOut } from 'lucide-react'
import { AdminNav } from '@/components/admin/admin-nav'
import { BrandLogo } from '@/components/shared/brand-logo'
import { adminNavGroups, initialsFromName } from '@/lib/admin/nav'
import { routes } from '@/lib/auth/routes'
import { SessionTimeoutGuard } from '@/components/features/auth/session-timeout-guard'
import type { CurrentProfile } from '@/lib/auth/session'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useState } from 'react'

type AdminShellProps = {
  profile: CurrentProfile
  children: React.ReactNode
  pendingNotifications?: number
}

function BrandMark({
  compact = false,
  onDark = true,
}: {
  compact?: boolean
  onDark?: boolean
}) {
  return (
    <Link href={routes.admin} className="flex items-center gap-3">
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
          Admin
        </p>
      </div>
    </Link>
  )
}

function UserFooter({ profile }: { profile: CurrentProfile }) {
  const initials = initialsFromName(profile.full_name, profile.email)
  const title = profile.admin_title?.replace(/_/g, ' ') || profile.role

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
          <p className="truncate text-[11px] capitalize text-green-300">{title}</p>
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
  pendingNotifications = 0,
  onNavigate,
}: {
  profile: CurrentProfile
  pendingNotifications?: number
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Logo stays fixed — only nav scrolls when items overflow */}
      <div className="shrink-0 border-b border-sidebar-border px-4 py-4">
        <BrandMark />
      </div>
      <AdminNav
        groups={adminNavGroups}
        onNavigate={onNavigate}
        badges={{ '/admin/notifications': pendingNotifications }}
      />
      <UserFooter profile={profile} />
    </div>
  )
}

export function AdminShell({
  profile,
  children,
  pendingNotifications = 0,
}: AdminShellProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-cream-100">
      <SessionTimeoutGuard />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col overflow-hidden border-r border-green-800 bg-sidebar text-sidebar-foreground xl:w-[264px] lg:flex">
        <SidebarBody profile={profile} pendingNotifications={pendingNotifications} />
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col lg:pl-[240px] xl:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-cream-300 bg-cream-100/95 px-3 backdrop-blur-md sm:h-16 sm:px-4 lg:hidden">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
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
                  <SheetTitle>Admin navigation</SheetTitle>
                </SheetHeader>
                <div className="flex h-full min-h-0 flex-col">
                  <SidebarBody
                    profile={profile}
                    pendingNotifications={pendingNotifications}
                    onNavigate={() => setOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <BrandMark compact onDark={false} />
            </div>
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

import Link from 'next/link'
import type { Metadata } from 'next'
import { Search, UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { StatusBadge } from '@/components/admin/status-badge'
import { PersonAvatar } from '@/components/admin/person-avatar'
import { PeopleRowActions } from '@/components/admin/people-row-actions'
import { createAdminDb } from '@/lib/admin/db'
import { formatDateTime } from '@/lib/admin/constants'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'People' }

type SearchParams = Promise<{ q?: string; role?: string }>

const ROLE_TABS = [
  { value: '', label: 'All' },
  { value: 'student', label: 'Students' },
  { value: 'teacher', label: 'Teachers' },
  { value: 'admin', label: 'Admins' },
] as const

export default async function PeoplePage({ searchParams }: { searchParams: SearchParams }) {
  const { q, role } = await searchParams
  const db = await createAdminDb()

  let query = db
    .from('profiles')
    .select(
      'id, full_name, email, role, is_active, activated_at, invited_at, updated_at, avatar_url, admin_title',
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (role && ['student', 'teacher', 'admin'].includes(role)) {
    query = query.eq('role', role)
  }
  if (q?.trim()) {
    query = query.or(`full_name.ilike.%${q.trim()}%,email.ilike.%${q.trim()}%`)
  }

  const [{ data: people }, counts] = await Promise.all([
    query,
    Promise.all([
      db.from('profiles').select('id', { count: 'exact', head: true }),
      db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
      db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
    ]),
  ])

  const countByRole = {
    '': counts[0].count ?? 0,
    student: counts[1].count ?? 0,
    teacher: counts[2].count ?? 0,
    admin: counts[3].count ?? 0,
  }

  return (
    <div>
      <PageHeader
        eyebrow="People & access"
        title="People"
        description="Every Fidel account is created here. No public signup — invite, grant access, assign teachers."
        actions={[
          { label: 'New student', href: '/admin/people/students/new' },
          { label: 'New teacher', href: '/admin/people/teachers/new', variant: 'outline' },
          { label: 'New admin', href: '/admin/people/admins/new', variant: 'outline' },
          { label: 'Import CSV', href: '/admin/people/students/import', variant: 'ghost' },
        ]}
      />

      <div className="mb-5 flex flex-wrap items-center gap-1 rounded-xl border border-cream-300 bg-cream-50 p-1 shadow-card">
        {ROLE_TABS.map((tab) => {
          const active = (role ?? '') === tab.value
          const href = tab.value
            ? (`/admin/people?role=${tab.value}${q ? `&q=${encodeURIComponent(q)}` : ''}` as '/')
            : (`/admin/people${q ? `?q=${encodeURIComponent(q)}` : ''}` as '/')
          return (
            <Link
              key={tab.value || 'all'}
              href={href}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-green-700 text-cream-50 shadow-sm'
                  : 'text-muted-foreground hover:bg-cream-200 hover:text-green-700',
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                  active ? 'bg-gold-500/20 text-gold-300' : 'bg-cream-200 text-muted-foreground',
                )}
              >
                {countByRole[tab.value as keyof typeof countByRole]}
              </span>
            </Link>
          )
        })}
      </div>

      <form className="mb-6 flex flex-wrap gap-2">
        {role ? <input type="hidden" name="role" value={role} /> : null}
        <div className="relative min-w-[240px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search name or email…"
            className="border-cream-400 bg-cream-50 pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {(people ?? []).length === 0 ? (
        <div className="rounded-xl border border-cream-300 bg-cream-50 shadow-card">
          <EmptyState
            icon={UserPlus}
            title="No people match"
            description="Create your first student to start provisioning access and invites."
            actionLabel="Create student"
            actionHref="/admin/people/students/new"
          />
        </div>
      ) : (
        <div className="admin-table-wrap">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Person</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invited</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="pr-5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(people ?? []).map(
                (person: {
                  id: string
                  full_name: string
                  email: string
                  role: string
                  is_active: boolean
                  activated_at: string | null
                  invited_at: string | null
                  updated_at: string
                  avatar_url: string | null
                  admin_title: string | null
                }) => {
                  const status = !person.is_active
                    ? 'suspended'
                    : person.activated_at
                      ? 'active'
                      : 'pending'
                  return (
                    <TableRow key={person.id}>
                      <TableCell className="pl-5">
                        <Link
                          href={`/admin/people/${person.id}` as '/'}
                          className="flex items-center gap-3"
                        >
                          <PersonAvatar
                            name={person.full_name}
                            email={person.email}
                            avatarUrl={person.avatar_url}
                            size="sm"
                          />
                          <span className="min-w-0">
                            <span className="block font-medium text-green-700 hover:underline">
                              {person.full_name || '—'}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {person.email}
                            </span>
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={person.role} />
                          {person.admin_title ? (
                            <span className="text-[11px] text-muted-foreground capitalize">
                              {person.admin_title.replace(/_/g, ' ')}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(person.invited_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(person.updated_at)}
                      </TableCell>
                      <TableCell className="pr-5">
                        <PeopleRowActions
                          id={person.id}
                          name={person.full_name || ''}
                          email={person.email}
                          status={status}
                        />
                      </TableCell>
                    </TableRow>
                  )
                },
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

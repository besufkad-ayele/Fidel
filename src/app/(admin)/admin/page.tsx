import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Users,
  GraduationCap,
  MailWarning,
  KeyRound,
  Wallet,
  AlertTriangle,
  CalendarDays,
  Award,
  UserPlus,
  Building2,
  Layers,
  ScrollText,
  Clock3,
  FileSearch,
} from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { KpiCard } from '@/components/admin/kpi-card'
import { CollapsiblePanel } from '@/components/admin/collapsible-panel'
import { EmptyState } from '@/components/admin/empty-state'
import { AttentionItem } from '@/components/admin/attention-item'
import { QuickAction } from '@/components/admin/quick-action'
import { createAdminDb } from '@/lib/admin/db'
import { formatDateTime, formatMoney } from '@/lib/admin/constants'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata: Metadata = { title: 'Admin overview' }

export default async function AdminOverviewPage() {
  const db = await createAdminDb()
  const now = new Date()
  const in30 = new Date(Date.now() + 30 * 86400000)

  const [
    studentsRes,
    teachersRes,
    pendingRes,
    entitlementsRes,
    expiringRes,
    paymentsRes,
    outstandingRes,
    sessionsRes,
    certificatesRes,
    auditRes,
    levelsReviewRes,
    levelsPublishedRes,
    orgsRes,
  ] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('is_active', true),
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher').eq('is_active', true),
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').is('activated_at', null),
    db.from('entitlements').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db
      .from('entitlements')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .lt('expires_at', in30.toISOString())
      .gt('expires_at', now.toISOString()),
    db.from('payments').select('amount_cents, currency, status'),
    db.from('payments').select('id, amount_cents, currency, status').in('status', ['pending', 'partial']),
    db
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .gte('scheduled_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    db.from('certificates').select('id', { count: 'exact', head: true }).eq('status', 'issued'),
    db
      .from('audit_log')
      .select('id, action, entity_type, entity_id, created_at, actor_id')
      .order('created_at', { ascending: false })
      .limit(8),
    db.from('levels').select('id', { count: 'exact', head: true }).eq('status', 'in_review'),
    db.from('levels').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('organizations').select('id', { count: 'exact', head: true }),
  ])

  const paidByCurrency = new Map<string, number>()
  for (const p of paymentsRes.data ?? []) {
    if (p.status === 'paid') {
      paidByCurrency.set(p.currency, (paidByCurrency.get(p.currency) ?? 0) + p.amount_cents)
    }
  }
  const revenueLabel =
    paidByCurrency.size === 0
      ? '—'
      : [...paidByCurrency.entries()].map(([c, cents]) => formatMoney(cents, c)).join(' · ')

  const outstandingTotal = (outstandingRes.data ?? []).reduce(
    (sum: number, p: { amount_cents: number }) => sum + p.amount_cents,
    0,
  )

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const attentionCount =
    (pendingRes.count ?? 0) + (levelsReviewRes.count ?? 0) + (outstandingRes.count ?? 0)

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Console"
        title={`${greeting}`}
        description="Commercial health and learning operations — provision people, grant access, and keep content publishing."
        actions={[
          { label: 'Create student', href: '/admin/people/students/new' },
          { label: 'Grant access', href: '/admin/entitlements', variant: 'outline' },
        ]}
      />

      <CollapsiblePanel
        title="Quick actions"
        description="Common provisioning and content shortcuts."
        defaultOpen
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction
            href="/admin/people/students/new"
            label="Provision student"
            description="Account, access, payment, invite"
            icon={UserPlus}
          />
          <QuickAction
            href="/admin/organizations/new"
            label="Add organization"
            description="Embassy, NGO, or university sponsor"
            icon={Building2}
          />
          <QuickAction
            href="/admin/levels"
            label="Manage levels"
            description={`${levelsPublishedRes.count ?? 0} published · review queue`}
            icon={Layers}
          />
          <QuickAction
            href="/admin/payments"
            label="Record payment"
            description="Offline ledger for bank transfers"
            icon={Wallet}
          />
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel
        title="Learning"
        description="Active learners, teachers, invites, and live entitlements."
        defaultOpen
        meta={
          <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 tabular-nums">
            {studentsRes.count ?? 0} students
          </span>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
          <KpiCard
            label="Active students"
            value={studentsRes.count ?? 0}
            icon={GraduationCap}
            hint={`${orgsRes.count ?? 0} organizations on file`}
          />
          <KpiCard
            label="Active teachers"
            value={teachersRes.count ?? 0}
            icon={Users}
            hint="Accepting assignments from People"
          />
          <KpiCard
            label="Pending invites"
            value={pendingRes.count ?? 0}
            tone={(pendingRes.count ?? 0) > 0 ? 'warning' : 'default'}
            icon={MailWarning}
            hint="Students who have not activated yet"
          />
          <KpiCard
            label="Active entitlements"
            value={entitlementsRes.count ?? 0}
            icon={KeyRound}
            hint="Level or unit grants currently live"
          />
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel
        title="Commercial"
        description="Revenue, outstanding invoices, expiry, and recent sessions."
        defaultOpen
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
          <KpiCard
            label="Revenue recorded"
            value={revenueLabel}
            icon={Wallet}
            hint="Paid only · currencies never converted"
          />
          <KpiCard
            label="Payments outstanding"
            value={outstandingRes.count ?? 0}
            tone={(outstandingRes.count ?? 0) > 0 ? 'warning' : 'success'}
            icon={AlertTriangle}
            hint={
              outstandingTotal > 0
                ? `Mixed total ≈ ${formatMoney(outstandingTotal, 'ETB')}`
                : 'No pending or partial invoices'
            }
          />
          <KpiCard
            label="Expiring in 30 days"
            value={expiringRes.count ?? 0}
            tone={(expiringRes.count ?? 0) > 0 ? 'warning' : 'default'}
            icon={Clock3}
            hint="Extend from Entitlements"
          />
          <KpiCard
            label="Sessions · 7 days"
            value={sessionsRes.count ?? 0}
            icon={CalendarDays}
            hint={`${certificatesRes.count ?? 0} certificates issued`}
            tone="info"
          />
        </div>
      </CollapsiblePanel>

      <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
        <div className="lg:col-span-3">
          <CollapsiblePanel
            title="Recent activity"
            description="Audit trail of provisioning, grants, and publishes."
            defaultOpen
            bodyClassName="p-0"
            actions={
              <Link
                href={'/admin/audit' as '/'}
                className="text-sm font-medium whitespace-nowrap text-green-700 hover:underline"
              >
                View all
              </Link>
            }
          >
            {(auditRes.data ?? []).length === 0 ? (
              <div className="p-4 sm:p-5">
                <EmptyState
                  compact
                  icon={ScrollText}
                  title="No audit entries yet"
                  description="Create a student or grant access — every sensitive action lands here."
                  actionLabel="Create student"
                  actionHref="/admin/people/students/new"
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="admin-table-wrap min-w-[480px] border-0 shadow-none rounded-none">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4 sm:pl-5">Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead className="pr-4 sm:pr-5">When</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(auditRes.data ?? []).map(
                        (row: {
                          id: string
                          action: string
                          entity_type: string
                          entity_id: string
                          created_at: string
                        }) => (
                          <TableRow key={row.id}>
                            <TableCell className="pl-4 font-medium text-green-700 sm:pl-5">
                              {row.action}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {row.entity_type}/{row.entity_id.slice(0, 8)}
                            </TableCell>
                            <TableCell className="pr-4 text-muted-foreground sm:pr-5">
                              {formatDateTime(row.created_at)}
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CollapsiblePanel>
        </div>

        <div className="lg:col-span-2">
          <CollapsiblePanel
            title="Needs attention"
            description="Items that usually need a human this week."
            defaultOpen={attentionCount > 0}
            meta={
              attentionCount > 0 ? (
                <span className="rounded-full bg-warning-50 px-2 py-0.5 text-[11px] font-semibold text-warning-500 tabular-nums">
                  {attentionCount}
                </span>
              ) : null
            }
          >
            <div className="space-y-3">
              <AttentionItem
                title="Pending invites"
                description="Resend or deliver a one-time setup link."
                count={pendingRes.count ?? 0}
                href="/admin/people?role=student"
                icon={MailWarning}
                tone={(pendingRes.count ?? 0) > 0 ? 'warning' : 'default'}
              />
              <AttentionItem
                title="Content in review"
                description="Levels waiting for a publish decision."
                count={levelsReviewRes.count ?? 0}
                href="/admin/levels"
                icon={FileSearch}
                tone={(levelsReviewRes.count ?? 0) > 0 ? 'info' : 'default'}
              />
              <AttentionItem
                title="Outstanding payments"
                description="Pending and partial invoices in the ledger."
                count={outstandingRes.count ?? 0}
                href="/admin/payments"
                icon={Wallet}
                tone={(outstandingRes.count ?? 0) > 0 ? 'warning' : 'default'}
              />
              <AttentionItem
                title="Certificates issued"
                description="Public verification codes for embassies."
                count={certificatesRes.count ?? 0}
                href="/admin/certificates"
                icon={Award}
              />
            </div>
          </CollapsiblePanel>
        </div>
      </div>
    </div>
  )
}

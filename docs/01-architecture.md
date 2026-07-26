# Fidel — Technical Architecture

Companion to `Fidel_prd.md` v2.0. This document defines the stack, the folder layout, the auth boundary, the data-access pattern, and the conventions every contributor follows. It is prescriptive: when in doubt, follow this document rather than inventing a new pattern.

---

## 1. Stack

### 1.1 Pinned versions (verified 2026-07-26)

| Package | Version | Why |
|---|---|---|
| `next` | 16.2.12 | App Router, Server Components, Server Actions, Turbopack |
| `react` / `react-dom` | 19.2.8 | Required by Next 16 |
| `typescript` | ^5 | `strict: true`, no build-error suppression |
| `@supabase/supabase-js` | 2.110.8 | Postgres / Auth / Storage / Realtime client |
| `@supabase/ssr` | 0.12.3 | Cookie-based sessions for Server Components, Route Handlers, middleware |
| `tailwindcss` | 4.3.3 | CSS-first config via `@theme`, matches the reference project |
| `zod` | 4.4.3 | Validation for Server Action inputs and lesson content shapes |
| `react-hook-form` + `@hookform/resolvers` | latest | Form state; fixes the reference project's manual-validation friction |
| `next-intl` | 4.13.4 | i18n infrastructure, English-only catalog at MVP |
| `lucide-react` | latest | Icons |
| `class-variance-authority`, `clsx`, `tailwind-merge` | latest | shadcn/ui dependencies |
| `sonner` | latest | Toasts |
| `date-fns` + `@date-fns/tz` | latest | Timezone-correct scheduling |
| `vitest` + `@testing-library/react` | latest | Unit tests |
| `@playwright/test` | latest | E2E on critical flows |
| `supabase` (CLI) | latest | Migrations, type generation, local dev |

**Package manager:** pnpm (consistent with the reference project).

### 1.2 Deliberately excluded

| Not using | Reason |
|---|---|
| Prisma / Drizzle | Supabase generated types + typed query modules cover it. The reference project shipped Prisma as unused dependency noise. |
| Redux / heavy client state | Server Components own the data. Local UI state uses `useState`; the two genuinely cross-component cases (flashcard session, quiz in-progress) use small Zustand stores. |
| TanStack Query | Server Components + Server Actions + `revalidatePath` cover MVP. Revisit only if a real client-polling need appears. |
| Client-side Supabase data access | Reads happen in Server Components, writes in Server Actions. The browser client exists only for auth callbacks and Realtime subscriptions. |

---

## 2. Repository Layout

```
Fidel/
├── docs/                            # This planning set — kept in sync with reality
│   ├── 01-architecture.md
│   ├── 02-data-model.md
│   ├── 03-screens-and-routes.md
│   └── 04-roadmap.md
├── Fidel_prd.md
├── supabase/
│   ├── config.toml
│   ├── migrations/                  # Timestamped SQL — the schema source of truth
│   │   ├── 20260727000001_extensions_and_enums.sql
│   │   ├── 20260727000002_identity.sql
│   │   ├── 20260727000003_organizations.sql
│   │   ├── 20260727000004_curriculum.sql
│   │   ├── 20260727000005_vocabulary.sql
│   │   ├── 20260727000006_assessment.sql
│   │   ├── 20260727000007_progress.sql
│   │   ├── 20260727000008_homework.sql
│   │   ├── 20260727000009_sessions.sql
│   │   ├── 20260727000010_access_and_payments.sql
│   │   ├── 20260727000011_certificates_platform.sql
│   │   ├── 20260727000012_rls_helpers.sql
│   │   ├── 20260727000013_rls_policies.sql
│   │   ├── 20260727000014_storage_buckets.sql
│   │   └── 20260727000015_provisioning_rpc.sql
│   └── seed.sql                     # Level ሀ Unit 1 + demo users
├── messages/
│   └── en.json                      # All UI copy. Adding `am.json` is the whole i18n task.
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── types/
│   ├── i18n/
│   └── proxy.ts                     # Next 16 rename of middleware.ts
├── tests/
│   └── e2e/
├── .env.local                       # Never committed
├── .env.example                     # Committed, no secrets
├── components.json                  # shadcn config
├── next.config.ts
├── tsconfig.json
└── package.json
```

### 2.1 `src/app/` — route groups

```
src/app/
├── layout.tsx                       # <html>, fonts, NextIntlClientProvider, Toaster
├── globals.css                      # Tailwind v4 @theme + design tokens
├── error.tsx / not-found.tsx
├── (marketing)/                     # Public, no auth
│   ├── layout.tsx                   # Marketing header/footer
│   ├── page.tsx                     # Landing
│   ├── levels/page.tsx              # Public curriculum overview
│   ├── teachers/page.tsx
│   ├── blog/page.tsx + [slug]/page.tsx
│   └── verify/[code]/page.tsx       # Public certificate verification
├── (auth)/                          # Public auth screens — NO SIGNUP ROUTE
│   ├── layout.tsx                   # Split shell: hero-auth.webp + centered form
│   ├── login/page.tsx
│   ├── set-password/page.tsx        # Invite acceptance — student's first screen
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
├── auth/                            # Non-UI auth endpoints
│   ├── callback/route.ts            # OAuth exchange; rejects unknown emails
│   ├── confirm/route.ts             # OTP: invite | recovery | email_change
│   └── signout/route.ts
├── (onboarding)/
│   ├── layout.tsx                   # Requires session; skipped if already seen
│   └── welcome/page.tsx             # 3-screen tour, not data collection
├── (learn)/                         # STUDENT — guarded: role='student'
│   ├── layout.tsx                   # requireRole('student') + StudentSidebar
│   ├── dashboard/page.tsx
│   ├── levels/page.tsx
│   ├── levels/[levelSlug]/page.tsx
│   ├── levels/[levelSlug]/units/[unitSlug]/
│   │   ├── layout.tsx               # Unit shell: part tabs, progress rail, nudge banner
│   │   ├── page.tsx                 # → redirect to /culture
│   │   ├── culture/page.tsx         # Part 1
│   │   ├── lesson/page.tsx          # Part 2
│   │   └── practice/page.tsx        # Part 3
│   ├── vocabulary/page.tsx
│   ├── vocabulary/flashcards/page.tsx
│   ├── sessions/page.tsx
│   ├── sessions/book/page.tsx
│   ├── sessions/[sessionId]/page.tsx
│   ├── homework/page.tsx
│   ├── homework/[submissionId]/page.tsx
│   ├── progress/page.tsx
│   ├── certificates/page.tsx
│   └── account/page.tsx
├── (teach)/                         # TEACHER — guarded: role='teacher'
│   ├── layout.tsx                   # requireRole('teacher') + TeacherSidebar
│   └── teach/
│       ├── page.tsx                 # Today
│       ├── schedule/page.tsx
│       ├── availability/page.tsx
│       ├── students/page.tsx + [studentId]/page.tsx
│       ├── sessions/[sessionId]/page.tsx
│       ├── sessions/[sessionId]/prep/page.tsx
│       ├── homework/page.tsx + [submissionId]/page.tsx
│       └── settings/page.tsx        # Google Calendar connection
├── (admin)/                         # ADMIN — guarded: role='admin'
│   ├── layout.tsx                   # requireRole('admin') + AdminSidebar
│   └── admin/
│       ├── page.tsx                 # Analytics + revenue overview
│       ├── levels/…                 # Content CMS
│       ├── units/[unitId]/…
│       ├── vocabulary/…
│       ├── media/page.tsx
│       ├── people/
│       │   ├── page.tsx
│       │   ├── students/new/page.tsx        # 7-section provisioning form
│       │   ├── students/import/page.tsx     # Bulk CSV
│       │   ├── teachers/new/page.tsx
│       │   ├── admins/new/page.tsx
│       │   └── [id]/page.tsx                # Detail + lifecycle actions
│       ├── organizations/…          # Embassies, NGOs, universities
│       ├── cohorts/…
│       ├── entitlements/page.tsx    # Grant/revoke level or unit access
│       ├── payments/page.tsx        # Offline payment records + outstanding
│       ├── sessions/page.tsx
│       ├── certificates/page.tsx
│       ├── blog/…
│       └── audit/page.tsx
└── api/
    ├── google/oauth/callback/route.ts
    ├── webhooks/stripe/route.ts     # Phase 3 placeholder
    └── cron/session-reminders/route.ts
```

Full screen-by-screen detail is in `docs/03-screens-and-routes.md`.

**Rule: no `?tab=` navigation.** The reference project routed entire dashboards through a query parameter, which broke deep links, browser history, and server rendering. Every view here is a real route.

### 2.2 `src/components/`

```
src/components/
├── ui/                              # shadcn primitives — unmodified generated output
├── layout/
│   ├── student-sidebar.tsx
│   ├── teacher-sidebar.tsx
│   ├── admin-sidebar.tsx
│   ├── app-shell.tsx
│   └── user-menu.tsx
├── shared/                          # Cross-domain: EmptyState, PageHeader, DataTable,
│                                    # ConfirmDialog, FidelBadge, AmharicText, AudioPlayer
└── features/
    ├── auth/
    ├── onboarding/
    ├── curriculum/                  # LevelCard, UnitCard, PartTabs, ProgressRail
    ├── lesson/                      # CulturalInsight, DialoguePlayer, GrammarNote,
    │                                # ObjectiveList, PronunciationTip
    ├── vocabulary/                  # VocabTable, VocabCard, FlashcardDeck, VocabFilters
    ├── practice/                    # ExerciseRenderer + one component per exercise type,
    │                                # QuizRunner, SpeakingRecorder, RoleplaySimulator
    ├── homework/
    ├── sessions/                    # SlotPicker, BookingForm, SessionCard, PrepPanel
    ├── certificates/
    └── admin/                       # One folder per CMS entity
```

**Rule: `features/` folders may not import from each other.** Shared pieces move to `components/shared/`. This is the single guardrail that prevents the tangle the reference project developed.

### 2.3 `src/lib/`

```
src/lib/
├── supabase/
│   ├── client.ts                    # createBrowserClient — auth + realtime only
│   ├── server.ts                    # createServerClient — cookie-bound, per request
│   ├── proxy.ts                     # updateSession helper
│   └── admin.ts                     # service-role client, `import 'server-only'`
├── auth/
│   ├── session.ts                   # getSession, getCurrentUser, getCurrentProfile
│   ├── guards.ts                    # requireAuth, requireRole, requireLevelAccess
│   └── roles.ts                     # Role type + route-map per role
├── data/                            # Typed read layer — one module per domain
│   ├── levels.ts
│   ├── units.ts
│   ├── lesson-parts.ts
│   ├── vocabulary.ts
│   ├── progress.ts
│   ├── quizzes.ts
│   ├── homework.ts
│   ├── sessions.ts
│   ├── entitlements.ts
│   ├── certificates.ts
│   └── admin/…
├── actions/                         # Server Actions — one module per domain
│   ├── progress.ts
│   ├── quizzes.ts
│   ├── homework.ts
│   ├── sessions.ts
│   ├── onboarding.ts
│   ├── account.ts
│   └── admin/…
├── validation/                      # Zod schemas
│   ├── content.ts                   # Lesson part content shapes (discriminated union)
│   ├── forms.ts
│   └── shared.ts
├── services/                        # Third-party integrations
│   ├── google-calendar.ts
│   ├── email.ts
│   ├── pdf/certificate.ts
│   └── storage.ts
├── domain/                          # Pure business logic, no I/O — fully unit-testable
│   ├── progress-rules.ts            # Part → unit rollup, unlock eligibility
│   ├── grading.ts                   # Quiz scoring, exercise checking
│   ├── availability.ts              # Slot generation from rules − bookings − time off
│   └── fidel.ts                     # Level slug ↔ fidel char ↔ CEFR mapping
├── constants/
│   ├── brand.ts
│   ├── levels.ts
│   └── navigation.ts
└── utils.ts                         # cn() and true one-liners only
```

**Rule: no god-modules.** The reference project's `firebaseService.ts` grew to ~665 lines spanning four roles. Here, if a file in `data/` or `actions/` passes ~250 lines, it splits by sub-domain.

**Rule: business logic lives in `lib/domain/` and takes plain data.** Unlock eligibility, quiz scoring, and slot generation are pure functions with no Supabase import, which is what makes them testable without a database.

---

## 3. The Auth Boundary — Three Layers

The reference project enforced authorization only in client `useEffect` hooks reading `localStorage`, with permissive database rules underneath. Every layer here is independently sufficient to deny access.

### Layer 1 — Proxy (session refresh + coarse routing)

**Next.js 16 deprecated the `middleware` file convention and renamed it to `proxy`.** The file is `src/proxy.ts`, the exported function is `proxy`, and it defaults to the Node.js runtime (the `runtime` option can no longer be configured). The rename is deliberate: it signals that this file belongs to the network boundary — rewrites, redirects, cookie refresh — and that application logic like database-backed authorization belongs in Server Components and Route Handlers instead. That is exactly how the three layers below are split.

```ts
// src/proxy.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|woff2?)$).*)'],
}
```

It refreshes the Supabase session cookie on every matched request and performs coarse redirects only: unauthenticated users hitting a protected prefix go to `/login?next=…`; authenticated users hitting `/login` go to their role's home.

`updateSession` must return the exact `NextResponse` object whose cookies it mutated — copying headers onto a new response silently breaks token refresh. This is the single most common `@supabase/ssr` bug.

**The proxy is a convenience, not a security boundary.** It never reads the database and never makes fine-grained decisions. If you find yourself wanting a database query here, the logic belongs in Layer 2.

> Migration note: if any scaffolding tool generates `middleware.ts`, run `npx @next/codemod@latest middleware-to-proxy .` It renames both the file and the function.

### Layer 2 — Server-side guards (authoritative in the app)

Every protected layout calls a guard before rendering. Guards use `supabase.auth.getUser()` (which validates the JWT with the auth server), never `getSession()` (which trusts the cookie).

```ts
// src/lib/auth/guards.ts
import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Role } from './roles'

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return user
}

export async function requireRole(role: Role) {
  const user = await requireAuth()
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, admin_title, full_name, avatar_url, is_active, welcome_seen_at')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (!profile.is_active) redirect('/login?error=inactive')
  if (profile.role !== role) redirect(homeForRole(profile.role))
  return { user, profile }
}
```

```ts
// src/app/(learn)/layout.tsx
export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole('student')
  if (!profile.welcome_seen_at) redirect('/welcome')
  return <AppShell sidebar={<StudentSidebar profile={profile} />}>{children}</AppShell>
}
```

The `is_active` check matters more here than in a self-serve product: suspending an account is an administrative action with contractual meaning (an embassy's contract lapsed), so it must take effect on the next request rather than whenever the session happens to expire.

### Layer 3 — Row Level Security (authoritative in the database)

RLS is enabled on every table with explicit policies. Even if a bug exposed a query, the database refuses to return another student's rows. Policies and helper functions are specified in `docs/02-data-model.md`.

The user's role is written into the JWT by a Supabase **custom access token hook**, so policies read `fidel.auth_role()` from the token instead of running a `profiles` subquery on every row check.

### 3.1 Supabase clients

Four distinct clients; using the wrong one is a security bug.

| File | Used in | Notes |
|---|---|---|
| `lib/supabase/server.ts` | Server Components, Server Actions, Route Handlers | Cookie-bound. Created **per request** — never module-scoped. |
| `lib/supabase/client.ts` | Client Components | Auth callbacks and Realtime only. No data reads. |
| `lib/supabase/proxy.ts` | `src/proxy.ts` | Session refresh only. |
| `lib/supabase/admin.ts` | Trusted server code only | Service role, bypasses RLS. Starts with `import 'server-only'`. Permitted uses: **admin user provisioning**, certificate generation, signed URL issuance, seeding, cron. |

```ts
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {
            // Called from a Server Component; middleware handles the refresh.
          }
        },
      },
    },
  )
}
```

### 3.2 Auth flows

**There is no public signup.** Accounts exist only because an admin created them. This removes an entire class of abuse (fake accounts, enumeration, spam) and matches how Fidel is actually sold — institutions buy for named staff. See `docs/06-admin-forms.md`.

| Flow | Path |
|---|---|
| **Admin provisions an account** | `/admin/people/students/new` → Server Action `createStudent` → `admin.auth.admin.inviteUserByEmail` → transactional RPC creates profile, entitlements, payment, credits, teacher assignment → invite email sent |
| **Student accepts the invite** | Emailed one-time link → `/auth/confirm?type=invite` verifies the token → `/set-password` → student sets their own password → role home |
| Email login | `/login` → Server Action `signIn` → redirect to role home (or a safe `?next=`) |
| Google OAuth login | `/login` → `signInWithOAuth` → Google → `/auth/callback`. **The callback rejects any Google identity whose email has no existing `profiles` row**, signs it out, and shows "No Fidel account exists for this email. Contact your administrator." OAuth is a login method, never a registration path. |
| Password reset | `/forgot-password` → email → `/auth/confirm?type=recovery` → `/reset-password` |
| Resend invite | Admin action; issues a fresh one-time link and invalidates the previous one |
| Manual setup link | When invite email is disabled, `createStudent` returns a one-time link shown **once** in the confirmation screen. Never persisted, never logged. |
| Sign out | `POST /auth/signout` |
| Profile creation | Postgres trigger `on_auth_user_created` inserts into `profiles` with `role='student'`; the provisioning RPC then fills in the details |

**Two safeguards make "no public signup" real rather than cosmetic:**
1. Email signups are **disabled in the Supabase dashboard** (Authentication → Providers → Email → "Allow new users to sign up" off). Without this, the anon key can still call `/auth/v1/signup` directly regardless of what the UI offers.
2. `/auth/callback` verifies an existing `profiles` row before establishing an OAuth session, so an unknown Google account cannot bootstrap itself.

Role escalation to `teacher` or `admin` is **only** possible through the admin UI using the service-role client. `profiles.role` is not writable by the row owner — enforced by an RLS `WITH CHECK` and the `guard_role_change` trigger.

---

## 4. Data Access Pattern

### 4.1 Reads — Server Components via `lib/data/`

Components never call Supabase directly. They call a typed function from `lib/data/`, which owns the query, the shape, and the error handling.

```ts
// src/lib/data/units.ts
import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const getUnitWithParts = cache(async (unitSlug: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('units')
    .select(`
      id, slug, title, subtitle, sort_order, level_id,
      lesson_parts ( part, content, is_published ),
      unit_vocabulary ( vocabulary_items ( * ) )
    `)
    .eq('slug', unitSlug)
    .eq('is_published', true)
    .single()

  if (error) throw new DataError('unit.load_failed', error)
  return data
})
```

`React.cache` deduplicates identical reads within a single render pass — the layout and the page can both ask for the unit without a second round trip.

### 4.2 Writes — Server Actions via `lib/actions/`

Every mutation is a Server Action. Every action follows the same five steps, in order:

1. `'use server'`
2. Authenticate and authorize (`requireAuth` / `requireRole`)
3. Validate input with a Zod schema
4. Mutate through the request-scoped server client (RLS still applies)
5. `revalidatePath` the affected routes and return a typed `ActionResult`

```ts
// src/lib/actions/quizzes.ts
'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { submitQuizSchema } from '@/lib/validation/forms'
import { gradeQuiz } from '@/lib/domain/grading'
import type { ActionResult } from '@/types/actions'

export async function submitQuiz(input: unknown): Promise<ActionResult<{ score: number }>> {
  const { user } = await requireRole('student')

  const parsed = submitQuizSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'validation', fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('id, correct_answer, points')
    .eq('quiz_id', parsed.data.quizId)

  const result = gradeQuiz(questions ?? [], parsed.data.answers)

  const { error } = await supabase.from('quiz_attempts').insert({
    quiz_id: parsed.data.quizId,
    student_id: user.id,
    score: result.score,
    max_score: result.maxScore,
    answers: parsed.data.answers,
  })
  if (error) return { ok: false, error: 'save_failed' }

  revalidatePath(`/levels/${parsed.data.levelSlug}/units/${parsed.data.unitSlug}/practice`)
  revalidatePath(`/levels/${parsed.data.levelSlug}`)

  return { ok: true, data: { score: result.score } }
}
```

**Answer keys never reach the client.** Grading happens server-side against `quiz_questions.correct_answer`, which RLS hides from students.

### 4.3 `ActionResult` contract

```ts
// src/types/actions.ts
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }
```

Actions return typed results rather than throwing. Thrown errors are reserved for genuinely exceptional conditions and are caught by `error.tsx`. Error codes are i18n message keys, so the UI translates them.

### 4.4 Caching and revalidation

| Data | Strategy |
|---|---|
| Marketing pages, blog | Static, `revalidate = 3600` |
| Published curriculum (levels, units, lesson content, vocabulary) | Cached per request via `React.cache`; invalidated on admin publish through `revalidateTag('curriculum')` |
| Student-specific data (progress, homework, sessions) | Always dynamic — never cached across requests |
| Certificate verification page | `revalidate = 300` |

---

## 5. Content Modeling

Lesson content is a typed JSON document per part, validated by a Zod discriminated union in `lib/validation/content.ts`. The database stores `jsonb`; the application parses it on read and refuses to render invalid content in production (and shows a loud authoring error in the admin preview).

```ts
// src/lib/validation/content.ts — abridged
export const culturalInsightSchema = z.object({
  part: z.literal('cultural_insight'),
  hookQuestion: z.string().min(1),
  body: z.object({
    kind: z.enum(['markdown', 'video']),
    markdown: z.string().optional(),
    mediaAssetId: z.string().uuid().optional(),
  }),
  whyThisMatters: z.array(z.object({
    persona: personaEnum,          // 'default' plus each persona
    text: z.string(),
  })).min(1),
  dosAndDonts: z.object({
    dos: z.array(z.string()),
    donts: z.array(z.string()),
  }),
  comprehensionCheck: z.object({
    question: z.string(),
    options: z.array(z.string()).min(2),
    correctIndex: z.number().int().min(0),
  }).nullable(),
})

export const lessonPartContentSchema = z.discriminatedUnion('part', [
  culturalInsightSchema,
  languageLessonSchema,
  practiceSchema,
])
```

Exercises and quiz questions are **relational, not embedded**, because they need to be graded, scored, aggregated, and reported on. Prose, dialogue, and framing are **embedded JSON**, because they are only ever rendered. That split is the rule: *if you will ever `GROUP BY` it, it is a table.*

---

## 6. Internationalization

English-only at MVP, with the full `next-intl` pipeline in place so a new language is a translation task and never a refactor.

**Configuration:** `localePrefix: 'as-needed'` with `en` as default, so MVP URLs stay clean (`/dashboard`, not `/en/dashboard`). Adding `am` activates `/am/dashboard` without touching existing routes.

**Rules:**
1. No hardcoded user-facing strings in components. Every string comes from `useTranslations()` (client) or `getTranslations()` (server).
2. Message keys are namespaced by feature: `lesson.dialogue.playSlow`, `sessions.book.confirmTitle`.
3. Dates, times, and numbers format through `next-intl` formatters — never manual `toLocaleString` calls.
4. **Amharic lesson content is data, not UI copy.** It lives in the database and is never translated. The `<AmharicText>` component applies Noto Sans Ethiopic and `lang="am"`.
5. Content-level translation (translating a *unit* into another interface language) is Phase 4 and will use `*_translations` side tables keyed by `(entity_id, locale)`. No schema change is needed to add them.
6. Layout must survive ~35% string expansion; avoid fixed-width buttons.

---

## 7. Design System

**Full specification lives in `docs/05-design-system.md`** — colour ramps, type scales, the complete `/public` asset inventory, and a component-by-component visual contract with exact dimensions, states, and Tailwind classes. That document is authoritative for anything visual; this section is the summary.

| Anchor | Value | Use |
|---|---|---|
| Primary / deep green | `#1A3636` (`green-700`) | Headers, primary buttons, sidebar |
| Gold accent | `#D6AD60` (`gold-500`) | Fidel characters, progress fill, badges, certificates |
| Cream background | `#F9F7F2` (`cream-100`) | Page background |
| Dark background | `#0D1313` (`green-950`) | Dark mode |

Each anchor is extended into a full 10-step ramp so hover, border, and disabled states have somewhere to go. The complete `@theme` block is in `docs/05-design-system.md` §2 and is copied verbatim into `src/app/globals.css`.

**Typography:** Inter for UI, DM Serif Display for headings, **Noto Sans Ethiopic** for all Amharic. Ethiopic glyphs render optically smaller than Latin at the same `font-size` and clip at Latin line-heights, so `<AmharicText>` applies a ~10% size compensation, a minimum 1.45 line-height, and `lang="am"` for correct shaping and screen-reader pronunciation. A lint rule flags Ethiopic codepoints (U+1200–U+137F) appearing in JSX outside that component.

**Image-backed cards** are one shared `<ImageCard>` primitive: `next/image` with `fill`, a shared overlay utility (`.img-card-overlay-center`), centred cream text, and a brand-gradient fallback when the asset is missing. Quiz cards, part cards, level cards, and session cards are all this component with different props and asset paths. Never hand-roll a gradient overlay.

**Fidel characters are a brand element.** `<FidelBadge level="ha" size="lg" />` renders ሀ in gold with the CEFR code as a subordinate label, used consistently in the sidebar, level cards, breadcrumbs, and certificates.

**Accessibility:** WCAG 2.1 AA. All audio players keyboard-operable; dialogue audio always has visible text; every interactive element has a `gold-500` focus ring; forms use real labels above inputs, never placeholder-as-label. Learners with limited English are a core persona, so **every meaningful icon is paired with text** and colour is never the sole carrier of state.

---

## 8. Storage

| Bucket | Public | Contents | Access |
|---|---|---|---|
| `lesson-media` | No | Dialogue audio (3 speeds), cultural videos, images | Signed URLs, issued server-side only if the student is entitled to the level |
| `vocab-audio` | No | Per-word pronunciation | Signed URLs, entitlement-checked |
| `homework` | No | Student recordings, uploads | Owner + assigned teacher + admin |
| `certificates` | No | Generated PDFs | Owner + admin; verification page reads metadata only, not the file |
| `receipts` | No | Invoices and payment receipts uploaded by admins | **Admin only.** Students never see these — they may name a third-party payer. |
| `avatars` | Yes | Profile pictures | Public read, owner write |
| `blog` | Yes | Article images | Public read, admin write |

Storage policies mirror table RLS. Uploads go through Server Actions that validate MIME type and size before issuing a signed upload URL — the browser never holds a long-lived write credential.

---

## 9. External Integrations

| Integration | Purpose | Notes |
|---|---|---|
| **Google Calendar API** | Session events + auto Meet links | OAuth per teacher; refresh tokens encrypted at rest in `teacher_profiles`. Falls back to manual link entry if not connected. |
| **Resend** | Transactional email | **On the critical path**, because invite emails are the only way a student gets an account. Sends invites, session confirmations and reminders, homework feedback, and certificate notices. Supabase's built-in SMTP is rate-limited to a few messages per hour and will fail a 30-person cohort import — configure Resend as a custom SMTP provider in Supabase Auth so invite emails go through it too, not just application email. |
| **PDF generation** | Certificates | Server-side render → upload to `certificates` bucket → store path + verification code. |
| **Stripe / Chapa / Telebirr** | Phase 3 | Webhook writes an `entitlements` row. No other code path changes. |
| **Sentry** | Error tracking | Added at the end of Phase 1. |

---

## 10. Environment Variables

```bash
# .env.example — committed. Real values live in .env.local (gitignored) and Vercel.

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=           # server-only, never NEXT_PUBLIC_
SUPABASE_PROJECT_ID=                 # for type generation

NEXT_PUBLIC_SITE_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/oauth/callback

RESEND_API_KEY=
EMAIL_FROM="Fidel <hello@fidel.app>"

CRON_SECRET=
```

Any variable prefixed `NEXT_PUBLIC_` is shipped to the browser. Adding that prefix to a secret is an incident, and CI greps for it.

---

## 11. Quality Gates

| Gate | Rule |
|---|---|
| TypeScript | `strict: true`. **`ignoreBuildErrors` is forbidden** — the reference project used it and accumulated thousands of hidden errors. |
| ESLint | `next/core-web-vitals` + `@typescript-eslint`. Zero warnings on CI. |
| Unit tests | Vitest. Everything in `lib/domain/` requires tests — grading, unlock rules, and slot generation are where correctness bugs actually hurt. |
| E2E tests | Playwright on: admin provisions a student → student accepts invite and sets password → completes Unit 1 Part 3; book a session (consuming a credit); teacher marks attendance; admin grants unit-scoped access; certificate verification. Plus a negative test asserting `/signup` 404s and a direct `/auth/v1/signup` call is rejected. |
| Database | `supabase db lint` in CI. Every migration is forward-only and reversible by a follow-up migration. |
| Types | `supabase gen types typescript` output committed as `src/types/database.types.ts`; CI fails if regenerating produces a diff. |
| Secrets | CI greps for `NEXT_PUBLIC_.*SERVICE_ROLE` and hardcoded passwords. |

**Git workflow** (carried over from masterbuilder, which got this right): branch-first, `<type>/<kebab-description>`, Conventional Commits, squash merge, no direct commits to `main`.

---

## 12. Local Development

```bash
pnpm install
cp .env.example .env.local          # fill in Supabase + Google + Resend values

pnpm supabase link --project-ref <ref>
pnpm supabase db push               # apply migrations to the linked project
pnpm db:types                       # regenerate src/types/database.types.ts
pnpm db:seed                        # Level ሀ Unit 1 + demo users

pnpm dev
```

| Script | Does |
|---|---|
| `dev` | `next dev --turbopack` |
| `build` / `start` | Production build / serve |
| `lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `test` / `test:e2e` | Vitest / Playwright |
| `db:types` | Regenerate database types |
| `db:push` / `db:reset` / `db:seed` | Migration and seed management |

---

## 13. Explicit Anti-Patterns

Each of these was observed in the reference implementation. None is acceptable here.

1. Client-side-only route protection with session state in `localStorage`.
2. Blanket `allow read, write: if request.auth != null` — the RLS equivalent is `USING (true)`. Never ship it.
3. Hardcoded default passwords in source. The reference project shipped `Password123!` in a login page.
4. Demo/seed user injection that bypasses authentication.
5. God service modules spanning multiple roles.
6. Two parallel models for the same concept (the reference project ran legacy and new exam schemas simultaneously).
7. Unused dependencies.
8. `typescript.ignoreBuildErrors: true`.
9. All-client data fetching with no server rendering.
10. Duplicate fetching through both a hook and a context for the same data.
11. Missing database indexes on foreign keys and filter columns.
12. Listing a validation library and then hand-rolling validation anyway.
13. Hiding a signup route in the UI while leaving `/auth/v1/signup` open on the API. Disable email signups in the Supabase dashboard, or the restriction is theatre.
14. Leaving an orphaned `auth.users` row when provisioning fails partway — the email becomes permanently unusable. Always roll back with `deleteUser`.
15. Using `middleware.ts` on Next 16. It is deprecated; the convention is `proxy.ts`.

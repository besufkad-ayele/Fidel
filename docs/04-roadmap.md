# Fidel — Build Roadmap

Ticket-level execution plan. Epics are ordered by dependency: nothing in a later epic can start before its prerequisites land. Each ticket has a definition of done that is objectively checkable.

**Legend:** `[F]` foundation · `[B]` backend/data · `[U]` UI · `[C]` content · `[I]` integration

---

## Phase 1 — Foundation

The goal is a running application with real authentication, a complete database, and three role shells that render real routes with honest empty states. No learning features yet. Phase 1 is done when a seeded student can log in, land on an empty dashboard, and be unable to reach anything they shouldn't.

### Epic F1 — Project scaffold

| # | Ticket | Done when |
|---|---|---|
| F1.1 `[F]` | `create-next-app` — Next 16.2, TypeScript strict, App Router, Turbopack, pnpm, ESLint | `pnpm dev` serves; `tsc --noEmit` clean; **`ignoreBuildErrors` absent from `next.config.ts`** |
| F1.2 `[F]` | Tailwind v4 + design tokens | `globals.css` matches `docs/05-design-system.md` §2 verbatim — full green/gold/cream ramps, semantic colours, shadows, `.img-card-overlay*` utilities; light and dark both render |
| F1.3 `[F]` | Fonts: Inter, DM Serif Display, Noto Sans Ethiopic via `next/font` | ሰላም renders correctly at all six Amharic sizes; no layout shift |
| F1.3b `[F]` | `/public` directory scaffold per `docs/05-design-system.md` §3, with placeholder assets and the brand-gradient fallback | Every declared path exists; a missing asset renders the gradient, never a broken image |
| F1.4 `[F]` | shadcn/ui init + base components (button, input, card, dialog, sheet, table, tabs, select, badge, skeleton, sonner, sidebar, dropdown, avatar, progress, tooltip) | `components.json` present; all render in a scratch route |
| F1.5 `[F]` | Folder structure per architecture §2 with `.gitkeep`s and an `ARCHITECTURE.md` pointer | Structure matches the doc exactly |
| F1.6 `[F]` | `next-intl` wired: `messages/en.json`, `i18n/request.ts`, `localePrefix: 'as-needed'` | A component renders a translated string; adding `am.json` requires no component change |
| F1.7 `[F]` | `.env.example`, `.gitignore`, `README.md` with setup steps | A fresh clone can be run from the README alone |
| F1.8 `[F]` | Git: repo init, branch protection conventions documented, Conventional Commits | `main` protected; README documents the workflow |

### Epic F2 — Supabase connection and schema

| # | Ticket | Done when |
|---|---|---|
| F2.1 `[B]` | Link the Supabase project `qlaglzamyelcgqcemjqe`; `supabase init`; commit `config.toml` | `supabase db pull` succeeds |
| F2.2 `[B]` | Migration 001 — extensions, `fidel` schema, all enums, `touch_updated_at` | Applies cleanly to a fresh database |
| F2.3 `[B]` | Migration 002 — identity tables, `student_internal_notes`, `handle_new_user` trigger, role-change guard | Creating an auth user auto-creates `profiles` + `student_profiles`; a student cannot read their own internal notes |
| F2.4 `[B]` | Migration 003 — organizations + cohorts | Case-insensitive unique org name holds |
| F2.5 `[B]` | Migration 004 — curriculum tables + `media_assets` | Constraints and indexes match `docs/02-data-model.md` §4 |
| F2.6 `[B]` | Migration 005 — vocabulary + M2M + relations + trigram index | Search on 500 seeded rows returns in under 50 ms |
| F2.7 `[B]` | Migration 006 — assessment tables + `quiz_questions_student` view | Check constraints on `quizzes` reject invalid unit/level combinations |
| F2.8 `[B]` | Migration 007 — progress tables, rollup trigger, `is_unit_unlocked` | Completing Part 3 flips `self_paced_status` automatically |
| F2.9 `[B]` | Migration 008 — homework tables | Unit-default vs personal assignment check constraint holds |
| F2.10 `[B]` | Migration 009 — availability, time off, sessions with the GIST exclusion constraint | Two overlapping scheduled sessions for one teacher are rejected by the database |
| F2.11 `[B]` | Migration 010 — **payments, entitlements with `scope`, session credit ledger**, balance + expiry functions | A unit-scoped grant opens exactly one unit; an expired entitlement grants nothing; `session_credit_balance` matches the ledger sum |
| F2.12 `[B]` | Migration 011 — certificates, notifications, audit log, blog | `verify_certificate` RPC returns correctly for valid and invalid codes |
| F2.13 `[B]` | Migration 012 — RLS helper functions incl. scope-aware `has_unit_access` / `has_level_access` | Each helper returns the right answer for student / teacher / admin, and for level vs unit grants |
| F2.14 `[B]` | Migration 013 — RLS policies on every table | **Verification script proves a student cannot read another student's rows in any table, and cannot read `payments` at all** |
| F2.15 `[B]` | Migration 014 — storage buckets and policies, incl. admin-only `receipts` | Cross-user homework access denied; a student cannot read any receipt |
| F2.16 `[B]` | Migration 015 — `provision_student` RPC + `consume_session_credit` | Provisioning is atomic: forcing a mid-function error leaves zero partial rows |
| F2.17 `[B]` | Custom access token hook for the role claim | Decoded JWT contains `app_metadata.role` |
| F2.18 `[B]` | **Disable email signups in the dashboard**; document both auth settings in the runbook | `POST /auth/v1/signup` with the anon key is rejected |
| F2.19 `[B]` | Type generation + `pnpm db:types` + CI drift check | `src/types/database.types.ts` committed; CI fails on drift |
| F2.20 `[B]` | `seed.sql` — six levels, ten ሀ units, one org, four demo users incl. a **unit-scoped** student | `pnpm db:reset && pnpm db:seed` yields a working demo; **no password in the repo** |

### Epic F3 — Auth and the three-layer boundary

| # | Ticket | Done when |
|---|---|---|
| F3.1 `[B]` | The four Supabase clients (`server`, `client`, `proxy`, `admin` with `server-only`) | Importing `admin.ts` from a client component fails the build |
| F3.2 `[B]` | **`src/proxy.ts`** (Next 16 convention) + `updateSession` | Session persists across a hard refresh; the mutated response object is returned unmodified; no `middleware.ts` exists anywhere |
| F3.3 `[B]` | `lib/auth/guards.ts` — `requireAuth`, `requireRole`, `requireUnitAccess`, `requireAdminSection`; uses `getUser()` not `getSession()` | Direct URL access to another role's route redirects |
| F3.4 `[U]` | `/login` + `signIn` action, with allowlisted `?next=` | Open-redirect attempt is rejected; suspended account shows the right message |
| F3.5 `[U]` | **`/set-password`** invite acceptance + `/auth/confirm?type=invite` | An invited user sets a password, `activated_at` is stamped, `is_active` flips true; an expired link shows the recovery path |
| F3.6 `[I]` | Google OAuth + `/auth/callback` **with existing-profile verification** | A Google account with no `profiles` row is signed out and shown "No Fidel account exists for this email" |
| F3.7 `[B]` | `/auth/confirm` (invite / recovery / email_change), `/auth/signout` | All three OTP types route correctly |
| F3.8 `[U]` | `/forgot-password`, `/reset-password` | Full reset cycle succeeds end to end |
| F3.9 `[U]` | `/welcome` 3-screen tour + `completeWelcome`, incl. the timezone confirmation control | Shown exactly once; skipping still stamps `welcome_seen_at` |
| F3.10 `[F]` | Negative auth tests | `/signup` 404s; direct `/auth/v1/signup` is rejected; both asserted in Playwright |

### Epic F4 — Application shells

| # | Ticket | Done when |
|---|---|---|
| F4.1 `[U]` | `AppShell` + responsive sidebar + user menu | Mobile sheet works; keyboard navigable |
| F4.2 `[U]` | Student / teacher / admin sidebars from `lib/constants/navigation.ts` | Active route highlighting correct on nested routes |
| F4.3 `[U]` | `(learn)`, `(teach)`, `(admin)` layouts with guards | Each renders only for its role |
| F4.4 `[U]` | Shared components: `EmptyState`, `PageHeader`, `DataTable`, `ConfirmDialog`, `FidelBadge`, `AmharicText`, `AudioPlayer`, **`ImageCard`**, `StatusChip`, `ProgressBar`, `ProgressRing`, `ScoreRing` | Each matches its spec in `docs/05-design-system.md` §4; documented in a scratch `/dev/components` route removed before Phase 2 ends |
| F4.5 `[U]` | `loading.tsx`, `error.tsx`, `not-found.tsx` per group | No route ever shows a bare spinner |
| F4.6 `[F]` | Vitest + Playwright setup; first E2E: admin provisions → student accepts invite → dashboard | Green in CI |
| F4.7 `[F]` | GitHub Actions: typecheck, lint, unit, `supabase db lint`, type-drift, secret grep, Ethiopic-outside-`AmharicText` lint | All gates pass on a PR |

**Phase 1 exit criteria**
- A seeded student, teacher, and admin can each log in and reach only their own area.
- A student provisioned with **unit-scoped** access can open exactly those units and no others.
- Every table has RLS, verified by an automated script that attempts cross-user reads on all of them, including a student attempting to read `payments`.
- `/signup` does not exist and the signup API is disabled.
- CI is green on all gates.
- No hardcoded credentials, no `localStorage` sessions, no `ignoreBuildErrors`, no `middleware.ts`.

---

## Phase 2 — Core Learning Product (MVP)

### Epic A1 — Admin provisioning *(first, because nothing else is testable without accounts)*

Since there is no public signup, the provisioning panel is a hard prerequisite for every other Phase 2 epic. Build it before the learning features, not after. Full specification in `docs/06-admin-forms.md`.

| # | Ticket | Done when |
|---|---|---|
| A1.1 `[B]` | `lib/data/admin/people.ts` + `organizations.ts` + `entitlements.ts` + `payments.ts` | Typed reads with filters and pagination |
| A1.2 `[B]` | `createStudentSchema` (`docs/06-admin-forms.md` §3) with all cross-field refinements | Unit tests cover: paid source requires a payment, primary teacher required when teachers selected, expiry after start, at least one grant per scope |
| A1.3 `[B]` | `createStudent` Server Action: invite → RPC → rollback on failure | Forcing an RPC error deletes the auth user, leaving no orphan; the email is reusable immediately afterwards |
| A1.4 `[U]` | `/admin/people/students/new` — seven sections + sticky summary rail + confirmation screen | A student can be created end to end; the one-time setup link appears exactly once when invite email is off |
| A1.5 `[U]` | `/admin/people` directory with filters, search, bulk select | Filters are URL-encoded and shareable |
| A1.6 `[U]` | `/admin/people/[id]` detail with tabbed real routes and all lifecycle actions | Every action requires a reason and writes `audit_log` |
| A1.7 `[U]` | `/admin/people/teachers/new` and `/admin/people/admins/new` | Super Admin creation requires typing `SUPERADMIN` |
| A1.8 `[U]` | `/admin/entitlements` grant panel with level/unit scope + revoke | A unit-scoped grant opens exactly those units, verified in the student UI |
| A1.9 `[U]` | `/admin/payments` ledger + outstanding panel + CSV export | Multi-currency totals are grouped, never silently summed |
| A1.10 `[U]` | `/admin/organizations` + standard access package + `/admin/cohorts` | "Apply this organization's package" prefills the provisioning form |
| A1.11 `[U]` | `/admin/people/students/import` bulk CSV — upload, map, validate, confirm | 30 rows import; one bad row fails alone; re-running the same file creates no duplicates |
| A1.12 `[B]` | `admin_title` permission map + `requireAdminSection` guard | A Content Manager cannot reach `/admin/people` by URL |
| A1.13 `[B]` | Credit ledger actions: grant, consume, refund, expire | Balance always equals the ledger sum; concurrent bookings cannot overdraw |
| A1.14 `[I]` | Resend configured as Supabase Auth SMTP + invite template | A 30-row import sends 30 invites without rate-limiting |
| A1.15 `[U]` | `/admin` overview with commercial KPIs | Revenue, outstanding, expiring-soon, invite acceptance all render |

### Epic L1 — Curriculum reading path
`[B]` `lib/data/levels.ts`, `units.ts`, `lesson-parts.ts` · `[B]` Zod content schemas for the three parts · `[U]` `/levels` and `/levels/[levelSlug]` · `[U]` unit shell with part tabs and progress rail · `[B]` `lib/domain/progress-rules.ts` with unit tests · `[U]` locked-unit page explaining why.

### Epic L2 — The three parts
`[U]` Part 1 renderer with persona-selected framing and scroll/video completion · `[U]` Part 2: objectives, vocabulary cards, dialogue player with three speeds and transliteration toggle, grammar notes, pronunciation tips · `[U]` Part 3: exercise renderers (one per type), speaking recorder, roleplay, homework box, quiz runner · `[B]` `markPartProgress`, `submitExercise`, `submitQuiz` actions · `[B]` `grade_quiz` security-definer RPC · `[U]` nudge banner with persisted dismissal · `[U]` unit-complete celebration with next-step CTAs.

*Highest-risk tickets in the whole project:* the dialogue player (three synchronized audio speeds with per-line playback) and the exercise renderer (six distinct interaction types). Budget accordingly and build the audio player first as a standalone component with fixture data.

### Epic L3 — Vocabulary
`[B]` `lib/data/vocabulary.ts` with trigram search · `[U]` `/vocabulary` table, filters, URL-encoded state, detail drawer · `[U]` `/vocabulary/flashcards` deck with keyboard controls and self-rating · `[B]` rating persistence for the future SRS.

### Epic L4 — Homework
`[B]` `lib/data/homework.ts` + submission actions · `[B]` signed upload URLs with MIME and size validation · `[U]` `/homework` inbox grouped by status · `[U]` `/homework/[id]` with attempt history and resubmission.

### Epic L5 — Live sessions
`[B]` `lib/domain/availability.ts` slot generation (pure, unit-tested against DST cases) · `[I]` Google Calendar OAuth per teacher, encrypted refresh tokens · `[I]` event + Meet link creation · `[B]` `bookSession` with server-side re-validation, **credit consumption in the same transaction**, and graceful handling of the exclusion-constraint violation · `[U]` `/sessions/book` four-step flow in the student's timezone with the credit cost shown before confirm · `[U]` zero-balance read-only state · `[U]` `/sessions` and `/sessions/[id]` with balance in the header · `[B]` cancel/reschedule with the 12-hour rule and credit refund · `[I]` reminder cron at T−24h and T−1h · `[B]` entitlement expiry cron.

### Epic L6 — Teacher workspace
`[U]` `/teach` Today with live pre-study status · `[U]` `/teach/sessions/[id]/prep` split view · `[U]` session wrap-up: attendance, notes, homework override · `[B]` `unlockUnitForStudent` with required reason and audit write · `[U]` `/teach/students` and detail · `[U]` `/teach/homework` queue and review · `[U]` `/teach/availability` grid editor with booking-conflict warnings · `[U]` `/teach/settings` calendar connection.

### Epic L7 — Admin content CMS *(people and access already shipped in A1)*
`[U]` level and unit management with reordering · `[U]` three purpose-built part editors with autosave, live preview, and Zod validation · `[U]` exercise and quiz authoring · `[U]` vocabulary CRUD with CSV import and audio upload · `[U]` media library with orphan detection · `[U]` sessions, certificates, blog, audit views · `[B]` publish workflow writing audit entries and revalidating the curriculum tag.

### Epic L8 — Certificates
`[B]` level exam using the quiz engine with `is_level_exam` · `[B]` eligibility check (all units complete) · `[I]` server-side PDF generation with the brand template · `[B]` verification code generation and the public RPC · `[U]` `/certificates` and `/verify/[code]`.

### Epic L9 — Notifications and email
`[B]` `notifications` writes on the seven `notification_kind` events · `[U]` bell menu with unread badge and read-state optimism · `[I]` Resend templates: **invite**, session confirmed, session reminder, homework feedback, certificate issued, access granted · `[U]` notification preferences in `/account`.

### Epic L10 — Marketing site
`[U]` landing with all nine sections including the working sample-lesson audio · `[U]` Request access CTA opens `NEXT_PUBLIC_REQUEST_ACCESS_URL` (external form) · `[U]` public `/levels` and `/teachers` · `[U]` blog index and post · `[F]` SEO: metadata, OG images, sitemap, robots, JSON-LD · `[F]` analytics.

### Epic C1 — Content authoring (parallel track, starts once L7 part editors land)
`[C]` **Unit 1 Greetings, complete and final** — this is the template; nothing else starts until it is signed off · `[C]` ~18 vocabulary items with audio at three speeds · `[C]` Units 2–10 authored against the template · `[C]` per-persona "why this matters" variants for all ten units · `[C]` Level ሀ exam · `[C]` level metadata and "coming soon" copy for ለ–ረ · `[C]` three seed blog posts.

Content is the long pole. Recording native audio at three speeds for ten units of dialogue plus ~180 vocabulary words is weeks of studio and editing work that cannot be compressed by engineering. Start it the day the Unit 1 template is approved.

**Phase 2 exit criteria**
- An admin can provision a student — including organization, access grant at level or unit scope, offline payment record, session credits, and teacher assignment — in one form, and bulk-import 30 more from CSV.
- That student accepts the invite, sets a password, completes all ten units, books and attends a live session (consuming a credit), submits homework, receives feedback, passes the level exam, and downloads a verifiable certificate.
- A unit-scoped student can open exactly the units they hold and no others.
- A teacher can run their full day without touching the admin panel.
- An admin can author a new unit end to end without an engineer.
- Playwright covers the critical flows plus the negative auth tests.

---

## Phase 3 — Self-serve monetization

Pricing page and per-level and per-unit pricing configuration · Stripe Checkout · webhook handler writing `payments` then `entitlements` (idempotent via the unique `(provider, provider_ref)` index, signature-verified) · self-serve trial via `source='trial'` · session credit packs as a purchasable product · billing history and invoices in `/account` · automated receipts · refund handling with entitlement revocation and credit clawback · then Chapa and Telebirr for local rails · **optionally** open public signup, which is a product decision rather than a technical one.

**The entire integration surface is: insert a `payments` row, then insert an `entitlements` row** — exactly what the admin form already does. Nothing in the learning product changes. That is the payoff for building admin provisioning and entitlements first rather than bolting a checkout onto content.

The admin panel does not go away when gateways ship. Scholarships, embassy packages, staff accounts, and support corrections need it permanently.

---

## Phase 4 — Intelligence & Reach

AI pronunciation scoring on the existing speaking submissions · AI conversation partner · spaced repetition over the flashcard ratings already being collected · placement test writing `student_profiles.placement_level_id` · Amharic UI locale activated through the existing next-intl layer · content translation via `*_translations` side tables · group sessions via `session_participants` · mobile app · community features.

Every Phase 4 item has a hook already present in the Phase 1 schema. None requires a migration that rewrites existing tables.

---

## Sequencing Notes

**Critical path:** F1 → F2 → F3 → F4 → **A1** → L1 → L2 → C1(Unit 1) → everything else.

**A1 moved to the front of Phase 2 and this is the most important sequencing change in the plan.** With no public signup, there is no way to create a test student — or a real one — without the provisioning panel. Building learning features first would mean testing them against seed data only, which hides exactly the bugs that matter: does a real invite arrive, does a unit-scoped grant actually restrict, does a credit get consumed once.

**Parallelizable once Phase 1 lands:** L3 vocabulary, L5 sessions, and L10 marketing are independent of L2. L7's three part editors block C1 content authoring, so prioritize them above the rest of the content CMS.

**Build order within L2:** `AudioPlayer` → dialogue player → Part 2 → Part 1 → exercise renderers → quiz runner → Part 3. Part 2 first, because the audio infrastructure it needs is the riskiest component and everything else is comparatively predictable.

**Do not start** Units 2–10 authoring before Unit 1 is signed off. Ten units authored against a template that then changes is the most expensive mistake available in this project.

## Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Native audio production for 10 units × 3 speeds | Blocks the MVP more than any code | **Recording is already underway.** Ship Unit 1 audio before Unit 1 code is finished; confirm the three-speed naming convention and file format with the studio now, so re-exports are not needed later |
| **Email deliverability** | With no public signup, a failed invite email means a student simply cannot get in — this is a total blocker, not a degradation | Configure Resend as Supabase Auth SMTP in Phase 1, not Phase 2; always provide the one-time setup link as a manual fallback; monitor bounce rates; test against an embassy domain early, since government mail servers are aggressive filterers |
| Google Calendar OAuth complexity per teacher | Blocks booking | Build the manual-link fallback first so booking works without OAuth; add OAuth after |
| Timezone bugs in slot generation | Wrong meeting times, lost trust | Pure functions in `lib/domain/availability.ts` with an explicit DST test suite; the `/welcome` timezone confirmation catches admin data-entry errors |
| RLS policy gaps | Data leak | Automated cross-user access test over every table in CI, not a manual review. Include a student attempting to read `payments` and another student's `student_internal_notes` |
| Unit-scoped access edge cases | A student sees content they did not pay for, or is locked out of content they did | `has_unit_access` is the most security-sensitive function in the schema; seed a unit-scoped demo student and assert against it in CI |
| Credit ledger drift | A student books more sessions than they paid for | Balance is always derived, never stored; consumption happens inside the booking transaction; concurrency test with simultaneous bookings |
| Provisioning form fatigue | 40+ fields is a lot to fill for every student | Only Sections A and B are required; organizations carry reusable standard packages; bulk CSV handles cohorts. Measure time-to-create and cut fields if it exceeds three minutes |
| Exercise renderer scope creep | Six interaction types is a lot of UI | Ship fill-blank, translate, and multiple-choice first; matching, word-order, and roleplay follow within Phase 2 |
| Admin CMS being unpleasant | Content authoring stalls | Treat the three part editors as a product, not a form; author Unit 1 through the CMS itself as the acceptance test |
| Card background art unavailable | Cards look broken | Every `<ImageCard>` falls back to the brand gradient plus the fidel pattern; the product is shippable with zero photography |

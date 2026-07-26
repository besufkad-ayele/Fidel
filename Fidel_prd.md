# ፊደል (Fidel) — Online Amharic Learning Platform
## Product Requirements Document (PRD) v2.1

**Meaning:** "Fidel" (ፊደል) is the Amharic word for "alphabet" — the foundational symbols every learner must master before anything else. The name signals: *start at the beginning, build up properly.*

**Status:** Approved for engineering. Supersedes v1.0 and v2.0.
**Stack:** Next.js 16 (App Router) + Supabase (Postgres, Auth, Storage, Realtime) + Google Calendar/Meet API.
**Companion documents:**
- `docs/01-architecture.md` — technical architecture, conventions, auth boundary
- `docs/02-data-model.md` — full Postgres schema, enums, RLS policies, storage
- `docs/03-screens-and-routes.md` — route map and screen-by-screen specification
- `docs/04-roadmap.md` — phased build plan with epics and tickets
- `docs/05-design-system.md` — design tokens, `/public` asset inventory, component-by-component visual specs
- `docs/06-admin-forms.md` — admin provisioning, access grants, offline payment records, field-by-field forms

---

## 0. What Changed From v1.0

### New in v2.1

| Area | v2.0 | v2.1 |
|---|---|---|
| **Account creation** | Public signup with email + Google OAuth | **No public signup.** Admins provision every account from the admin dashboard; the student receives an invite email and sets their own password. Public surface is landing, curriculum, teachers, blog, certificate verification, and **login only**. `/signup` does not exist. |
| **Access granularity** | Level only | **Level *or* unit.** `entitlements.scope` lets an admin sell or grant individual units ("paid parts") as well as whole levels. |
| **Payment handling** | Deferred entirely to Phase 3 | **Offline payment records at MVP.** Admins log amount, currency, method, date, reference, and receipt file against the grant, so revenue reporting works before any gateway exists. Phase 3 gateways write to the same `payments` table. |
| **Live sessions** | Unlimited once entitled | **Session credit ledger.** Admins grant a paid session count; booking consumes a credit, a cancellation outside 12 hours refunds it. Balance is the sum of a signed ledger, which keeps it auditable. |
| **Organizations** | Not modeled | **`organizations` table.** Embassies, NGOs, and universities buy on behalf of staff, so the payer needs to be a first-class record separate from the learner. |
| **Design specification** | Tokens only | **Full component specification** in `docs/05-design-system.md` — exact anatomy, dimensions, states, and `/public` asset paths for every component. |
| **Proxy convention** | `middleware.ts` | **`proxy.ts`.** Next.js 16 deprecates the `middleware` file convention and renames it to `proxy` (function renamed too, defaults to the Node runtime). |

### Changed from v1.0

| Area | v1.0 | v2.x |
|---|---|---|
| **Payments** | Stripe at MVP, paywall per level | **Gateways deferred to Phase 3.** MVP records offline payments in the admin dashboard against a source-agnostic `entitlements` table. Stripe/Chapa/Telebirr write into the same tables later with zero refactor. |
| **Trial / free tier** | Open question | Handled through `entitlements.source = 'trial'` with an expiry, granted by an admin. Self-serve trials arrive with Phase 3. |
| **Access control** | Paywall-driven | **Entitlement-driven.** Access is a first-class concept independent of how it was acquired. |
| **Interface language** | Unspecified | **English-only UI at MVP, with next-intl infrastructure fully wired.** Every UI string lives in a message catalog from day one so Amharic/French/Arabic can be added without refactoring components. |
| **Unit completion** | Single `student_progress` row | **Two-tier:** per-part progress (`part_progress`) drives accurate progress percentages and the Part-1-skipped nudge; per-unit rollup (`student_unit_progress`) drives unlocks. |
| **Vocabulary ↔ unit link** | `unit_id` FK on vocabulary | **Many-to-many** (`unit_vocabulary`), because v1.0 §3.2 requires the same word to be reused across multiple units. |
| **Homework** | Single URL column | **`homework_submissions`** table supporting resubmission, versioning, teacher feedback, and status workflow. |
| **Quizzes / exercises** | Embedded in content JSON | **Queryable tables** (`exercises`, `quiz_questions`, `quiz_attempts`) so scores are analyzable and the "quiz average per unit" KPI actually works. |
| **Certificates** | PDF only | **PDF + public verification URL** with a short verification code, so embassies and NGOs can validate authenticity. Resolves v1.0 open question #4. |
| **Placement test** | Open question | **Deferred.** MVP always starts at ሀ. Data model reserves `student_profiles.placement_level_id`. |
| **Level ID scheme** | `'ha','le','Ha','me','se','re'` | `ha, le, hha, me, sse, re` — all lowercase and URL-safe (v1.0's `Ha` vs `ha` collides case-insensitively). |
| **Audit trail** | None | **`audit_log`** table for teacher manual unlocks, admin content publishing, and entitlement grants. |

---

## 1. Product Vision

Fidel is a hybrid Amharic-learning platform: **always-available self-paced content** (lessons, vocabulary, audio, exercises) combined with **bookable live 1:1 or small-group sessions over Google Meet** with native Ethiopian teachers. The two tracks share one curriculum, so a teacher and a self-studying learner are always looking at the same material — just at different depths.

### 1.1 The core insight

Most language platforms force a choice: buy an app (cheap, lonely, plateaus fast) or hire a tutor (effective, expensive, unstructured). Fidel refuses the choice. The **curriculum is the single source of truth**, and both delivery modes read from it. A teacher opening lesson prep sees exactly what the student saw, plus what the student actually completed before the call — so no live minute is wasted re-teaching vocabulary the student already drilled.

### 1.2 Target personas

| Persona | Primary motivation | Implication for product |
|---|---|---|
| Diplomats & embassy staff in Addis | Professional credibility, protocol, CEFR-recognized certificate | Certificates with CEFR equivalence + verification URL; formal register content |
| NGO / humanitarian workers | Field communication, community trust | Practical situational units (transport, market, health) |
| Researchers, academics, heritage scholars | Reading, transcription, interview skills | Script mastery, formal writing, literature at higher levels |
| Tourists & short-term visitors | Survival phrases, fast | Level ሀ standalone value; low-commitment entry |
| Missionaries | Long-horizon fluency, community integration | Full six-level path |
| Ethiopian diaspora | Reconnection, family, identity | Cultural depth in Part 1; heritage framing |

Persona is collected at onboarding and used to select the "why this matters" framing variant in Part 1 of every unit.

### 1.3 Non-goals (explicit)

Fidel is not a gamified streak app, not a social network, and not a marketplace of independent tutors. Teachers are vetted staff, not open-signup freelancers. There is no student-to-student messaging at MVP.

---

## 2. Competency Levels — Fidel Ordering

Instead of the conventional CEFR labels (A1, A2, B1...), Fidel uses the traditional Ethiopian syllabary (fidel) order for its six levels — one fidel character per tier. This is core to the brand identity.

| Level ID | Slug | Fidel | CEFR equiv. | Name | Can-do summary |
|---|---|---|---|---|---|
| 1 | `ha` | **ሀ** | A1 | ሀ — Foundations | Greet, introduce self, handle basic transactions |
| 2 | `le` | **ለ** | A2 | ለ — Elementary | Daily routines, shopping, simple past/future |
| 3 | `hha` | **ሐ** | B1 | ሐ — Intermediate | Opinions, storytelling, unexpected situations |
| 4 | `me` | **መ** | B2 | መ — Upper Intermediate | Debate, abstract topics, workplace Amharic |
| 5 | `sse` | **ሠ** | C1 | ሠ — Advanced | Fluent discussion, nuance, formal writing |
| 6 | `re` | **ረ** | C2 | ረ — Mastery | Near-native command, literature, public speaking |

**Rules:**
- Learner-facing UI, URLs, marketing, and certificates display the fidel letter as the primary label; the CEFR code appears as a subordinate badge.
- `levels.cefr_equivalent` is stored on every level record so certificates issued to embassies and NGOs print the recognized equivalent.
- URLs use the ASCII slug (`/levels/ha`) — never the Ethiopic character — to avoid percent-encoding and copy-paste breakage. The display layer maps slug → fidel character.
- **MVP scope:** Level ሀ is fully built out (10 units, full vocabulary bank, full lesson content). Levels ለ–ረ exist as database records with titles, descriptions, and unit placeholders but render as "coming soon" in the UI. This exercises the data model and entitlement logic end-to-end without needing six levels of content on day one.

---

## 3. Content Architecture

```
Level (ሀ)
 ├── Vocabulary Bank ......... all words tagged to this level (M2M to units)
 ├── Unit 1: Greetings
 │    ├── Part 1 — Cultural Insight
 │    ├── Part 2 — Language Lesson
 │    └── Part 3 — Practice
 ├── Unit 2: Self-Introduction
 ├── Unit 3: Family
 ├── ... (10 units total for Level ሀ)
 └── Level Completion Exam → Certificate (PDF + verification URL)
```

### 3.1 Unit / Lesson structure (fixed 3-part shape, every level)

The three-part shape is **fixed and non-negotiable** across all levels. This is what lets one teacher-prep view work for every unit and one authoring form work for every unit. Content within each part is a typed JSON document validated by a Zod schema, so the admin CMS can render a purpose-built editor rather than a freeform blob.

**Part 1 — Cultural Insight** *(orientation; ungraded)*
- Hook question to prime curiosity
- Short cultural essay (markdown) or 2–3 minute video
- "Why this matters" framing — **one variant per persona**, selected at render time from the student's onboarding persona
- Do's & Don'ts callout block
- Optional 1-question comprehension check (ungraded, engagement signal only)

**Part 2 — Language Lesson** *(input)*
- 2–3 learning objective statements ("By the end you can...")
- Core vocabulary for this unit, pulled by reference from the level's Vocabulary Bank
- Dialogue: text + native audio at **three speeds** (slow / normal / natural), per-line playback and a full-dialogue player
- Grammar note(s) scoped to this dialogue only — no forward references
- Pronunciation tips, including the specific Amharic sounds this unit introduces (ጠ, ጨ, ቀ ejectives etc.)
- Auto-generated flashcard deck from the tagged vocabulary

**Part 3 — Practice** *(output; graded)*
- Speaking practice: record + playback, stored to Supabase Storage. Teacher review at launch; AI pronunciation scoring is a Phase 4 hook, not MVP
- Written exercises: fill-in-blank, translate (EN↔AM), matching, multiple choice, word order
- Roleplay / branching conversation simulation
- Real-world homework task (e.g. "go greet one Ethiopian person today, report what happened")
- Quiz — auto-graded, instant feedback, retakeable with attempt history
- Completion → unit rollup updates → next unit unlocks

**Navigation rule (confirmed):** Part order is *suggested, not enforced*. A student can jump from Part 1 to Part 3 directly. If they open Part 3 with no recorded `part_progress` for Parts 1–2, show a dismissible nudge banner: *"You haven't reviewed the vocabulary for this unit yet — want to check it first?"* with a direct link back. Dismissal is persisted per unit so the banner never nags twice. **No hard gate.**

**Part completion semantics** (new in v2.0 — needed for honest progress bars):

| Part | Marked `completed` when |
|---|---|
| Part 1 — Cultural Insight | Student scrolls to end of essay, or video reaches 90% watched |
| Part 2 — Language Lesson | Student plays the dialogue at least once **and** views the flashcard deck |
| Part 3 — Practice | Quiz submitted (any score) |

Unit `self_paced_status` becomes `completed` only when Part 3 is completed. Progress percentage on the level overview is computed from part-level completion (so a student mid-unit sees meaningful movement), not from unit-level completion alone.

### 3.2 Vocabulary Bank (per level, many-to-many to units)

Vocabulary is a standalone, queryable table — not text embedded in lesson content. Lessons reference vocabulary by ID through a join table, so the same word can be reused and reviewed across multiple units.

| Field | Example |
|---|---|
| `id` | `ha-greet-001` |
| `level_id` | `ha` |
| `amharic_script` | ሰላም |
| `transliteration` | selam |
| `pronunciation_audio_path` | storage path |
| `english_meaning` | hello / peace |
| `part_of_speech` | interjection |
| `example_sentence_am` | ሰላም! እንዴት ነህ? |
| `example_sentence_en` | Hello! How are you? |
| `formality` | neutral / formal / informal |
| `gender_variant` | neh (to male) / nesh (to female) |
| `related_word_ids` | `[ha-greet-002, ha-greet-005]` |
| `image_path` | optional |
| `difficulty_weight` | int, reserved for future spaced repetition |

**My Vocabulary Bank** (sidebar page) is a searchable, filterable view across every vocabulary item in the levels the student is entitled to — independent of the unit they're currently on. Filters: level, unit, part of speech, formality, "words I've seen" vs "all". This powers cross-unit review and flashcard "study all" mode.

### 3.3 Media strategy

All audio, video, and images are referenced through a `media_assets` table (storage path, MIME type, duration, optional transcript) rather than raw URL strings scattered through content JSON. This gives one place to re-encode, one place to add captions, and makes orphan detection possible when content is deleted.

---

## 4. Self-Paced + Live Session Model

Two independent but linked tracks over the same curriculum:

- **Self-paced:** always available for any unlocked unit. No teacher required.
- **Live:** booked separately (day / time / teacher), linked to a specific unit. The teacher's prep view shows that unit's content, so the live call teaches *through* the same material the student studies alone.

A unit's completion carries **two independent status flags**, not one binary "done":

| Flag | Values | Set by |
|---|---|---|
| `self_paced_status` | `not_started` / `in_progress` / `completed` | Student's own activity (derived from part progress) |
| `live_status` | `not_booked` / `booked` / `completed` | Booking lifecycle + teacher marking attendance |

### 4.1 Booking → Unit link (session record)

| Field | Notes |
|---|---|
| `id` | booking record |
| `unit_id` | e.g. `ha-unit-01` — nullable for free-form conversation sessions |
| `teacher_id` / `student_id` | |
| `scheduled_at` / `duration_minutes` / `student_timezone` | timezone stored explicitly; all timestamps `timestamptz` |
| `status` | `scheduled` / `completed` / `cancelled` / `no_show` |
| `meet_link` / `google_event_id` | auto-generated via Google Calendar API |
| `pre_study_snapshot` | JSON snapshot of the student's part progress **at booking time**, so the teacher sees preparation delta |
| `session_notes` | teacher-entered, post-session |
| `homework_override` | defaults to the unit's homework; teacher may replace |
| `attended` | teacher-marked |

**Google Meet link generation:** via Google Calendar API with OAuth on the teacher's account — creates the event and Meet link automatically and gives free calendar invites and reminders to both parties. Manual link entry is a fallback for when OAuth is not yet connected, not the primary path.

**Booking constraints (new in v2.0):**
- Slots derive from `teacher_availability` (weekly recurring rules) minus existing sessions minus `teacher_time_off`.
- A `no overlapping sessions per teacher` exclusion constraint is enforced **in the database**, not just in application code — double-booking is a data integrity problem, not a UI problem.
- Cancellation window: student may cancel or reschedule up to 12 hours before; inside 12 hours it requires teacher action.

### 4.2 Unlock rule

Units unlock **sequentially within a level** by default: complete unit N to open N+1 self-paced. Two exceptions:

1. **Teacher manual unlock** — a teacher can unlock a later unit for a specific student ahead of sequence, used when a live session needs to jump ahead (student already knows greetings; teacher wants to start on Family). This is an explicit teacher action, requires a reason, and is written to `audit_log`. It is not a student-facing toggle.
2. **Admin unlock** — admins can unlock anything for support purposes; also audited.

Unit 1 of every level is always unlocked for an entitled student.

---

## 5. Student Experience — Full Flow

**Entry is by invitation, not self-service.** An administrator creates the account, grants access, and records the payment (see §7.1 and `docs/06-admin-forms.md`). The student's journey begins with an email.

1. **Landing page** — marketing site: value proposition, level ladder, sample lesson, teacher profiles, testimonials. CTA is **"Request access"** opening an **external form** (`NEXT_PUBLIC_REQUEST_ACCESS_URL`), not an in-app signup. A secondary "Log in" sits in the header.
2. **Invite email → set password** — the student clicks a one-time link, sets a password, and lands in the app. Google OAuth is available as a login method for an already-provisioned email, but never as an account-creation path.
3. **Welcome walkthrough** (not data collection — the admin already captured persona, timezone, and goal at provisioning): a 3-screen tour of the sidebar, the three-part unit shape, and how to book a live session. Skippable, shown once. The student can correct their persona, timezone, and goal in `/account` at any time, and those edits flow straight into content personalization.
4. **Dashboard** — sidebar shell:
   - ፊደል wordmark
   - **My Levels** — ሀ ለ ሐ መ ሠ ረ listed vertically. Entitled levels are plain links. Non-entitled levels show a lock icon and greyed label — still clickable, opening a dialog that explains how to request access from their administrator (Phase 3: checkout).
   - **Book a Live Session** — teacher and time-slot picker
   - **My Vocabulary Bank** — cross-level searchable word list, scoped to entitled levels
   - **Progress & Certificates**
   - **Homework Inbox** — submissions and teacher feedback, unified across self-paced and live-assigned homework
   - **Account**
   Dashboard body: continue-where-you-left-off card, next recommended unit, upcoming session, homework awaiting action, current streak-free progress summary.
5. **Open an entitled level (e.g. ሀ)** → **Level overview**: progress %, vocabulary count, next-recommended-unit highlighted, full unit list with per-unit lock / in-progress / complete state and live-session indicator.
6. **Open a unit** → Part 1 → Part 2 → Part 3, freely navigable (see §3.1).
7. **Complete Part 3** → unit `self_paced_status = completed` → progress updates → next unit unlocks → toast with next action.
8. **Book a live session** for any unlocked unit at any point.
9. **Complete all units + pass the level exam** → certificate generated (PDF + verification code) → appears under Progress & Certificates.

---

## 6. Teacher Experience

- **Today** — today's sessions with per-student pre-study status, one-click join, and prep shortcut
- **Lesson prep view** — the same unit content the student sees, plus a teacher-only panel: student's part progress, quiz scores, last homework, previous session notes, and suggested talking points
- **Attendance & session notes** — mark attended / no-show, write notes, optionally override the homework assignment
- **Manual unit unlock** — override sequential lock for a specific student, with required reason (audited)
- **Homework review queue** — across all assigned students, both self-paced and live-assigned, with statuses `pending` / `reviewed` / `needs_resubmission`
- **Students** — roster of assigned students with progress at a glance and per-student detail
- **Availability & Calendar** — weekly recurring availability, time off, Google Calendar connection status

---

## 7. Admin Experience

The admin dashboard is not a back office bolted on at the end — it is the **only** way accounts and access come into existence, so it ships in Phase 2 as a first-class product. Full field-by-field specification in `docs/06-admin-forms.md`.

- **People** — provision students, teachers, and admins. Student creation is a seven-section form covering account, learner profile, organization and sponsor, locale and scheduling, access grant, payment record, and teacher assignment. Bulk CSV import for cohorts. Full lifecycle: resend invite, reset password, suspend, reactivate, reassign, delete.
- **Access & payments** — grant or revoke access at **level or unit** granularity, set start and expiry dates, grant live-session credits, and record the offline payment (amount, currency, method, date, reference, receipt file). Filters for expiring-soon and payment-outstanding.
- **Organizations** — embassies, NGOs, universities, and companies as first-class payer records with billing contacts and reusable standard access packages.
- **Content CMS** — levels, units, lesson parts (a purpose-built editor per part type), vocabulary bank, exercises, quizzes, media library. Draft → in review → published workflow with publish audit.
- **Sessions** — all bookings across teachers, cancellations, no-show reporting.
- **Certificates** — issuance log, manual issue, revocation, verification lookups.
- **Blog / CMS** — SEO articles (e.g. "100 Essential Amharic Words").
- **Analytics** — the KPIs in §12, plus revenue recorded from offline payments.
- **Audit log** — every privileged action with actor, entity, and the reason the admin typed. Filterable.

### 7.1 Access & payment model (replaces checkout at MVP)

```
Admin creates student → grants levels and/or units → records offline payment
                      → grants session credits → assigns teacher → invite sent
```

Three tables carry it: `entitlements` (what the student can open, with `scope` of `level` or `unit`), `payments` (the bookkeeping record, with manual methods alongside future gateway providers), and `session_credit_entries` (a signed ledger whose sum is the live-session balance).

**Why this is the right MVP.** The buyers are institutions paying by bank transfer against an invoice, not individuals entering card details. A registrar-style panel matches how the money actually moves. When Stripe lands in Phase 3, it inserts a `payments` row and an `entitlements` row — exactly what the admin form does today — and no learning-product code changes.

**Admin-managed access is not a temporary hack.** Even after gateways ship, scholarships, embassy packages, staff accounts, and support corrections all need this panel permanently.

---

## 8. Data Model

The complete schema — every table, column, enum, index, RLS policy, storage bucket, and helper function — lives in **`docs/02-data-model.md`**. Summary of the table groups:

| Group | Tables |
|---|---|
| Identity | `profiles`, `student_profiles`, `teacher_profiles`, `student_teacher_assignments`, `organizations`, `cohorts` |
| Curriculum | `levels`, `units`, `lesson_parts`, `media_assets` |
| Vocabulary | `vocabulary_items`, `unit_vocabulary`, `vocabulary_relations` |
| Assessment | `exercises`, `exercise_attempts`, `quizzes`, `quiz_questions`, `quiz_attempts` |
| Progress | `part_progress`, `student_unit_progress`, `unit_unlocks` |
| Homework | `homework_assignments`, `homework_submissions` |
| Live sessions | `teacher_availability`, `teacher_time_off`, `sessions` |
| Access & money | `entitlements` (scope: level or unit), `payments` (manual now, gateways later), `session_credit_entries` (signed ledger) |
| Output | `certificates` |
| Platform | `notifications`, `audit_log`, `blog_posts` |

**Row Level Security is mandatory on every table.** No table ships without policies. The service-role key is used only in server-side admin code paths and never reaches the client. Access checks route through SQL helper functions (`fidel.is_admin()`, `fidel.is_teacher_of(uuid)`, `fidel.has_level_access(text)`, `fidel.has_unit_access(text)`) so policy logic lives in one place, and the caller's role is read from a JWT custom claim rather than a per-row subquery on `profiles`.

---

## 9. Tech Stack & Architecture

Full detail in **`docs/01-architecture.md`**. Headlines:

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2 App Router, React 19.2, TypeScript 5 **strict** (no `ignoreBuildErrors`) |
| Rendering | React Server Components for all content reads; Server Actions for all mutations. No client-side database access. |
| Data / Auth / Storage | Supabase — Postgres, Auth, Storage, Realtime; `@supabase/ssr` for cookie-based sessions |
| Auth boundary | **`proxy.ts`** (Next 16's replacement for `middleware.ts`) for session refresh + coarse routing, **plus** server-side role guards in every protected layout, **plus** RLS in the database. Three layers, no client-side-only checks. |
| Account creation | **Admin-provisioned only.** Supabase Auth invite links; no public signup route exists. |
| Styling | Tailwind CSS v4 + shadcn/ui, carrying over the masterbuilder design tokens (`#1A3636` deep green, `#D6AD60` gold, `#F9F7F2` cream) — full ramps and component specs in `docs/05-design-system.md` |
| Fonts | Inter (UI), DM Serif Display (headings), **Noto Sans Ethiopic** (all Amharic script) |
| i18n | `next-intl` — English-only catalog at MVP, full infrastructure in place |
| Validation | Zod 4 — one schema per Server Action input and per lesson-part content shape |
| Forms | react-hook-form + `@hookform/resolvers/zod` |
| Calendar / Meet | Google Calendar API, OAuth per teacher |
| PDF | Certificate generation server-side, stored in Supabase Storage |
| Payments | **Offline records at MVP**, entered in the admin dashboard. Stripe in Phase 3, then Chapa / Telebirr. |
| Testing | Vitest (unit + Server Actions), Playwright (critical flows), `supabase db lint` in CI |
| Hosting | Vercel + Supabase managed |

### 9.1 Non-negotiable engineering rules

These exist because the reference implementation (masterbuilder) violated each one and paid for it:

1. **No client-side authorization as the only gate.** Every protected route is guarded server-side; every table has RLS.
2. **No session state in `localStorage`.** Auth lives in HTTP-only cookies via `@supabase/ssr`.
3. **No god-service modules.** Data access is split by domain into small typed query modules under `src/lib/data/`.
4. **No `?tab=` dashboards.** Every view is a real, linkable, server-rendered route.
5. **Schema changes only via migrations.** `supabase/migrations/*.sql` is the source of truth; TypeScript types are generated from the database, never hand-written.
6. **No hardcoded credentials, ever.** Admins never see or set a student's password; students set their own from an invite link. Seed users get generated passwords printed once to the console.
7. **Strict TypeScript and lint must pass in CI** before merge.
8. **No public account creation.** Every account originates from an authenticated admin action, and every grant carries a reason in `audit_log`.

---

## 10. Scope by Phase

### Phase 1 — Foundation *(this phase)*
Supabase project connected; migrations for the full schema; RLS on every table; generated types; seed data for Level ሀ Unit 1; Next.js scaffold with design tokens, i18n infrastructure, `proxy.ts` session handling, role guards, **login and invite-acceptance flows (no signup)**, and the three dashboard shells rendering real routes with empty states.

### Phase 2 — Core Learning Product *(MVP)*
- Landing page (Request access → external form URL) + student welcome walkthrough
- **Admin provisioning: student / teacher / admin creation forms, bulk CSV import, access grants at level and unit scope, offline payment records, session credit ledger, organizations** — this ships early in Phase 2 because nothing else can be tested without accounts
- Level ሀ fully authored: 10 units × 3 parts + complete vocabulary bank
- Levels ለ–ረ as "coming soon"
- Level overview + unit pages with non-enforced part navigation and the skip nudge
- Part progress tracking, sequential unlock, teacher manual override with audit
- Vocabulary bank page + flashcards
- Exercises + auto-graded quizzes with attempt history
- Homework upload + teacher review workflow
- Booking system: teacher availability, slot generation, credit consumption, Google Meet auto-link, cancellation rules
- Teacher dashboard: today, prep view, attendance, notes, homework queue, students, availability
- Admin content CMS: three purpose-built part editors, vocabulary, media, exercises, quizzes
- Certificates: level exam, PDF generation, public verification page
- Notifications (in-app + transactional email)

### Phase 3 — Monetization
Self-serve Stripe checkout writing into `payments` + `entitlements`; public pricing page; self-serve trial; billing history and invoices for students; automated receipts; then Chapa and Telebirr for local Ethiopian rails. **Public signup may open at this point** — the decision is a product call, not a technical one, since the admin path remains regardless.

### Phase 4 — Intelligence & Reach
AI pronunciation scoring; AI conversation partner; spaced-repetition scheduling over the existing vocabulary bank; placement test; additional locales activated through the existing i18n layer; mobile app; community features (conversation clubs, movie nights).

### Explicitly out of scope for MVP
Public signup, self-serve checkout, any payment gateway, AI features, mobile app, community features, placement test, SRS scheduling, student-to-student messaging, group sessions beyond 1:1.

---

## 11. Level ሀ — MVP Unit Outline

| # | Unit | Core competency |
|---|---|---|
| 1 | Greetings | ሰላም, formal vs informal, gendered forms |
| 2 | Self-Introduction | Name, nationality, occupation |
| 3 | Family | Kinship terms, possessives |
| 4 | Numbers | 1–100, prices, quantities |
| 5 | Time | Clock (Ethiopian and Western), days, months |
| 6 | Shopping | Bargaining, quantities, "how much" |
| 7 | Food & Ordering | Menu items, injera culture, dietary needs |
| 8 | Taxi & Transportation | Destinations, fares, "stop here" |
| 9 | Hotel | Booking, rooms, amenities, complaints |
| 10 | Asking for Directions | Left / right / straight, landmarks |

**Unit 1 (Greetings) is the reference implementation** and the content template for units 2–10: cultural note on Ethiopian greeting customs, ሰላም / እንዴት ነህ dialogue between Hana and Abel at three audio speeds, ~18 tagged vocabulary items, translate / fill-blank / record exercises, real-world homework, and a quiz. Build it first, completely, before authoring any other unit.

---

## 12. Success Metrics

| KPI | Definition | Target signal |
|---|---|---|
| Level ሀ self-paced completion | % of entitled students completing all 10 units | Content quality |
| Unit drop-off | Where students stop | Identifies the weak unit |
| Live booking rate | % of entitled students booking ≥1 session | Hybrid model validation |
| Session attendance | attended / scheduled | Scheduling friction |
| Homework submission rate | per unit | Engagement depth |
| Quiz average per unit | mean first-attempt score | Flags unclear content (<60% = rewrite) |
| Part-1 skip rate | Part 3 opened before Part 2 | Validates the no-hard-gate decision |
| Teacher utilization | booked hours / available hours | Supply planning |
| Invite acceptance rate | accounts activated / invites sent | Provisioning friction — a low rate means the invite email is failing or confusing |
| Time to first lesson | invite accepted → first part completed | Onboarding friction |
| Certificate issuance | certificates / completions | Exam calibration |
| Revenue recorded | sum of `payments` where status = paid | Business health, from offline records |
| Payments outstanding | count and value of pending / invoice-unpaid | Collections |
| Session credit utilization | credits consumed / credits granted | Whether institutions get value from what they bought |

---

## 13. Resolved Decisions

| Open question | Resolution |
|---|---|
| Pricing model per level | **Gateways deferred to Phase 3.** MVP is entitlement-driven with admin-recorded offline payments. `entitlements.scope` supports both whole-level and per-unit sales, so the commercial model can be set without schema work. |
| How do accounts get created? | **Admin provisioning only.** No public signup at MVP. See `docs/06-admin-forms.md`. |
| How is access to "paid parts" managed? | **`entitlements.scope`** of `level` or `unit`, granted from `/admin/entitlements` or inline during student creation. |
| How are live sessions paid for? | **Session credit ledger.** Admin grants a count; booking consumes one; cancellation outside 12 hours refunds it. Balance is the sum of signed ledger entries. |
| Trial lesson policy | `entitlements.source = 'trial'` with a default 14-day expiry, granted by an admin. Self-serve trials arrive in Phase 3. |
| Placement test | **Deferred to Phase 4.** MVP starts every student at ሀ. `student_profiles.placement_level_id` reserved. |
| Certificate format / verification | **PDF with a short verification code** and a public `/verify/[code]` page showing student name, level, fidel character, CEFR equivalent, issue date, and validity — so embassies and NGOs can confirm authenticity without contacting support. |
| Interface language | **English-only UI at MVP, next-intl wired from day one.** Adding a locale is a catalog + config change, never a component refactor. |
| Group sessions | 1:1 only at MVP. `sessions` schema permits a future `session_participants` table without breaking changes. |

## 14. Remaining Assumptions To Confirm

- Session duration options: 30 / 45 / 60 minutes, or fixed 60? *(Schema currently allows all three.)*
- Level exam format: same engine as unit quizzes, or does it require a live oral component graded by a teacher?
- Do teachers need to author content, or is authoring admin-only? *(Current assumption: admin-only; teachers consume and annotate.)*
- Transactional email provider. **This is now on the critical path** — invite emails are the only way a student gets in, so email cannot be an afterthought. Supabase's built-in SMTP is rate-limited to a handful of messages per hour and will not survive a 30-person embassy import. Resend recommended.
- Is a student ever assigned to more than one teacher? *(Current assumption: `student_teacher_assignments` is many-to-many to keep it open.)*
- Should access be automatically withheld when a payment is marked pending or invoice-unpaid? *(Current assumption: no — the admin controls this by setting an expiry date, and the system reports rather than enforces.)*
- Currency of record for reporting when payments arrive in ETB, USD, and EUR. *(Current assumption: store the original currency and amount; convert only at report time.)*

---

*End of PRD v2.1 — see `docs/04-roadmap.md` for the ticket-level breakdown, `docs/05-design-system.md` for visual specs, and `docs/06-admin-forms.md` for provisioning forms.*

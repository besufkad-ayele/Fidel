# Fidel — Screens & Routes

Screen-by-screen specification for every route. Each entry lists the purpose, the data it reads, the actions it can trigger, the empty and error states, and the acceptance criteria. This is the document to check against when reviewing a PR: if a screen does not do what is written here, the PR is incomplete.

**Conventions used below**
- **Reads** — functions in `src/lib/data/`
- **Actions** — Server Actions in `src/lib/actions/`
- **Guard** — the server-side check in the enclosing layout

---

## 0. Route Map

| Group | Route | Guard | Purpose |
|---|---|---|---|
| marketing | `/` | none | Landing |
| marketing | `/levels` | none | Public curriculum ladder |
| marketing | `/teachers` | none | Teacher profiles |
| marketing | `/blog`, `/blog/[slug]` | none | SEO articles |
| marketing | external form URL | none | Request access uses `NEXT_PUBLIC_REQUEST_ACCESS_URL` (Typeform/Google Form/etc.) — no in-app form |
| marketing | `/verify/[code]` | none | Certificate verification |
| auth | `/login`, `/forgot-password`, `/reset-password` | redirect if signed in | Auth screens. **`/signup` does not exist — it 404s.** |
| auth | `/set-password` | valid invite session | Invite acceptance — the student's first screen |
| auth | `/auth/callback`, `/auth/confirm`, `/auth/signout` | none | Non-UI endpoints |
| onboarding | `/welcome` | session required | 3-screen tour, shown once |
| learn | `/dashboard` | `student` | Student home |
| learn | `/levels` *(authed variant)* | `student` | My levels |
| learn | `/levels/[levelSlug]` | `student` | Level overview |
| learn | `/levels/[levelSlug]/units/[unitSlug]/culture` | `student` + unit access | Part 1 |
| learn | `…/lesson` | `student` + unit access | Part 2 |
| learn | `…/practice` | `student` + unit access | Part 3 |
| learn | `/levels/[levelSlug]/exam` | `student` + all units complete | Level exam |
| learn | `/vocabulary`, `/vocabulary/flashcards` | `student` | Vocabulary bank |
| learn | `/sessions`, `/sessions/book`, `/sessions/[id]` | `student` | Live sessions |
| learn | `/homework`, `/homework/[id]` | `student` | Homework inbox |
| learn | `/progress` | `student` | Progress dashboard |
| learn | `/certificates` | `student` | Certificates |
| learn | `/account` | `student` | Profile & settings |
| teach | `/teach` | `teacher` | Today |
| teach | `/teach/schedule` | `teacher` | Upcoming sessions |
| teach | `/teach/availability` | `teacher` | Weekly availability + time off |
| teach | `/teach/students`, `/teach/students/[id]` | `teacher` | Roster + student detail |
| teach | `/teach/sessions/[id]`, `…/prep` | `teacher` + owns session | Session detail + prep |
| teach | `/teach/homework`, `/teach/homework/[id]` | `teacher` | Review queue |
| teach | `/teach/settings` | `teacher` | Google Calendar connection |
| admin | `/admin` | `admin` | Analytics + revenue overview |
| admin | `/admin/levels`, `/admin/levels/[id]` | `admin` | Level CMS |
| admin | `/admin/units/[id]`, `…/parts/[part]` | `admin` | Unit + part editors |
| admin | `/admin/units/[id]/exercises`, `…/quiz` | `admin` | Assessment authoring |
| admin | `/admin/vocabulary` | `admin` | Vocabulary CMS |
| admin | `/admin/media` | `admin` | Media library |
| admin | `/admin/people` | `admin` | User directory |
| admin | `/admin/people/students/new` | `admin` | **Student provisioning — 7 sections** |
| admin | `/admin/people/students/import` | `admin` | Bulk CSV import |
| admin | `/admin/people/teachers/new` | `admin` | Teacher provisioning |
| admin | `/admin/people/admins/new` | `admin` | Admin provisioning |
| admin | `/admin/people/[id]` | `admin` | Detail + lifecycle actions |
| admin | `/admin/organizations`, `/admin/organizations/[id]` | `admin` | Payer records |
| admin | `/admin/cohorts`, `/admin/cohorts/[id]` | `admin` | Cohort management |
| admin | `/admin/entitlements` | `admin` | Access grants (level or unit) |
| admin | `/admin/payments` | `admin` | Offline payment records + outstanding |
| admin | `/admin/sessions` | `admin` | All bookings |
| admin | `/admin/certificates` | `admin` | Issuance log |
| admin | `/admin/blog`, `/admin/blog/[id]` | `admin` | Blog CMS |
| admin | `/admin/audit` | `admin` | Audit log |

Admin routes are additionally filtered by `profiles.admin_title` — a Content Manager sees only content sections. The guard is `requireAdminSection('content')`, which redirects rather than 403s.

---

## 1. Marketing

### `/` — Landing

**Purpose:** convert a diplomat, NGO worker, or diaspora visitor into a signup within one scroll.

**Sections, in order:**
1. **Hero** — full-bleed `/backgrounds/hero-landing.webp` with `.img-card-overlay`. ፊደል mark at 72px, headline "Learn Amharic the way it's actually spoken", subhead naming the hybrid model, primary CTA **"Request access"** (gold), secondary "See the curriculum" (cream ghost). There is no "Sign up" — accounts are provisioned by an administrator.
2. **The six levels** — horizontal ladder of fidel characters ሀ ለ ሐ መ ሠ ረ, each a card with the CEFR badge, name, and can-do summary. ሀ marked "Available now"; the rest "Coming soon".
3. **How it works** — three columns: Study on your own / Book a live teacher / Earn a recognized certificate. Emphasize that both tracks share one curriculum.
4. **Sample lesson** — an interactive slice of Unit 1: the ሰላም vocabulary card with working audio playback. This is the single highest-converting element on the page; it must work without signing in.
5. **Built for your work** — persona cards (diplomats, NGO, researchers, diaspora) each with one specific line about what Fidel does for them.
6. **Teachers** — three teacher cards with photo, name, years teaching, languages.
7. **Testimonials** — placeholder-safe; hidden if none exist rather than showing lorem ipsum.
8. **FAQ** — accordion.
9. **Final CTA + footer.**

**Reads:** `getPublishedLevels()`, `getFeaturedTeachers()`, `getSampleVocabulary()`
**Rendering:** static with `revalidate = 3600`
**Acceptance:** Lighthouse performance ≥ 90 on mobile; sample audio plays for an anonymous visitor; all copy from `messages/en.json`.

### `/levels` (public) — Curriculum ladder

Full six-level detail with unit titles for each. Unit *titles* are public; unit *content* is not. Each unit row shows title, estimated minutes, and a lock icon. CTA per level: "Start ሀ" or "Notify me".

### `/verify/[code]` — Certificate verification

**Purpose:** an embassy HR officer pastes a code and gets an unambiguous answer.

Calls the `verify_certificate(code)` RPC. Valid → certificate card with student name, fidel character, level title, CEFR equivalent, issue date, and a green "Valid" state. Invalid or revoked → red "No valid certificate found for this code", with no further detail (avoids enumeration). No auth required. `revalidate = 300`.

---

### Request access (external)

There is **no** `/request-access` route. The landing CTA opens `NEXT_PUBLIC_REQUEST_ACCESS_URL` (Typeform, Google Form, or similar). Set that env var when the form is ready; until then the CTA falls back to Log in.

---

## 2. Auth

**There is no signup screen.** `/signup` returns 404, and email signups are disabled in the Supabase dashboard so the API cannot be called directly either. Accounts come from `/admin/people/students/new`.

### `/login`

Split layout (`docs/05-design-system.md` §5.2): `/backgrounds/hero-auth.webp` on the left at `lg` and above, form on the right, image dropped entirely below `lg`.

Email + password, "Continue with Google", "Forgot password". Honors `?next=` for post-login redirect, validated against an allowlist of internal paths to prevent open redirect.

**Action:** `signIn` → on success, redirect to `?next=` if safe, otherwise the role home (`/dashboard`, `/teach`, `/admin`).

**Failure copy matters here** because there is no self-service recovery path. Invalid credentials say "Email or password is incorrect." A suspended account says "This account is inactive. Contact your administrator." An email with no account says the same as invalid credentials — no enumeration.

### `/set-password` — invite acceptance

The student's first screen, reached from the invite email via `/auth/confirm?type=invite`.

Shows a welcome line using their name, then password (min 8, strength meter) and confirm. On submit, sets the password, stamps `profiles.activated_at`, flips `is_active` to true, and redirects to `/welcome`.

**Edge cases:** an expired or already-used link shows "This invitation link has expired" with a "Request a new one" button that notifies the admin. A signed-in student visiting this route directly is redirected to `/account` to change their password instead.

### `/auth/callback` and `/auth/confirm`

Route Handlers. `callback` exchanges the OAuth code for a session and then **verifies a `profiles` row exists for that email** — if not, it signs the session out immediately and redirects to `/login?error=no_account`. This is what stops Google OAuth from becoming a back-door registration path. `confirm` verifies the OTP for `invite`, `recovery`, and `email_change` types, routing `invite` to `/set-password` and `recovery` to `/reset-password`.

---

## 3. Welcome — `/welcome`

**Guard:** session required; redirects to role home if `welcome_seen_at` is set.

**This is a tour, not a form.** The admin already captured persona, timezone, study intent, and goal during provisioning, so asking again would be both redundant and a chance to introduce a contradiction. Three screens:

| Screen | Content |
|---|---|
| 1 — What you have | "You have access to ሀ — Foundations" with the level card, unit count, vocabulary count, and session credit balance if any. Confirms the admin's grant landed, in the student's own words. |
| 2 — How a unit works | The three-part shape with the `<PartCard>` trio, and the explicit reassurance that order is a suggestion, not a gate. |
| 3 — Live sessions | How booking works, what a teacher sees, and the credit balance. Skipped entirely for students with no credits and no teacher assigned. |

Final CTA goes straight into Unit 1, Part 1. Skippable at any point via "Skip the tour".

**A single confirmation field:** screen 1 shows the timezone the admin set with a "Not right? Change it" inline control — because a wrong timezone silently ruins every session time, and this is the cheapest possible moment to catch it.

**Action:** `completeWelcome` — sets `profiles.welcome_seen_at`, optionally updates timezone, then redirects.
**Acceptance:** shown exactly once; skipping still stamps `welcome_seen_at`; a student with no entitlement sees a variant of screen 1 explaining how to request access.

---

## 4. Student

Shell: fixed sidebar (ፊደል wordmark, nav, user menu at the bottom), collapsible on mobile into a sheet.

**Sidebar nav:** My Levels (expandable to the six fidel characters) · Book a Session · Vocabulary Bank · Homework *(badge: unreviewed count)* · Progress · Certificates · Account.

### `/dashboard` — Student home

Four zones:
1. **Continue** — the single most important card: last-touched unit with its part, progress ring, and "Continue" button. If nothing started, becomes "Begin Unit 1: Greetings".
2. **Next up** — recommended next unit with a one-line reason ("You finished Greetings — Self-Introduction builds on it").
3. **Upcoming session** — next scheduled session with teacher, local time, countdown, and a Join button that activates 10 minutes before. Empty state offers "Book your first live session".
4. **Needs your attention** — homework awaiting submission or with new feedback; locked levels teaser.

**Reads:** `getStudentDashboard(userId)` — one composed read, not five round trips.
**Acceptance:** renders fully server-side; a brand-new student sees a purposeful first-run state, never a wall of empty cards.

### `/levels` — My levels

Six `<LevelCard>`s per `docs/05-design-system.md` §4.4. Entitled: fidel character in gold, progress bar, "4 of 10 units complete", Continue. Not entitled: greyed with a lock, and clicking opens a dialog explaining that access is granted by their administrator, with a prefilled request that emails the admin team (Phase 3: "Unlock — $X"). Coming soon: distinct styling, no CTA.

**Unit-scoped entitlements render honestly.** A student holding only Units 1–2 of ሀ sees the level as partially available — "2 of 10 units available" alongside "1 of 2 units complete" — rather than a misleading whole-level progress bar. Units they do not hold appear locked with the reason "Not included in your current access."

### `/levels/[levelSlug]` — Level overview

Header: large fidel character, level title, CEFR badge, overall progress bar computed from **part** completion, vocabulary count, estimated remaining time.

Body: unit list. Each row shows sort number, title, estimated minutes, and two independent status chips — self-paced (`not started` / `in progress` / `completed`) and live (`booked` / `completed`) — plus a lock icon when not unlocked. The next recommended unit is visually elevated. Locked rows are clickable and explain *why* they're locked ("Complete Unit 3 to unlock") rather than being inert.

Sidebar rail: level vocabulary shortcut, level exam card (disabled until all units complete, showing "8 of 10 units complete"), certificate status.

**Reads:** `getLevelOverview(levelSlug, userId)`
**Acceptance:** unlock state matches `fidel.is_unit_unlocked` exactly; a teacher-unlocked unit shows an "Unlocked by your teacher" note.

### Unit shell — `/levels/[levelSlug]/units/[unitSlug]/…`

The layout provides everything the three parts share:
- Breadcrumb: Level ሀ → Unit 1: Greetings
- **Part tabs**: 1 Cultural Insight · 2 Language Lesson · 3 Practice — each with a completion tick. Freely clickable; **no gating**.
- Progress rail showing per-part completion
- Prev/next unit navigation
- **Nudge banner** (PRD §3.1): shown on the Practice tab when Parts 1–2 have no progress. Dismissible; dismissal persists via `part_progress.nudge_dismissed` so it never appears twice for that unit.

**Guard:** layout calls `requireUnitAccess(unitSlug)`; a non-unlocked unit renders a friendly locked page, not a 403.

### `…/culture` — Part 1: Cultural Insight

Renders the `cultural_insight` content document:
1. Hook question in display type
2. Essay (markdown, typography plugin) or video player
3. **"Why this matters"** — the variant matching the student's persona, falling back to `default`
4. Do's & Don'ts as two contrasting columns
5. Optional comprehension check — instant feedback, ungraded, no score stored

**Completion:** scroll-to-end sentinel, or video at 90%. Fires `markPartProgress` once, debounced.
**Action:** `markPartProgress({ unitId, part: 'cultural_insight', status })`

### `…/lesson` — Part 2: Language Lesson

1. **Objectives** — "By the end you can…" checklist
2. **Core vocabulary** — cards with Amharic script (Noto Sans Ethiopic, large), transliteration, English, part of speech, formality tag, gender variant note, and a play button per word
3. **Dialogue** — speaker-attributed lines with Amharic, transliteration, and English. Toggles: show/hide transliteration, show/hide English. A speed selector (slow / normal / natural) controls both the full-dialogue player and per-line playback
4. **Grammar notes** — collapsible cards, scoped to this dialogue only
5. **Pronunciation tips** — including the ejective consonants this unit introduces
6. **Flashcards** — "Study these 18 words" launches the deck with a return path to this unit

**Completion:** dialogue played at least once **and** flashcard deck opened.
**Acceptance:** all three audio speeds resolve to distinct assets; transliteration toggle persists across units in local storage; audio is keyboard-operable.

### `…/practice` — Part 3: Practice

Sequential sections, all on one page:
1. **Speaking practice** — record via MediaRecorder, play back, re-record, submit. Uploads to `homework` bucket. Explicit copy that a teacher will review it (no AI scoring at MVP).
2. **Written exercises** — one renderer per `exercise_type`: fill-blank (inline inputs), translate (textarea with an Amharic keyboard helper), matching (drag or tap-pair), multiple choice, word order. Each checks on submit with immediate feedback and an explanation.
3. **Roleplay** — branching conversation; each choice shows the consequence. Not scored.
4. **Homework task** — the real-world assignment, with a "Mark as done and reflect" submission box.
5. **Quiz** — the graded gate. Renders `quiz_questions_student` (no answer keys client-side). On submit, calls the `grade_quiz` RPC, shows per-question correctness with explanations and the total percentage, records a `quiz_attempts` row, and marks Part 3 complete.

**Completion → celebration:** unit marked complete, next unit unlocked, toast with two CTAs — "Next unit" and "Book a session on this unit".

**Actions:** `submitExercise`, `submitSpeaking`, `submitHomework`, `submitQuiz`
**Acceptance:** answer keys never appear in the client bundle or network payload; a failed quiz can be retaken and the attempt history is visible; recording works in Chrome, Safari, Firefox.

### `/vocabulary` — My Vocabulary Bank

Searchable table across all entitled levels. Search covers Amharic script, transliteration, and English (trigram index). Filters: level, unit, part of speech, formality, "seen / not yet seen". Columns: Amharic, transliteration, English, unit, audio button. Row click opens a detail drawer with example sentences, gender variants, related words, and an image if present.

Header actions: "Study all" and "Study filtered" launch flashcards over the current result set.

**Acceptance:** search stays responsive at 500+ items; filters are URL-encoded so a filtered view is shareable and back-button-safe.

### `/vocabulary/flashcards`

Full-screen deck. Front: Amharic script. Tap/space to flip. Back: transliteration, English, example sentence, audio. Self-rating: Again / Good / Easy (recorded now, consumed by the Phase 4 SRS scheduler). Progress indicator, shuffle, and an end-of-deck summary. Keyboard: space to flip, 1/2/3 to rate, Esc to exit.

### `/sessions` — My sessions

Header shows the credit balance: "3 session credits remaining". Two tabs as real routes (`?` not used): upcoming and past. Upcoming `<SessionCard>`s per `docs/05-design-system.md` §4.19: teacher, unit, local date/time **with an explicit timezone label**, countdown, Join (active from T−10min), Reschedule, Cancel — with the 12-hour rule surfaced honestly *before* the click, including whether cancelling refunds the credit. Past cards: attendance state, teacher notes, assigned homework link.

### `/sessions/book` — Booking flow

Four steps in one route:
1. **What** — pick a unit (defaults to current unit) or "General conversation"
2. **Who** — teacher cards with bio, languages, and next available slot; "Any available teacher" option
3. **When** — calendar with slots generated from `teacher_availability` − existing sessions − `teacher_time_off`, all rendered in the **student's** timezone with the timezone name shown explicitly
4. **Confirm** — summary, duration choice (30/45/60), optional "what I want to focus on" note, and the **credit cost**: "This uses 1 of your 4 session credits."

**Credit gating.** A student with a zero balance sees the booking flow in a read-only state with a clear panel: "You have no session credits. Contact your administrator to add more." The slot picker still renders, so they can see what is available and make an informed request. Credits are shown in the sidebar and on `/sessions`.

**Action:** `bookSession` — re-validates slot availability server-side (the exclusion constraint is the final arbiter), calls `fidel.consume_session_credit` in the same transaction, captures `pre_study_snapshot`, creates the Google Calendar event and Meet link, inserts the session, notifies both parties.
**Acceptance:** two students booking the same slot simultaneously — exactly one succeeds, the other gets "that slot was just taken", and **the loser's credit is not consumed**. A student at zero balance cannot book even by replaying the request. Timezone is correct across DST boundaries.

### `/homework` — Homework inbox

Unified list across self-paced and live-assigned work, grouped by status: Needs submission · Awaiting review · Reviewed · Needs resubmission. Each row: unit, title, due date, source (self-paced or from a session), status chip.

### `/homework/[id]`

Assignment instructions, submission form (text, file, audio), previous attempts with teacher feedback inline, resubmit when status is `needs_resubmission`.

### `/progress`

Level-by-level progress bars; unit completion grid; quiz score history chart; vocabulary learned count; sessions attended; homework completion rate; certificates earned. Read-only, honest — no vanity streaks.

### `/certificates`

Issued certificates as cards with the fidel character, level, CEFR equivalent, issue date, verification code (copyable), Download PDF, and a link to the public verification page. Empty state explains the path: complete all units → pass the level exam → certificate.

### `/account`

Profile (name, avatar upload, timezone, locale — locale disabled with "More languages coming soon"). Learning preferences (persona, study intent, goal) — editable by the student, and changes take effect immediately in Part 1 framing. Security (change password, connected Google account). Notification preferences.

**Read-only access panel:** which levels and units the student holds, expiry dates, and credit balance, with the note "Access is managed by your administrator" and a request button. Email is read-only with "Contact your administrator to change your email."

**No delete-account control.** Accounts are administered, not self-served; deletion is an admin action with a certificate check. Offering a self-delete button here would let a student destroy an institution's paid record.

---

## 5. Teacher

Shell: teacher sidebar — Today · Schedule · Availability · Students · Homework *(badge)* · Settings.

### `/teach` — Today

Primary working surface. Today's sessions ordered by time, each card showing: student name and avatar, unit, time with countdown, **pre-study status** (which parts the student completed for this unit — the whole point of the hybrid model), Join Meet, and Open Prep. Below: a "needs review" homework strip and a week-at-a-glance summary.

Empty state when no sessions today: this week's next session plus the homework queue, so the page is never dead.

**Reads:** `getTeacherToday(teacherId)`
**Acceptance:** times render in the *teacher's* timezone with the student's timezone shown as a secondary label; pre-study status is live, not the booking snapshot.

### `/teach/sessions/[id]/prep` — Lesson prep

Split view. Left: the exact unit content the student sees, all three parts, read-only. Right: a teacher-only panel with
- student's part-by-part progress and how it changed since booking
- quiz attempts and scores for this unit
- last homework submission and the teacher's own previous notes for this student
- suggested talking points derived from what the student skipped or scored low on
- a scratchpad that saves into `session_notes`

**Acceptance:** loads in one server render; the teacher panel is never visible in any student route.

### `/teach/sessions/[id]` — Session detail & wrap-up

Before: student note, pre-study snapshot, join link, reschedule/cancel.
After: mark Attended / No-show, session notes, homework — accept the unit default or override it, and optionally unlock a later unit for this student (requires a reason; writes `unit_unlocks` + `audit_log`).

**Actions:** `markAttendance`, `saveSessionNotes`, `assignHomework`, `unlockUnitForStudent`

### `/teach/students` and `/teach/students/[id]`

Roster with progress at a glance. Detail page: level progress, unit grid, quiz history, homework history, session history, notes timeline, and the manual unlock control.

### `/teach/homework` and `/teach/homework/[id]`

Queue filtered to assigned students, sorted oldest-first, with status filters. Detail: submission (text, files, audio player), assignment instructions, feedback box, grade, and three outcomes — Approve, Request resubmission, Approve with notes. Submitting feedback notifies the student.

### `/teach/availability`

Weekly grid editor (add/remove blocks per weekday), timezone selector, time-off ranges, and a preview of what students will see. Warn — do not silently drop — when removing availability that already has bookings.

### `/teach/settings`

Google Calendar connection status, connect/disconnect, and an explanation of what changes when it is connected (auto Meet links, calendar invites, reminders) versus not (manual link entry).

---

## 6. Admin

Shell: admin sidebar — Overview · Content (Levels, Vocabulary, Media) · People · Entitlements · Sessions · Certificates · Blog · Audit.

### `/admin` — Overview

KPI cards straight from PRD §12: active students, invite acceptance rate, Level ሀ completion rate, unit drop-off chart, sessions this week, teacher utilization, homework turnaround, quiz average per unit with a red flag under 60%, certificates issued.

Commercial row: revenue recorded (sum of paid `payments`, grouped by currency — never silently converted), payments outstanding with a count and total, entitlements expiring within 30 days, and session credit utilization.

Below: recent audit entries, content sitting in `in_review`, and pending invites older than 7 days.

### Content CMS

| Route | Function |
|---|---|
| `/admin/levels` | Level list with status, unit count, published/draft toggle |
| `/admin/levels/[id]` | Level metadata + reorderable unit list |
| `/admin/units/[id]` | Unit metadata, three part cards with status, exercises count, quiz status |
| `/admin/units/[id]/parts/cultural-insight` | Purpose-built editor: hook, markdown/video, per-persona "why this matters" repeater, do's & don'ts, optional check |
| `/admin/units/[id]/parts/language-lesson` | Objectives repeater, vocabulary picker (search + attach from the bank), dialogue line editor with three audio slots per line, grammar notes, pronunciation tips |
| `/admin/units/[id]/parts/practice` | Exercise list (add by type, reorder), roleplay branch editor, homework task, quiz link |
| `/admin/units/[id]/quiz` | Question editor per type with answer key and explanation |
| `/admin/vocabulary` | Table CRUD, bulk CSV import, audio upload per word, unit attachment |
| `/admin/media` | Upload, browse, filter by kind/unit, orphan detection |

Every editor: autosave draft, explicit Publish with a confirmation that names what becomes student-visible, live preview in the student's rendering, and Zod validation surfaced inline. Publishing writes `audit_log` and revalidates the `curriculum` cache tag.

**This is the highest-leverage admin surface** — nine more units get authored through it, so a clumsy editor costs weeks.

### People — the provisioning surface

**Complete field-by-field specification in `docs/06-admin-forms.md`.** This is where every account in the product is born, so it ships early in Phase 2 — nothing else can be tested without it.

| Route | Screen |
|---|---|
| `/admin/people` | Directory: search, filters (role, status, organization, cohort, access), columns for name, email, role, status, organization, levels held, credits, last active. Row actions and bulk select. |
| `/admin/people/students/new` | **Seven-section student form**: Account · Learner profile · Organization & sponsor · Locale & scheduling · Access grant · Payment record · Teacher assignment. Sticky summary rail on the right previewing exactly what submit will do, including a warning when no access is being granted. Ends on a confirmation screen listing account, access, credits, teacher, payment, and the invite status — with the one-time setup link shown **once** if invite email was disabled. |
| `/admin/people/students/import` | Bulk CSV: Upload → Map columns → Validate → Confirm. Per-row status with specific errors, downloadable error report, chunked at 25 rows with a progress bar, idempotent on email. |
| `/admin/people/teachers/new` | Account · Professional (headline, bio, experience, languages, qualifications, specializations) · Availability grid · Public profile · Rate. Google Calendar is connected by the teacher, never by an admin. |
| `/admin/people/admins/new` | Deliberately spare. Name, email, admin title (Super Admin / Content Manager / Program Coordinator / Support), invite. Creating a Super Admin requires typing `SUPERADMIN` and always writes to `audit_log`. |
| `/admin/people/[id]` | Detail with tabs as real routes: Overview · Access · Progress · Sessions · Homework · Payments · Notes · Activity. All lifecycle actions from `docs/06-admin-forms.md` §9 — resend invite, reset password, suspend, change email, grant/revoke access, add credits, assign teacher, unlock unit, reset unit progress, issue certificate, delete. Every one requires a reason and writes an audit entry. |

**Acceptance for student creation:** a failed provision leaves no orphaned auth user (verified by an integration test that forces the RPC to raise); the invite email arrives; the created student can accept, set a password, and immediately open the granted unit; a unit-scoped grant does **not** open sibling units.

### `/admin/organizations` and `/admin/cohorts`

Organization list with type, student count, total paid, outstanding balance. Detail page: billing contact, students, payments, and a **standard access package** editor whose settings prefill the provisioning form via "Apply this organization's package". Cohorts group students for bulk grants and bulk expiry extension.

### `/admin/entitlements`

The access surface after a student already exists — the common case, since an embassy buys ለ once the student finishes ሀ.

**Grant panel:** student (searchable) → scope (**Full level** or **Specific units**) → level cards or a level→unit checkbox tree → source → start and expiry dates → session credits → required note → optional payment record.

**Table:** Student · Organization · Scope · Level/Units · Source · Status · Granted · Expires · Credits remaining · Payment · Actions.
**Filters:** status (active / expiring within 30 days / expired / revoked) · source · level · organization · payment status.
**Row actions:** extend expiry · add credits · revoke (reason required) · view payment · view student.
**Bulk:** grant a level to a cohort; extend a cohort's expiry. Writes one audit entry **per student**, not one per batch.

### `/admin/payments`

Offline payment ledger. Table: student, organization, amount, currency, method, status, paid date, reference, receipt, recorded by. Filters for status and date range. Actions: record a payment against an existing student, attach a receipt, mark an invoice paid, export CSV for accounting.

A **Payments outstanding** panel pins pending and invoice-unpaid rows to the top with a total, because that is the number someone asks about every week. Access is never automatically withheld for non-payment — an admin controls that by setting an expiry date. The system reports; it does not enforce.

### `/admin/sessions`, `/admin/certificates`, `/admin/blog`, `/admin/audit`

All bookings with filters and cancellation. Certificate issuance log with manual issue and revoke. Blog CRUD with markdown editor and SEO fields. Audit log filterable by actor, action, entity, and date — and it must answer "who gave this student access, and why" in one query, because that is the question it exists for.

---

## 7. Cross-Cutting UI Requirements

Visual specifics — exact dimensions, states, asset paths, Tailwind classes — are in `docs/05-design-system.md`. This table is the behavioural contract.

| Concern | Requirement |
|---|---|
| **Image-backed cards** | Quiz, part, level, session, and certificate cards all use the shared `<ImageCard>` primitive with assets from `/public/backgrounds/` and `/public/levels/`. Missing assets fall back to the brand gradient, never a broken image. |
| **Loading** | Every route has `loading.tsx` with a skeleton matching the real layout — no spinners on full pages. |
| **Empty states** | Every list has a designed empty state with an action. Never a bare "No data". |
| **Errors** | `error.tsx` per route group with a retry. Server Action failures show a `sonner` toast with a translated message. |
| **Optimistic UI** | `useOptimistic` for progress ticks, flashcard ratings, and notification read state. Nothing that can fail destructively. |
| **Mobile** | Every student route is fully usable on a phone; the sidebar becomes a sheet. Teachers and admins are desktop-first but must not break on tablet. |
| **Amharic rendering** | All Amharic wrapped in `<AmharicText>` — Noto Sans Ethiopic, `lang="am"`, compensated font size. |
| **Audio** | One shared `<AudioPlayer>` with keyboard controls, speed selection, and a loading state. Never a bare `<audio>` tag. |
| **Timezones** | Every displayed time carries an explicit timezone label. All storage in `timestamptz`; all formatting via `next-intl`. |
| **Copy** | Zero hardcoded strings. Everything through `messages/en.json`. |

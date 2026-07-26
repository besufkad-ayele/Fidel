# Fidel — Admin Provisioning, Access & Payment Forms

There is **no public signup**. Every account is created by an administrator. This document specifies every provisioning form field by field, and the access/payment model that replaces a checkout flow at MVP.

---

## 1. The Provisioning Model

```
Admin creates student  →  grants access to levels and/or units  →  records the payment (offline)
                       →  assigns a teacher  →  optionally grants live-session credits
                       →  invite email sent  →  student sets password and logs in
```

**Why this fits Fidel.** The buyers are embassies, NGOs, and universities purchasing on behalf of staff, invoiced offline by bank transfer. A self-serve card checkout is the wrong first move; a registrar-style admin panel is the right one. When Stripe arrives in Phase 3, it writes into the same `payments` and `entitlements` tables the admin writes into today — the learning product never learns where access came from.

**Public surface at MVP:** landing page, public curriculum, teacher profiles, blog, certificate verification, and login. Nothing else. `/signup` does not exist and returns 404.

**Password handling.** The admin never sees or types a student's password. Creating a student sends a Supabase invite email carrying a one-time link; the student sets their own password on first visit. An admin may resend the invite or trigger a reset, but cannot read a password. If email is unavailable, the fallback is a **one-time setup link** the admin copies and delivers out of band — shown exactly once, never stored, never logged.

---

## 2. Create Student — Full Form Specification

**Route:** `/admin/people/students/new`
**Layout:** six collapsible sections in one scrollable page, with a sticky summary rail on the right showing what will happen on submit. Sections A and B are required; C through F are optional but collapsed-open by default because the sales conversation usually surfaces them.
**Submit:** "Create student and send invite" (primary) · "Create without sending invite" (secondary) · "Save as draft" (ghost)

### Section A — Account

| Field | Control | Required | Validation | DB target | Notes / help text |
|---|---|---|---|---|---|
| Full name | text | ✅ | 2–120 chars; letters, spaces, hyphens, apostrophes | `profiles.full_name` | "As it should appear on their certificate." Certificates snapshot this, so spelling matters. |
| Preferred name | text | — | ≤ 60 chars | `student_profiles.preferred_name` | "What we call them in the app. Defaults to first name." |
| Email | email | ✅ | RFC email; **unique across all users**; async check on blur | `auth.users.email`, `profiles.email` | "This is their login. It cannot be changed later without support." Inline error if taken, naming the existing account's role. |
| Phone | tel | — | E.164; country picker defaulting to +251 | `profiles.phone` | For session reminders by SMS in a later phase. |
| Avatar | file | — | JPEG/PNG/WebP ≤ 2 MB, square crop | `avatars` bucket | Optional. Falls back to initials on a `green-700` circle. |
| Account status | segmented: Active / Pending / Suspended | ✅ | — | `profiles.is_active` | Defaults to **Pending** until the invite is accepted, then flips to Active automatically. |
| Send invite email | switch | ✅ | — | — | Default **on**. Off means you must copy the one-time setup link from the confirmation screen. |
| Internal notes | textarea | — | ≤ 2000 chars | `student_internal_notes.body` | **Staff-only, admin-only.** Stored in its own table rather than as a column on `student_profiles`, because a student can read their own profile row — a column there would be readable by the person it is written about. |

### Section B — Learner Profile

Drives content personalization. Persona is the highest-value field in the entire form: it selects the "why this matters" variant in Part 1 of every unit.

| Field | Control | Required | Options / validation | DB target | Notes |
|---|---|---|---|---|---|
| Persona | radio cards with icons from `/personas/` | ✅ | Diplomat · NGO / Humanitarian · Tourist / Visitor · Missionary · Researcher / Academic · Diaspora · Other | `student_profiles.persona` | Help text: "Selects the cultural framing the student sees in every lesson." |
| Study intent | segmented | ✅ | Casual (1–2 h/wk) · Steady (3–5 h/wk) · Intensive (6+ h/wk) | `student_profiles.study_intent` | Default **Steady**. Drives pace copy and reminder cadence. |
| Learning goal | textarea | — | ≤ 500 chars | `student_profiles.learning_goal` | "In their words — e.g. 'Greet colleagues and handle taxis without English.'" Teachers see this in lesson prep. |
| Prior Amharic | select | ✅ | None · A few words · Can speak some, cannot read · Can read fidel · Conversational | `student_profiles.prior_experience` | Default **None**. Flags candidates for a later placement test. |
| Native language | combobox | — | ISO 639-1 list | `student_profiles.native_language` | Helps teachers anticipate pronunciation interference. |
| Other languages | multi-select tags | — | — | `student_profiles.other_languages` (text[]) | Used for teacher matching. |
| Starting level | select | ✅ | ሀ · ለ · ሐ · መ · ሠ · ረ | `student_profiles.starting_level_id` | Default **ሀ**. Warning callout if set above ሀ: "Only set this if you have assessed the student — Fidel has no placement test yet." |

### Section C — Organization & Sponsor

Skip for an individual learner; essential for an embassy or NGO cohort, because the payer is not the learner.

| Field | Control | Required | Options / validation | DB target |
|---|---|---|---|---|
| Organization name | text w/ autocomplete over existing orgs | — | ≤ 160 chars | `organizations.name` (upserted) |
| Organization type | select | — | Embassy / Diplomatic Mission · NGO / Humanitarian · Government Agency · University / Research · Private Company · Religious Organization · Individual · Other | `organizations.type` |
| Job title | text | — | ≤ 120 chars | `student_profiles.job_title` |
| Department | text | — | ≤ 120 chars | `student_profiles.department` |
| Cohort / group | select or create | — | — | `cohorts.id` |
| Billing contact name | text | — | — | `organizations.billing_contact_name` |
| Billing contact email | email | — | RFC email | `organizations.billing_contact_email` |
| Purchase order / reference | text | — | ≤ 80 chars | `payments.reference` |

Selecting an existing organization prefills billing contact and org type, and offers "Apply this organization's standard access package" — a one-click way to reproduce whatever the last student from that embassy received.

### Section D — Locale & Scheduling

| Field | Control | Required | Options / validation | DB target | Notes |
|---|---|---|---|---|---|
| Timezone | searchable select (IANA) | ✅ | — | `profiles.timezone` | Default `Africa/Addis_Ababa`. **Every session time the student sees is rendered in this zone**, so a wrong value here means missed lessons. |
| Country of residence | select | — | ISO 3166-1 | `student_profiles.country` | |
| Interface language | select | ✅ | English (only option) | `profiles.locale` | Disabled with the note "More languages coming soon." Wired for later, not selectable now. |
| Preferred session days | checkbox group Mon–Sun | — | — | `student_profiles.preferred_days` (int[]) | Advisory. Shown to teachers, not enforced by the booking engine. |
| Preferred time of day | checkbox group | — | Morning / Afternoon / Evening | `student_profiles.preferred_times` (text[]) | Advisory. |

### Section E — Access Grant *(this is the payment model)*

Grants what the student can actually open. **At least one grant is required** for the account to be usable, but the form allows zero so an admin can create the record before payment clears — in which case the summary rail warns "This student will have no content access."

| Field | Control | Required | Options / validation | DB target |
|---|---|---|---|---|
| Grant type | segmented | ✅ | **Full level** · **Specific units** | `entitlements.scope` |
| Levels | multi-select of level cards showing fidel char + CEFR + unit count | ✅ if scope = level | At least one | `entitlements.level_id` (one row per level) |
| Units | grouped checkbox tree, level → units, with "select all" per level | ✅ if scope = unit | At least one | `entitlements.unit_id` (one row per unit) |
| Access source | select | ✅ | Paid (recorded below) · Trial · Scholarship / Promo · Internal / Staff | `entitlements.source` |
| Starts on | date | — | ≥ today | `entitlements.granted_at` | Defaults today; future-dating supported for cohort start dates. |
| Expires on | date | — | > starts on | `entitlements.expires_at` | Blank = perpetual. **Trial defaults to +14 days** and shows a hint. |
| Live session credits | number stepper | — | 0–100 | `session_credit_entries.delta` | "How many live sessions this student has paid for. Each booking consumes one; a cancellation outside 12 hours refunds it." |
| Credits expire on | date | — | > today | `session_credit_entries.expires_at` | Blank = no expiry. |
| Grant note | text | ✅ | ≤ 300 chars | `entitlements.note` | Required for the audit trail: "Why does this student have this access?" e.g. "Embassy package A, PO 2026-0114." |

**Unit-level grants are how "paid parts" works.** A student can be sold Units 1–4 of ሀ rather than the whole level. `fidel.has_unit_access()` returns true if the student holds either a level grant covering the unit or a direct unit grant. Sequential unlocking still applies inside whatever they hold.

### Section F — Payment Record *(offline; shown only when Access source = Paid)*

No payment gateway is called. This is a bookkeeping record so admin reporting works before Phase 3.

| Field | Control | Required | Options / validation | DB target |
|---|---|---|---|---|
| Amount | number | ✅ | > 0, 2 decimals | `payments.amount_cents` |
| Currency | select | ✅ | ETB · USD · EUR · GBP | `payments.currency` |
| Method | select | ✅ | Bank transfer · Cash · Cheque · Invoice (unpaid) · Mobile money · Other | `payments.provider` |
| Payment date | date | ✅ | ≤ today | `payments.paid_at` |
| Reference / receipt no. | text | — | ≤ 80 chars | `payments.reference` |
| Invoice / receipt file | file | — | PDF/JPEG/PNG ≤ 10 MB | `receipts` bucket |
| Payment status | segmented | ✅ | Paid · Pending · Partially paid | `payments.status` |
| Payment note | textarea | — | ≤ 500 chars | `payments.note` |

Choosing **Invoice (unpaid)** or **Pending** still creates the entitlement but tags the student "Awaiting payment" in the admin list, and surfaces them on a "Payments outstanding" panel on `/admin`. Access is not withheld — that is a business decision the admin makes by setting an expiry, not something the form enforces.

### Confirmation screen

After submit, show exactly once:
1. ✅ Account created — email, role, status
2. ✅ Access granted — the levels/units, with expiry
3. ✅ Credits granted — count and expiry
4. ✅ Teacher assigned — name (from Section G below)
5. ✅ Payment recorded — amount, method, reference
6. **Invite:** "Invite email sent to …" **or**, if sending was off, the one-time setup link in a copy-to-clipboard field with the warning "This link is shown only once and expires in 7 days."
7. Actions: "Create another student" · "View student" · "Back to students"

### Section G — Teacher Assignment

| Field | Control | Required | DB target | Notes |
|---|---|---|---|---|
| Assign teacher(s) | multi-select of teacher cards (name, languages, current student count, accepting-students flag) | — | `student_teacher_assignments` | Teachers not accepting students are shown greyed with their load. |
| Primary teacher | radio among the selected | required if any selected | `student_teacher_assignments.is_primary` | The primary teacher owns the homework queue for this student. |

Assignment is required for the student to book live sessions, and it drives teacher RLS visibility. Leaving it blank creates a self-paced-only student, which is valid — the summary rail says so explicitly.

---

## 3. Zod Schema

```ts
// src/lib/validation/admin-student.ts
import { z } from 'zod'

export const createStudentSchema = z.object({
  // A — Account
  fullName:      z.string().min(2).max(120).regex(/^[\p{L}\s'-]+$/u),
  preferredName: z.string().max(60).optional(),
  email:         z.string().email().toLowerCase(),
  phone:         z.string().regex(/^\+[1-9]\d{7,14}$/).optional(),
  isActive:      z.enum(['active', 'pending', 'suspended']).default('pending'),
  sendInvite:    z.boolean().default(true),
  adminNotes:    z.string().max(2000).optional(),

  // B — Learner profile
  persona:         z.enum(['diplomat','ngo','tourist','missionary','researcher','diaspora','other']),
  studyIntent:     z.enum(['casual','steady','intensive']).default('steady'),
  learningGoal:    z.string().max(500).optional(),
  priorExperience: z.enum(['none','few_words','speaks_some','reads_fidel','conversational']).default('none'),
  nativeLanguage:  z.string().length(2).optional(),
  otherLanguages:  z.array(z.string()).max(10).default([]),
  startingLevelId: z.enum(['ha','le','hha','me','sse','re']).default('ha'),

  // C — Organization
  organization: z.object({
    id:                  z.string().uuid().optional(),
    name:                z.string().max(160),
    type:                z.enum(['embassy','ngo','government','university','company','religious','individual','other']),
    billingContactName:  z.string().max(120).optional(),
    billingContactEmail: z.string().email().optional(),
  }).optional(),
  jobTitle:   z.string().max(120).optional(),
  department: z.string().max(120).optional(),
  cohortId:   z.string().uuid().optional(),

  // D — Locale & scheduling
  timezone:       z.string().min(3).default('Africa/Addis_Ababa'),
  country:        z.string().length(2).optional(),
  locale:         z.literal('en').default('en'),
  preferredDays:  z.array(z.number().int().min(0).max(6)).default([]),
  preferredTimes: z.array(z.enum(['morning','afternoon','evening'])).default([]),

  // E — Access
  access: z.object({
    scope:          z.enum(['level','unit']),
    levelIds:       z.array(z.string()).default([]),
    unitIds:        z.array(z.string()).default([]),
    source:         z.enum(['purchase','trial','promo','admin_grant']),
    grantedAt:      z.coerce.date().optional(),
    expiresAt:      z.coerce.date().optional(),
    sessionCredits: z.number().int().min(0).max(100).default(0),
    creditsExpireAt: z.coerce.date().optional(),
    note:           z.string().min(1).max(300),
  }).refine(
    (a) => (a.scope === 'level' ? a.levelIds.length > 0 : a.unitIds.length > 0),
    { message: 'Select at least one level or unit', path: ['levelIds'] },
  ).refine(
    (a) => !a.expiresAt || !a.grantedAt || a.expiresAt > a.grantedAt,
    { message: 'Expiry must be after the start date', path: ['expiresAt'] },
  ).optional(),

  // F — Payment
  payment: z.object({
    amount:    z.number().positive(),
    currency:  z.enum(['ETB','USD','EUR','GBP']),
    provider:  z.enum(['manual_bank','manual_cash','manual_cheque','manual_invoice','mobile_money','other']),
    paidAt:    z.coerce.date().max(new Date()),
    reference: z.string().max(80).optional(),
    status:    z.enum(['paid','pending','partial']),
    note:      z.string().max(500).optional(),
  }).optional(),

  // G — Teacher
  teacherIds:       z.array(z.string().uuid()).default([]),
  primaryTeacherId: z.string().uuid().optional(),
})
.refine((v) => v.access?.source !== 'purchase' || !!v.payment, {
  message: 'A payment record is required when the access source is Paid',
  path: ['payment'],
})
.refine((v) => v.teacherIds.length === 0 || !!v.primaryTeacherId, {
  message: 'Choose which teacher is primary',
  path: ['primaryTeacherId'],
})
```

## 4. Server Action

`createStudent` runs as one transaction through an RPC so a partial student can never exist.

```
1. requireRole('admin')
2. Validate with createStudentSchema
3. Re-check email uniqueness against auth.users
4. adminClient.auth.admin.createUser  (or inviteUserByEmail when sendInvite)
     → email_confirm: false, no password set by admin
5. RPC provision_student(...) inside a single transaction:
     - update profiles (name, phone, timezone, locale, is_active)
     - upsert organization, insert student_profiles
     - insert entitlements rows (one per level or unit)
     - insert payments row + link entitlements.payment_id
     - insert session_credit_entries (delta = credits, reason 'grant')
     - insert student_teacher_assignments
     - insert audit_log entries: 'student.create', 'entitlement.grant', 'payment.record'
6. On step-5 failure → adminClient.auth.admin.deleteUser to roll back the auth user
7. Send the invite; return the one-time link when sendInvite is false
8. revalidatePath('/admin/people'), ('/admin/entitlements'), ('/admin')
```

Step 6 matters: without it, a failed provision leaves an orphaned auth user whose email can never be reused, and the admin gets "email already taken" for a student that does not exist.

---

## 5. Bulk Import

**Route:** `/admin/people/students/import` — for an embassy sending 30 staff at once.

Downloadable template `fidel-student-import-template.csv`:

```csv
full_name,email,phone,persona,study_intent,prior_experience,native_language,timezone,job_title,department,organization_name,organization_type,starting_level,grant_scope,grant_levels,grant_units,access_source,expires_on,session_credits,payment_amount,payment_currency,payment_method,payment_reference,primary_teacher_email,notes
Hana Tesfaye,hana@embassy.example,+251911234567,diplomat,steady,none,en,Africa/Addis_Ababa,Second Secretary,Political,Embassy of Example,embassy,ha,level,ha,,purchase,2027-07-26,8,12000,ETB,manual_bank,PO-2026-0114,tigist@fidel.app,
```

Four steps: **Upload** → **Map columns** (auto-matched, manually correctable) → **Validate** → **Confirm**.

Validation runs every row through `createStudentSchema` and shows a table of results: row number, name, email, status (✅ ready / ⚠️ warning / ❌ error), and the specific message. Errors block only their own row. A "Download error report" button returns the failed rows as CSV with an appended `error` column so the admin can fix and re-upload only those.

Import is chunked at 25 rows per batch with a live progress bar, and is idempotent on email — re-running a file skips existing accounts rather than failing or duplicating.

---

## 6. Create Teacher

**Route:** `/admin/people/teachers/new`

| Section | Fields |
|---|---|
| Account | Full name ✅ · Email ✅ · Phone · Avatar · Status ✅ · Send invite ✅ |
| Professional | Headline ✅ (e.g. "Native Amharic teacher, 8 years with diplomatic staff") · Bio ✅ (≤ 1500 chars, markdown, shown publicly) · Years experience ✅ · Languages spoken ✅ multi-select · Qualifications (repeater: title, institution, year) · Specializations multi-select (matches the persona list) |
| Availability | Timezone ✅ · Weekly availability grid (weekday + start + end, repeater) · Accepting new students switch ✅ · Max concurrent students · Session lengths offered ✅ (30/45/60) |
| Public profile | Show on the public teachers page (switch) · Display order · Pull-quote |
| Rate | Hourly rate + currency — **display and reporting only**; no billing is computed from it at MVP |
| Calendar | Read-only status: "Google Calendar not connected. The teacher connects it themselves from their settings." Admins cannot connect on a teacher's behalf. |

## 7. Create Admin

**Route:** `/admin/people/admins/new` — deliberately spare.

Full name ✅ · Email ✅ · Admin title ✅ (Super Admin · Content Manager · Program Coordinator · Support) · Send invite ✅ · Internal note.

**Admin title controls navigation permissions**, mapped in `src/lib/auth/admin-permissions.ts`:

| Title | Sections |
|---|---|
| Super Admin | Everything, including People and Audit |
| Content Manager | Content (levels, units, vocabulary, media), Blog |
| Program Coordinator | People, Entitlements, Sessions, Certificates, Cohorts |
| Support | Read-only everywhere, plus resend invite and reset password |

Creating a Super Admin requires typing the word `SUPERADMIN` to confirm, and always writes an `audit_log` entry. This is the one path to full data access, and it should feel like it.

---

## 8. Access Management (standalone)

**Route:** `/admin/entitlements` — for changing access after a student exists, which is the common case (a student finishes ሀ and the embassy buys ለ).

**Grant panel:** student (searchable) → scope → levels/units → source → dates → credits → note → optional payment record. Same validation as Section E/F.

**Table columns:** Student · Organization · Scope · Level / Units · Source · Status · Granted · Expires · Credits remaining · Payment · Actions.

**Row actions:** Extend expiry · Add credits · Revoke (requires a reason; sets `status='revoked'`, `revoked_at`, writes audit) · View payment · View student.

**Filters:** status (active / expiring in 30 days / expired / revoked) · source · level · organization · payment status.

**Bulk actions:** grant a level to a selected cohort; extend expiry for a cohort. Both write one audit entry per affected student, not one for the batch — otherwise the audit log lies about who was changed.

---

## 9. Student Lifecycle Actions

Available from `/admin/people/[id]`:

| Action | Effect | Audited | Confirmation |
|---|---|---|---|
| Resend invite | New one-time link | ✅ | — |
| Send password reset | Supabase recovery email | ✅ | — |
| Edit profile | Any Section A–D field except email | ✅ | — |
| Change email | Updates auth + profiles | ✅ | Type the new email twice; warns that it changes their login |
| Suspend | `is_active = false`; login blocked with a clear message; progress and data retained | ✅ | Reason required |
| Reactivate | `is_active = true` | ✅ | — |
| Grant / revoke access | Per §8 | ✅ | Reason required on revoke |
| Add session credits | Ledger entry | ✅ | Note required |
| Assign / unassign teacher | Updates assignments | ✅ | Warns if pending sessions exist |
| Unlock a unit early | `unit_unlocks` row | ✅ | Reason required |
| Reset unit progress | Deletes `part_progress` for that unit | ✅ | Type the unit name to confirm |
| Issue certificate manually | Certificate row + PDF | ✅ | Reason required |
| Delete account | Hard delete, cascades | ✅ | Type the student's full name; **blocked if certificates exist** — issued credentials must remain verifiable |

Every one of these writes `audit_log` with actor, action, entity, and reason. The reference project had no audit trail at all, which made "who gave this student access?" unanswerable.

---

## 10. Form UX Standards

Applies to every admin form in the product.

| Concern | Standard |
|---|---|
| Layout | Single column, `max-w-[720px]`. Two columns only for genuinely paired fields (start/end date). |
| Sections | `<Card>` per section with a title, one-line description, and a completion tick once valid. |
| Labels | Above the input, always. No placeholder-as-label — it disappears the moment the user types. |
| Required marker | Gold asterisk plus `aria-required`. |
| Help text | Below the input, `caption text-muted-foreground`. Present wherever a field's consequence is not obvious. |
| Validation timing | On blur for format; on submit for cross-field rules. Never validate while the user is still typing a field. |
| Error display | `danger-500` text below the field, `aria-describedby`-linked, field border `danger-500`. On submit failure, focus and scroll to the first error. |
| Async checks | Email uniqueness on blur with an inline spinner, then a tick or an error. |
| Unsaved changes | Warn before navigating away. |
| Autosave | Draft autosave every 20 s on long forms (student create, unit content). Show "Draft saved 14:32". |
| Submit button | Disabled while submitting; label swaps to a spinner at the same width; `aria-busy`. |
| Success | Full confirmation screen for creation flows; `sonner` toast for edits. |
| Destructive | `AlertDialog` with a typed confirmation for anything irreversible. |
| Keyboard | Tab order matches visual order; `Cmd/Ctrl+Enter` submits; `Esc` closes dialogs. |
| Copy | Every string from `messages/en.json` under the `admin.forms.*` namespace. |

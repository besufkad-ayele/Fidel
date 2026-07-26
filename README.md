<h1 align="center">ፊደል &nbsp;Fidel</h1>

<p align="center">
  Online Amharic learning platform — self-paced curriculum plus live 1:1 sessions with native Ethiopian teachers.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black" alt="Next.js 16.2" />
  <img src="https://img.shields.io/badge/React-19.2-149ECA" alt="React 19.2" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Supabase-Postgres%20%7C%20Auth%20%7C%20Storage-3ECF8E" alt="Supabase" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4" alt="Tailwind v4" />
</p>

---

## What this is

**Fidel** (ፊደል — "alphabet") teaches Amharic to diplomats, NGO workers, researchers, tourists, missionaries, and the Ethiopian diaspora. Six levels named after the traditional Ethiopian syllabary rather than CEFR codes, each level a set of units, each unit a fixed three-part shape: **Cultural Insight → Language Lesson → Practice**.

The product's central idea is that the curriculum is a single source of truth read by two delivery modes. A student studying alone and a teacher preparing a live call see the same material — and the teacher also sees exactly what the student completed beforehand, so no live minute is spent re-teaching drilled vocabulary.

| Level | Fidel | CEFR | Name |
|---|---|---|---|
| 1 | ሀ | A1 | Foundations |
| 2 | ለ | A2 | Elementary |
| 3 | ሐ | B1 | Intermediate |
| 4 | መ | B2 | Upper Intermediate |
| 5 | ሠ | C1 | Advanced |
| 6 | ረ | C2 | Mastery |

Level ሀ ships complete at MVP; ለ–ረ exist as records marked "coming soon".

---

## Documentation

Read in this order. These documents are the specification — when code and docs disagree, that is a bug in one of them.

| Document | Contents |
|---|---|
| [`Fidel_prd.md`](./Fidel_prd.md) | Product requirements v2.1 — vision, personas, content architecture, scope by phase, KPIs |
| [`docs/01-architecture.md`](./docs/01-architecture.md) | Stack, folder layout, the three-layer auth boundary, data-access patterns, i18n, quality gates |
| [`docs/02-data-model.md`](./docs/02-data-model.md) | Complete Postgres schema — tables, enums, constraints, indexes, RLS policies, storage buckets, provisioning RPC |
| [`docs/03-screens-and-routes.md`](./docs/03-screens-and-routes.md) | Every route, screen by screen, with data reads, actions, states, and acceptance criteria |
| [`docs/04-roadmap.md`](./docs/04-roadmap.md) | Phased epics and tickets with definitions of done, sequencing, and the risk register |
| [`docs/05-design-system.md`](./docs/05-design-system.md) | Colour ramps, type scales, `/public` asset inventory, component-by-component visual specs |
| [`docs/06-admin-forms.md`](./docs/06-admin-forms.md) | Admin provisioning forms field by field, access grants, offline payment records, lifecycle actions |

---

## Key architectural decisions

**No public signup.** Every account is provisioned by an administrator, who grants access, records the payment, assigns a teacher, and sends an invite. The student sets their own password from the invite link. Fidel is sold to embassies, NGOs, and universities that pay by invoice for named staff, so a registrar panel fits the business better than a card checkout. Email signups are disabled at the Supabase level, not just hidden in the UI.

**Access is an entitlement, not a paywall.** `entitlements` records what a student can open, with a `scope` of either a whole level or a single unit, and a `source` describing how it was acquired (`admin_grant`, `trial`, `promo`, `purchase`, `staff`). The learning product never asks where access came from. When Stripe arrives in Phase 3, its webhook inserts the same two rows the admin form inserts today.

**Payments are recorded, not processed, at MVP.** Amount, currency, method, date, reference, and receipt file are entered by an admin so revenue reporting works before any gateway exists. The `payments` table already carries gateway providers alongside the manual ones.

**Live sessions run on a credit ledger.** Balance is the sum of signed entries rather than a mutable counter, so history is never lost, refunds match their booking by `session_id`, and concurrent bookings cannot overdraw.

**Authorization has three independent layers.** `proxy.ts` refreshes the session cookie and does coarse routing; server-side guards in every protected layout are authoritative in the application; RLS on every table is authoritative in the database. Any one of them is sufficient to deny access. There is no client-side-only check anywhere, and no session state in `localStorage`.

**Next.js 16 uses `proxy.ts`, not `middleware.ts`.** The `middleware` file convention is deprecated in v16 and renamed to `proxy`, with the exported function renamed to match. It defaults to the Node runtime and the `runtime` option can no longer be set.

---

## Getting started

### Prerequisites

Node 20+, pnpm, and the Supabase CLI.

### Setup

```bash
pnpm install

cp .env.example .env.local        # fill in the values below

pnpm supabase link --project-ref <project-ref>
pnpm db:push                      # apply migrations
pnpm db:types                     # regenerate src/types/database.types.ts
pnpm db:seed                      # Level ሀ Unit 1 + demo users

pnpm dev
```

Open http://localhost:3000.

### Environment variables

See [`.env.example`](./.env.example). `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and **must never** carry a `NEXT_PUBLIC_` prefix; CI greps for that mistake.

### Required Supabase dashboard settings

Neither is expressible in a migration, and both are load-bearing:

1. **Authentication → Providers → Email →** turn *"Allow new users to sign up"* **off**. Without this, `POST /auth/v1/signup` remains open to the anon key regardless of what the UI offers.
2. **Authentication → Hooks → Custom Access Token →** enable `fidel.custom_access_token_hook`, which puts the user's role into the JWT so RLS reads a claim instead of a per-row subquery.
3. **Authentication → SMTP →** point at Resend. Supabase's built-in SMTP is rate-limited to a handful of messages per hour and cannot deliver a 30-person cohort import — and since invites are the only way in, that is a total blocker rather than a degradation.

### Scripts

| Script | Does |
|---|---|
| `pnpm dev` | Dev server with Turbopack |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm lint` / `pnpm typecheck` | ESLint / `tsc --noEmit` |
| `pnpm test` / `pnpm test:e2e` | Vitest / Playwright |
| `pnpm db:push` / `db:reset` / `db:seed` / `db:types` | Migration, seed, and type management |

---

## Project structure

```
Fidel/
├── docs/                  Specification documents
├── Fidel_prd.md
├── messages/en.json       All UI copy — adding a locale is a new file here
├── public/                Brand, card backgrounds, level and unit art, illustrations
├── supabase/
│   ├── migrations/        Schema source of truth, forward-only
│   └── seed.sql
└── src/
    ├── app/               Route groups: (marketing) (auth) (learn) (teach) (admin)
    ├── components/        ui/ · layout/ · shared/ · features/
    ├── lib/
    │   ├── supabase/      Four clients: server, client, proxy, admin
    │   ├── auth/          Guards and session helpers
    │   ├── data/          Typed reads, one module per domain
    │   ├── actions/       Server Actions, one module per domain
    │   ├── domain/        Pure business logic, no I/O, fully unit-tested
    │   └── validation/    Zod schemas
    ├── types/
    └── proxy.ts
```

---

## Contributing

Branch-first; never commit to `main`.

- **Branches:** `<type>/<kebab-description>` where type is `feature` · `bug` · `hotfix` · `chore` · `docs` · `refactor` · `test`
- **Commits:** Conventional Commits — `feat(admin): add unit-scoped entitlement grant`
- **PRs:** link an issue, describe what and why, include screenshots for UI, note migration and env impact
- **Merge:** squash, one approval, CI green, delete the branch

### Before opening a PR

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Plus the design QA checklist in `docs/05-design-system.md` §7 for any UI change.

### Hard rules

`strict: true` with **no** `ignoreBuildErrors`. RLS on every table, no exceptions. No hardcoded credentials. No `?tab=` dashboards — every view is a real route. No client-side database access. Schema changes only via migrations, with types generated from the database. Every Amharic glyph inside `<AmharicText>`. Every user-facing string in `messages/en.json`.

The full list of prohibited patterns, each observed in a prior codebase, is in `docs/01-architecture.md` §13.

---

## Status

Phase 1 — Foundation. Planning complete; Supabase project connected; scaffold pending.

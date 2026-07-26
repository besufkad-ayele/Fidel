# Fidel — Design System & Component Specification

The visual contract. Every component below has an exact anatomy, exact dimensions, exact Tailwind classes, and the exact `/public` asset path it expects. Build from this document, not from intuition.

**Rule:** if a component needs an image, its path is declared in §3. Drop the file at that path and the component works. Missing assets fall back to a solid brand gradient, never to a broken image.

---

## 1. Foundations

### 1.1 Colour

Brand anchors carry over from masterbuilder. Each is extended into a full ramp so components have somewhere to go for hover, borders, and disabled states.

**Deep green — `--green-*`** (primary: structure, headers, sidebar, buttons)

| Token | Hex | Use |
|---|---|---|
| `green-50` | `#F2F6F5` | Tinted surfaces, selected rows |
| `green-100` | `#DDE8E6` | Hover on tinted surfaces |
| `green-200` | `#BBD0CD` | Dividers on green surfaces |
| `green-300` | `#8FB0AC` | Disabled text on dark |
| `green-400` | `#5F8783` | Secondary text on dark |
| `green-500` | `#3D6360` | Muted icons on dark |
| `green-600` | `#2A4A48` | Button hover, sidebar hover |
| **`green-700`** | **`#1A3636`** | **Brand primary.** Sidebar, primary button, headings |
| `green-800` | `#142A2A` | Pressed state |
| `green-900` | `#0F2020` | Dark surface |
| `green-950` | `#0D1313` | Dark mode page background |

**Gold — `--gold-*`** (accent: fidel characters, progress, achievement, certificates)

| Token | Hex | Use |
|---|---|---|
| `gold-50` | `#FDF9F0` | Achievement banner background |
| `gold-100` | `#FAF0DA` | Badge background |
| `gold-200` | `#F3DFB2` | Progress track |
| `gold-300` | `#EACB86` | Border on gold surfaces |
| `gold-400` | `#E0BA6F` | Hover |
| **`gold-500`** | **`#D6AD60`** | **Brand accent.** Fidel chars, progress fill, focus ring |
| `gold-600` | `#BE9345` | Gold button hover |
| `gold-700` | `#9C7635` | Gold text on cream (AA compliant) |
| `gold-800` | `#74572A` | Pressed |
| `gold-900` | `#4E3B1E` | Gold text needing AAA |

**Cream — `--cream-*`** (surfaces)

| Token | Hex | Use |
|---|---|---|
| `cream-50` | `#FEFDFB` | Card surface |
| **`cream-100`** | **`#F9F7F2`** | **Page background** |
| `cream-200` | `#F1EDE3` | Subtle fill, table stripe |
| `cream-300` | `#E5DFD1` | Border default |
| `cream-400` | `#D3CBB8` | Border emphasis, placeholder |

**Semantic** — chosen to coexist with gold rather than compete with it.

| Token | Hex | Use |
|---|---|---|
| `success-500` | `#2F7D5D` | Completed, correct answer, valid certificate |
| `success-50` | `#EAF5EF` | Success surface |
| `warning-500` | `#C8871F` | Needs resubmission, low quiz score |
| `warning-50` | `#FDF4E5` | Warning surface |
| `danger-500` | `#B23A34` | Errors, wrong answer, revoked, destructive |
| `danger-50` | `#FBECEB` | Danger surface |
| `info-500` | `#2F6D8F` | Booked session, informational |
| `info-50` | `#EAF2F7` | Info surface |

**Status colour mapping** — the two progress flags must be visually distinguishable at a glance.

| State | Chip background | Text | Icon |
|---|---|---|---|
| `self_paced: not_started` | `cream-200` | `green-700/60` | `Circle` |
| `self_paced: in_progress` | `gold-100` | `gold-800` | `CircleDashed` |
| `self_paced: completed` | `success-50` | `success-500` | `CircleCheck` |
| `live: not_booked` | transparent, `border-cream-300` | `green-700/50` | `CalendarOff` |
| `live: booked` | `info-50` | `info-500` | `CalendarClock` |
| `live: completed` | `success-50` | `success-500` | `CalendarCheck` |
| `locked` | `cream-200` | `green-700/40` | `Lock` |

### 1.2 Typography

| Family | Variable | Applied to |
|---|---|---|
| **Inter** | `--font-sans` | All UI text, body copy, forms, tables |
| **DM Serif Display** | `--font-display` | H1/H2 on marketing and page headers, level titles, certificate |
| **Noto Sans Ethiopic** | `--font-ethiopic` | Every Amharic glyph, without exception |

**Latin scale**

| Name | Size / line-height | Weight | Class |
|---|---|---|---|
| `display-1` | 60 / 64 | 400 serif | `font-display text-[3.75rem] leading-[4rem]` |
| `display-2` | 44 / 52 | 400 serif | `font-display text-[2.75rem] leading-[3.25rem]` |
| `h1` | 32 / 40 | 600 | `text-[2rem] leading-10 font-semibold` |
| `h2` | 24 / 32 | 600 | `text-2xl font-semibold` |
| `h3` | 20 / 28 | 600 | `text-xl font-semibold` |
| `body-lg` | 18 / 30 | 400 | `text-lg leading-[1.65]` |
| `body` | 16 / 26 | 400 | `text-base leading-[1.625]` |
| `body-sm` | 14 / 22 | 400 | `text-sm` |
| `caption` | 12 / 18 | 500 | `text-xs font-medium` |
| `eyebrow` | 12 / 16 | 600, `tracking-[0.14em]`, uppercase | `text-xs font-semibold uppercase tracking-[0.14em]` |

**Amharic scale.** Ethiopic glyphs render optically smaller than Latin at the same `font-size`, so every Amharic size is set ~10% larger than its Latin sibling. `<AmharicText>` applies this automatically; never hand-set Amharic sizes.

| Name | Size / line-height | Use |
|---|---|---|
| `am-hero` | 80 / 96 | Flashcard front |
| `am-display` | 56 / 72 | Vocabulary detail drawer headline |
| `am-xl` | 40 / 56 | Vocabulary card primary |
| `am-lg` | 30 / 46 | Dialogue line |
| `am-md` | 24 / 38 | Inline in prose, exercise prompts |
| `am-sm` | 19 / 30 | Table cell, chip |

Amharic requires generous line-height — Ethiopic has tall ascenders and descenders and clips at Latin line-heights. Never go below 1.45.

### 1.3 Spacing, radius, elevation, motion

**Spacing:** 4px base. Use `1, 2, 3, 4, 6, 8, 12, 16, 20, 24` only. Section rhythm: `py-16` mobile, `py-24` desktop. Card padding: `p-6`. Compact card: `p-4`.

**Radius:** `--radius: 0.5rem`. `sm` 4px (chips, inputs) · `md` 6px (buttons) · `lg` 8px (cards) · `xl` 12px (image cards, modals) · `2xl` 16px (hero panels) · `full` (avatars, pills).

**Elevation** — restrained. Cream-on-cream needs borders more than shadows.

| Token | Value | Use |
|---|---|---|
| `shadow-card` | `0 1px 2px rgb(26 54 54 / 0.04), 0 1px 3px rgb(26 54 54 / 0.06)` | Resting card |
| `shadow-card-hover` | `0 4px 12px rgb(26 54 54 / 0.10)` | Hovered card |
| `shadow-overlay` | `0 12px 32px rgb(26 54 54 / 0.16)` | Dropdown, popover |
| `shadow-modal` | `0 24px 64px rgb(26 54 54 / 0.24)` | Dialog, sheet |
| `shadow-inset-gold` | `inset 0 0 0 1px #D6AD60` | Selected state |

**Motion**

| Token | Duration / easing | Use |
|---|---|---|
| `motion-fast` | 150ms `ease-out` | Hover, focus, chip |
| `motion-base` | 250ms `cubic-bezier(0.32,0.72,0,1)` | Card hover, accordion |
| `motion-slow` | 400ms `cubic-bezier(0.32,0.72,0,1)` | Image zoom, page transition |
| `motion-flip` | 500ms `cubic-bezier(0.4,0,0.2,1)` | Flashcard flip |

All motion respects `prefers-reduced-motion: reduce` — transforms drop to opacity-only, and the flashcard flip becomes an instant swap.

### 1.4 Layout

| Property | Value |
|---|---|
| Content max width | `1280px` (`max-w-7xl`) |
| Prose max width | `68ch` — lesson essays |
| Sidebar expanded | `264px` |
| Sidebar collapsed | `72px` (icons only) |
| Topbar height | `64px` |
| Mobile breakpoint for sidebar → sheet | `< 1024px` (`lg`) |
| Gutter | `px-4` mobile, `px-6` tablet, `px-8` desktop |

**Breakpoints:** `sm 640` · `md 768` · `lg 1024` · `xl 1280` · `2xl 1536`.

### 1.5 Iconography

`lucide-react` only. Sizes: 16 (inline/chip), 20 (buttons, nav), 24 (card headers), 32 (empty states). Stroke width 1.75 default, 2 for nav active. **Every icon that conveys meaning is paired with text** — learners with limited English are a core persona.

---

## 2. Tailwind v4 Theme Implementation

```css
/* src/app/globals.css */
@import "tailwindcss";
@import "tw-animate-css";
@plugin "@tailwindcss/typography";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* Fonts */
  --font-sans:     var(--font-inter), system-ui, sans-serif;
  --font-display:  var(--font-dm-serif), Georgia, serif;
  --font-ethiopic: var(--font-noto-ethiopic), "Nyala", sans-serif;

  /* Brand ramps */
  --color-green-50:  #F2F6F5;  --color-green-100: #DDE8E6;
  --color-green-200: #BBD0CD;  --color-green-300: #8FB0AC;
  --color-green-400: #5F8783;  --color-green-500: #3D6360;
  --color-green-600: #2A4A48;  --color-green-700: #1A3636;
  --color-green-800: #142A2A;  --color-green-900: #0F2020;
  --color-green-950: #0D1313;

  --color-gold-50:  #FDF9F0;   --color-gold-100: #FAF0DA;
  --color-gold-200: #F3DFB2;   --color-gold-300: #EACB86;
  --color-gold-400: #E0BA6F;   --color-gold-500: #D6AD60;
  --color-gold-600: #BE9345;   --color-gold-700: #9C7635;
  --color-gold-800: #74572A;   --color-gold-900: #4E3B1E;

  --color-cream-50:  #FEFDFB;  --color-cream-100: #F9F7F2;
  --color-cream-200: #F1EDE3;  --color-cream-300: #E5DFD1;
  --color-cream-400: #D3CBB8;

  --color-success-50: #EAF5EF; --color-success-500: #2F7D5D;
  --color-warning-50: #FDF4E5; --color-warning-500: #C8871F;
  --color-danger-50:  #FBECEB; --color-danger-500:  #B23A34;
  --color-info-50:    #EAF2F7; --color-info-500:    #2F6D8F;

  /* shadcn bridges */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-destructive: var(--destructive);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);

  --shadow-card:       0 1px 2px rgb(26 54 54 / 0.04), 0 1px 3px rgb(26 54 54 / 0.06);
  --shadow-card-hover: 0 4px 12px rgb(26 54 54 / 0.10);
  --shadow-overlay:    0 12px 32px rgb(26 54 54 / 0.16);
  --shadow-modal:      0 24px 64px rgb(26 54 54 / 0.24);

  --ease-brand: cubic-bezier(0.32, 0.72, 0, 1);
}

:root {
  --radius: 0.5rem;

  --background:            #F9F7F2;
  --foreground:            #1A3636;
  --card:                  #FEFDFB;
  --card-foreground:       #1A3636;
  --primary:               #1A3636;
  --primary-foreground:    #F9F7F2;
  --secondary:             #F1EDE3;
  --secondary-foreground:  #1A3636;
  --accent:                #D6AD60;
  --accent-foreground:     #1A3636;
  --muted:                 #F1EDE3;
  --muted-foreground:      #5F8783;
  --border:                #E5DFD1;
  --input:                 #E5DFD1;
  --ring:                  #D6AD60;
  --destructive:           #B23A34;

  --sidebar:               #1A3636;
  --sidebar-foreground:    #DDE8E6;
  --sidebar-accent:        #2A4A48;
  --sidebar-border:        #2A4A48;

  /* Ethiopic optical compensation */
  --ethiopic-scale: 1.1;
}

.dark {
  --background:           #0D1313;
  --foreground:           #F9F7F2;
  --card:                 #142A2A;
  --card-foreground:      #F9F7F2;
  --primary:              #D6AD60;
  --primary-foreground:   #0D1313;
  --secondary:            #1A3636;
  --secondary-foreground: #F9F7F2;
  --muted:                #1A3636;
  --muted-foreground:     #8FB0AC;
  --border:               #2A4A48;
  --input:                #2A4A48;
  --sidebar:              #0F2020;
  --sidebar-foreground:   #DDE8E6;
  --sidebar-accent:       #1A3636;
}

@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground font-sans antialiased; }
  :focus-visible { @apply outline-2 outline-offset-2 outline-gold-500; }
}

@layer utilities {
  /* Overlay for every image-background card. Reused everywhere; never inline it. */
  .img-card-overlay {
    background: linear-gradient(
      to top,
      rgb(26 54 54 / 0.94) 0%,
      rgb(26 54 54 / 0.72) 38%,
      rgb(26 54 54 / 0.42) 72%,
      rgb(26 54 54 / 0.28) 100%
    );
  }
  /* Centered variant — radial, so centered text stays legible over busy photos. */
  .img-card-overlay-center {
    background:
      radial-gradient(ellipse at center, rgb(26 54 54 / 0.82) 0%, rgb(26 54 54 / 0.62) 55%, rgb(26 54 54 / 0.78) 100%);
  }
  .hero-gradient {
    background: linear-gradient(135deg, #F9F7F2 0%, rgb(214 173 96 / 0.07) 26%,
                rgb(26 54 54 / 0.03) 54%, #F9F7F2 100%);
  }
  .dark .hero-gradient {
    background: linear-gradient(135deg, #0D1313 0%, rgb(214 173 96 / 0.06) 26%,
                rgb(26 54 54 / 0.22) 54%, #0D1313 100%);
  }
  .fidel-char { @apply font-ethiopic text-gold-500 leading-none; }
}
```

---

## 3. `/public` Asset Inventory

Every path below is referenced by a component. Drop the file in, and the component renders it. **All raster assets are `.webp`** (quality 82) with a `.jpg` fallback only for OG images. Every image has a declared intrinsic size so `next/image` never causes layout shift.

```
public/
├── brand/
│   ├── fidel-mark.svg               64×64    — ፊደል glyph mark, gold on transparent
│   ├── fidel-wordmark.svg          220×48    — "ፊደል Fidel" lockup, green
│   ├── fidel-wordmark-cream.svg    220×48    — same, cream (for green backgrounds)
│   ├── fidel-full.svg              320×88    — mark + wordmark + tagline
│   ├── favicon.ico                  48×48
│   ├── icon.svg                     any      — app icon
│   ├── apple-icon.png             180×180
│   └── icon-512.png               512×512    — PWA
│
├── backgrounds/                    ← CARD BACKGROUND IMAGES
│   ├── card-quiz.webp             1200×675   — quiz card. Dark, low-detail, centre-safe
│   ├── card-culture.webp          1200×675   — Part 1 card
│   ├── card-lesson.webp           1200×675   — Part 2 card
│   ├── card-practice.webp         1200×675   — Part 3 card
│   ├── card-exam.webp             1200×675   — level exam card
│   ├── card-vocabulary.webp       1200×675   — vocabulary bank card
│   ├── card-flashcards.webp       1200×675   — flashcard deck card
│   ├── card-session.webp          1200×675   — book-a-session card
│   ├── card-certificate.webp      1200×675   — certificate card
│   ├── card-homework.webp         1200×675   — homework card
│   ├── hero-landing.webp          2400×1350  — landing hero
│   ├── hero-auth.webp             1600×2000  — login split panel (portrait)
│   ├── pattern-fidel-grid.svg      tiling    — faint ፊደል glyph tile, 4% opacity
│   └── texture-parchment.webp      800×800    — tiling, certificate background
│
├── levels/                         ← ONE PER LEVEL, used on level cards
│   ├── level-ha.webp               800×600
│   ├── level-le.webp               800×600
│   ├── level-hha.webp              800×600
│   ├── level-me.webp               800×600
│   ├── level-sse.webp              800×600
│   └── level-re.webp               800×600
│
├── units/ha/                       ← ONE PER UNIT, used on unit cards
│   ├── unit-01-greetings.webp      800×600
│   ├── unit-02-self-introduction.webp
│   ├── unit-03-family.webp
│   ├── unit-04-numbers.webp
│   ├── unit-05-time.webp
│   ├── unit-06-shopping.webp
│   ├── unit-07-food-ordering.webp
│   ├── unit-08-transportation.webp
│   ├── unit-09-hotel.webp
│   └── unit-10-directions.webp
│
├── personas/                       ← onboarding + landing persona cards
│   ├── diplomat.svg                160×160
│   ├── ngo.svg                     160×160
│   ├── tourist.svg                 160×160
│   ├── missionary.svg              160×160
│   ├── researcher.svg              160×160
│   ├── diaspora.svg                160×160
│   └── other.svg                   160×160
│
├── illustrations/                  ← empty and error states, line art in green-400 + gold-500
│   ├── empty-sessions.svg          320×240
│   ├── empty-homework.svg          320×240
│   ├── empty-vocabulary.svg        320×240
│   ├── empty-certificates.svg      320×240
│   ├── empty-progress.svg          320×240
│   ├── empty-students.svg          320×240
│   ├── empty-search.svg            320×240
│   ├── locked-level.svg            320×240
│   ├── error-500.svg               360×280
│   └── error-404.svg               360×280
│
├── certificate/                    ← certificate PDF composition
│   ├── border-ornament.svg        1684×1190  — A4 landscape frame, gold
│   ├── seal-fidel.svg              200×200   — embossed seal with ፊደል
│   ├── watermark-fidel.svg         600×600   — 5% opacity centre watermark
│   └── signature-line.svg          300×60
│
├── placeholders/
│   ├── avatar-default.webp         200×200
│   ├── teacher-default.webp        400×500
│   └── unit-default.webp           800×600   — fallback for missing unit art
│
├── audio/samples/                  ← landing-page sample lesson only; real lesson audio lives in Supabase Storage
│   ├── selam-normal.mp3
│   └── endet-neh-normal.mp3
│
└── og/
    ├── og-default.png             1200×630
    └── og-certificate.png         1200×630
```

**Art direction for card backgrounds.** These sit under centered cream text, so they must be dark, low-contrast, and quiet in the middle third. Photographs of Ethiopian scenes (coffee ceremony, Merkato, highland landscape, Lalibela stonework, injera and mesob, Addis street life) shot or graded dark, then further darkened by `.img-card-overlay-center`. Anything busy or bright in the centre will make the title unreadable — crop so the visual interest sits in the outer thirds.

---

## 4. Component Specifications

### 4.1 `<ImageCard>` — the base pattern

Every image-background card in the product is this component with different props. Build it once.

```tsx
type ImageCardProps = {
  image: string                       // /backgrounds/card-quiz.webp
  imageAlt?: string                   // "" when decorative
  align?: 'center' | 'bottom'         // default 'center'
  aspect?: '16/9' | '4/3' | '3/2'     // default '16/9'
  eyebrow?: string                    // gold uppercase label
  title: string
  subtitle?: string
  meta?: React.ReactNode              // chips row
  action?: React.ReactNode            // button
  badge?: React.ReactNode             // absolute top-right (e.g. score ring)
  state?: 'default' | 'locked' | 'completed'
  href?: string
  priority?: boolean
}
```

**Anatomy**

```
┌─────────────────────────────────────────┐
│ [next/image fill object-cover]          │  layer 0 — image
│ [.img-card-overlay-center]              │  layer 1 — overlay
│                              ╭────────╮ │  layer 2 — badge (top-right)
│                              │  92%   │ │
│                              ╰────────╯ │
│              PART 3                     │  eyebrow, gold-400
│           Unit Quiz                     │  title, display-2, cream-50
│      5 questions · about 5 min          │  subtitle, body-sm, cream-100/80
│         ┌──────────────┐                │  action
│         │  Start quiz  │                │
│         └──────────────┘                │
└─────────────────────────────────────────┘
```

**Implementation**

```tsx
<Link
  href={href}
  className="group relative block overflow-hidden rounded-xl shadow-card
             transition-shadow duration-250 ease-brand hover:shadow-card-hover
             focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500
             aspect-[16/9] min-h-[220px]"
>
  <Image
    src={image}
    alt={imageAlt ?? ''}
    fill
    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px"
    className="object-cover transition-transform duration-400 ease-brand
               group-hover:scale-[1.04] data-[state=locked]:grayscale
               data-[state=locked]:opacity-60"
    priority={priority}
  />

  <div className="absolute inset-0 img-card-overlay-center" />

  {badge && <div className="absolute right-4 top-4 z-20">{badge}</div>}

  <div className="relative z-10 flex h-full flex-col items-center justify-center
                  gap-2 px-6 py-8 text-center">
    {eyebrow && (
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-400">
        {eyebrow}
      </span>
    )}
    <h3 className="font-display text-[2rem] leading-tight text-cream-50
                   sm:text-[2.75rem] sm:leading-[3.25rem]">
      {title}
    </h3>
    {subtitle && (
      <p className="max-w-[42ch] text-sm text-cream-100/85">{subtitle}</p>
    )}
    {meta && <div className="mt-1 flex flex-wrap justify-center gap-2">{meta}</div>}
    {action && <div className="mt-4">{action}</div>}
  </div>
</Link>
```

**States**

| State | Treatment |
|---|---|
| `default` | As above |
| `locked` | Image `grayscale opacity-60`; a `Lock` icon replaces the action; title `text-cream-100/70`; card not a link — renders a `<button>` that opens an explanatory popover ("Complete Unit 3 to unlock") |
| `completed` | Gold hairline border `ring-1 ring-inset ring-gold-500`; a `CircleCheck` badge in `success-500` top-left; action label becomes "Review" |
| Missing image | `fallback` prop renders `bg-gradient-to-br from-green-700 via-green-800 to-green-950` plus `pattern-fidel-grid.svg` at 6% opacity. Never a broken image. |

**Accessibility:** the whole card is one link with one accessible name; nested interactive elements are forbidden. Decorative images use `alt=""`. Contrast of `cream-50` on the overlay measures ≥ 7:1 at the centre.

---

### 4.2 `<QuizCard>` — the specific case

This is `<ImageCard>` with fixed props plus attempt state. It appears on the unit Practice page and on the level overview rail.

| Property | Value |
|---|---|
| Image | `/backgrounds/card-quiz.webp` |
| Alt | `""` (decorative) |
| Aspect | `16/9` desktop, `4/3` below `sm`; `min-h-[240px]` |
| Align | `center` |
| Eyebrow | `PART 3 · QUIZ` |
| Title | Unit quiz title, e.g. "Greetings Quiz" |
| Subtitle | `{n} questions · about {m} min · pass at {p}%` |
| Action | Primary gold button — "Start quiz" / "Retake" / "Review answers" |
| Badge | Score ring when at least one attempt exists |

**Attempt states**

| Condition | Eyebrow | Action | Badge |
|---|---|---|---|
| No attempt | `PART 3 · QUIZ` | "Start quiz" (gold) | none |
| Attempted, passed | `PART 3 · PASSED` | "Review answers" (ghost cream) | `<ScoreRing value={92} tone="success" />` |
| Attempted, failed | `PART 3 · TRY AGAIN` | "Retake quiz" (gold) | `<ScoreRing value={48} tone="warning" />` |
| Max attempts reached | `PART 3 · COMPLETE` | "Review answers" | `<ScoreRing value={64} tone="neutral" />` |
| Unit locked | `PART 3 · LOCKED` | Lock icon + reason | none |

**`<ScoreRing>`** — 56×56 SVG. Track `gold-200` at 4px; fill `success-500` / `warning-500` / `cream-300` by tone; centre shows the integer percent in `caption` weight 600, cream on dark cards. Animates from 0 to value over `motion-slow` on mount, and skips the animation under `prefers-reduced-motion`.

---

### 4.3 `<PartCard>` — Parts 1–3 navigation

Three cards side by side on the unit overview, `grid gap-4 md:grid-cols-3`.

| Part | Image | Eyebrow | Title |
|---|---|---|---|
| 1 | `/backgrounds/card-culture.webp` | `PART 1` | Cultural Insight |
| 2 | `/backgrounds/card-lesson.webp` | `PART 2` | Language Lesson |
| 3 | `/backgrounds/card-practice.webp` | `PART 3` | Practice |

Aspect `3/2`, `min-h-[200px]`, align `center`. Subtitle is a one-line description of the part. Meta row shows a completion chip. A completed part gets the gold hairline and a `CircleCheck`. **No part is ever locked** — part order is suggested, not enforced (PRD §3.1).

### 4.4 `<LevelCard>`

Image `/levels/level-{slug}.webp`, aspect `4/3`, align `bottom` (the fidel character needs room at the top).

```
┌──────────────────────────────────┐
│         ሀ                        │  fidel char, 88px gold, centred top, mt-8
│         A1                       │  CEFR badge under it
│                                  │
│  ─────────────────────────       │
│  ሀ — Foundations                 │  title, h2, cream-50
│  Greet, introduce yourself…      │  can-do, body-sm cream-100/80
│  ▓▓▓▓▓▓▓░░░░░░  4 of 10 units    │  progress bar, gold-500 on cream/20
│  [ Continue ]                    │
└──────────────────────────────────┘
```

| State | Treatment |
|---|---|
| Entitled, in progress | As above; action "Continue" |
| Entitled, not started | No progress bar; action "Start level ሀ" |
| Entitled, complete | Gold ring; `Award` badge; action "Review" / "Get certificate" |
| Not entitled | Grayscale 60%; `Lock` over the fidel char; caption "Ask your administrator for access"; clicking opens the access-request dialog |
| Coming soon | Grayscale 40%; gold pill "Coming soon" top-right; no action; `cursor-default` |

### 4.5 `<UnitRow>` — level overview list

Not an image card. A dense, scannable row, because ten of them stack.

```
┌────────────────────────────────────────────────────────────────────────┐
│ ┌────┐  01  Greetings                            [✓ Completed] [📅 Done]│
│ │img │      Say hello, ask how someone is · 45 min                      │
│ └────┘                                                              →   │
└────────────────────────────────────────────────────────────────────────┘
```

- Container: `flex items-center gap-4 rounded-lg border border-cream-300 bg-cream-50 p-4 transition-colors hover:border-gold-300 hover:bg-cream-100`
- Thumbnail: 64×64, `rounded-md object-cover`, from `/units/{level}/unit-{nn}-{slug}.webp`
- Index: `caption text-muted-foreground tabular-nums`
- Title: `h3`; description `body-sm text-muted-foreground`
- Two chips at the right: self-paced status and live status, per §1.1
- **Next recommended unit:** `border-gold-500 bg-gold-50 ring-1 ring-gold-300`, plus a gold `eyebrow` reading `NEXT UP`
- **Locked:** thumbnail grayscale, `Lock` icon replacing the chevron, whole row still clickable and opening a popover with the reason. Never inert.

### 4.6 `<VocabularyCard>`

The single most-viewed component in the product. Amharic is the hero.

```
┌────────────────────────────────────┐
│  ሰላም                        🔊    │  am-xl gold-700, audio button right
│  selam                             │  body-sm, italic, muted
│  ──────────────────────────────    │
│  hello / peace                     │  body, foreground
│  interjection · neutral            │  caption chips
│  ──────────────────────────────    │
│  ሰላም! እንዴት ነህ?                    │  am-sm, example
│  Hello! How are you?               │  caption muted
└────────────────────────────────────┘
```

- `rounded-lg border border-cream-300 bg-cream-50 p-5 shadow-card hover:shadow-card-hover`
- Amharic uses `<AmharicText size="xl" className="text-gold-700">` — gold-700, not gold-500, because gold-500 fails contrast on cream
- Audio button: 36×36 `rounded-full bg-gold-100 text-gold-800 hover:bg-gold-200`; shows a spinner while loading and a small waveform pulse while playing
- Gender variants render as two inline chips: `ነህ (to a man)` / `ነሽ (to a woman)`
- Formality chip colours: formal `info-50/info-500`, neutral `cream-200/green-700`, informal `gold-100/gold-800`

### 4.7 `<Flashcard>`

Full-screen deck. Front is intentionally almost empty — recall requires no crutches.

| Face | Content |
|---|---|
| Front | Amharic only, `am-hero` (80px) centred, `text-gold-700` on `cream-50`. Hint text at the bottom: "Tap or press space to reveal" |
| Back | Transliteration `body-lg italic`; English `h2`; example sentence pair; audio button; three rating buttons |

- Card: `aspect-[3/4] max-w-[420px] rounded-2xl border border-cream-300 bg-cream-50 shadow-modal`
- Flip: 3D Y-rotation, `motion-flip`, `transform-style: preserve-3d`, `backface-visibility: hidden`. Under reduced motion, cross-fade instead.
- Rating buttons: `Again` (`danger-50`/`danger-500`), `Good` (`cream-200`/`green-700`), `Easy` (`success-50`/`success-500`)
- Keyboard: `Space` flip · `1/2/3` rate · `←` previous · `Esc` exit. The legend is always visible on desktop.
- Progress: thin `gold-500` bar at the top, plus "7 / 18" in `caption tabular-nums`

### 4.8 `<DialoguePlayer>`

The highest-risk component. Build it first, in isolation, with fixture data.

```
┌──────────────────────────────────────────────────────────────┐
│  Dialogue: Hana meets Abel                                   │
│  Speed  [ Slow ][ Normal ][ Natural ]     ▶ Play all         │  segmented + play
│  ☑ Transliteration   ☑ English                               │  toggles
│  ────────────────────────────────────────────────────────────│
│  ╭─╮  ሰላም አቤል!                                        🔊   │  line, am-lg
│  │H│  selam Abel!                                            │
│  ╰─╯  Hello Abel!                                            │
│  ────────────────────────────────────────────────────────────│
│  ╭─╮  ሰላም ሃና! እንዴት ነሽ?                                🔊   │  active line
│  │A│  selam Hana! endet nesh?                                │  gold-50 bg
│  ╰─╯  Hello Hana! How are you?                               │
└──────────────────────────────────────────────────────────────┘
```

- Speaker avatars: 32×32 `rounded-full`, initial letter, alternating `green-700`/`gold-600` backgrounds
- Line container: `rounded-lg p-4`; **active line** gets `bg-gold-50 ring-1 ring-gold-300` and auto-scrolls into view with `block: 'center'`
- Amharic `am-lg`, `text-foreground`; transliteration `body-sm italic text-muted-foreground`; English `body-sm text-muted-foreground`
- Speed selector is a segmented control; changing speed mid-playback restarts the current line at the new speed rather than jumping to a different timestamp
- Toggles persist to `localStorage` under `fidel.dialogue.prefs` so a student's preference survives across units
- Each of the three speeds is a **separate audio asset**, not `playbackRate` — real slow speech has different prosody, and `playbackRate` produces a robotic artefact that teaches wrong pronunciation
- Keyboard: `Space` play/pause · `↑/↓` move between lines · `Enter` play the focused line

### 4.9 `<AudioPlayer>` — shared primitive

Three variants, one implementation.

| Variant | Appearance |
|---|---|
| `icon` | 36×36 circle. Vocabulary cards, dialogue lines, flashcards. |
| `inline` | 40px-tall pill: play button + waveform + duration. Speaking playback. |
| `full` | Play, scrub bar, elapsed/total, speed selector. Cultural-insight audio. |

States: idle · loading (spinner) · playing (`Pause` icon + pulse) · error (`AlertCircle` in `danger-500` with a retry tooltip). Only one player anywhere on the page can play at a time — a shared context pauses the others. All variants are keyboard-operable and announce state via `aria-live="polite"`.

### 4.10 Exercise components

All exercises share `<ExerciseShell>`: `rounded-lg border border-cream-300 bg-cream-50 p-6`, an index eyebrow (`QUESTION 3 OF 8`), a prompt, the interaction, and a feedback region.

| Type | Interaction |
|---|---|
| `fill_blank` | Inline `<input>` inside the sentence, `border-b-2 border-gold-400 bg-transparent`, width scaled to expected answer length. Amharic input shows a keyboard-helper button. |
| `translate_*` | `<textarea>` 3 rows; direction label chip ("English → Amharic"); an Amharic keyboard helper for AM targets. |
| `matching` | Two columns. Desktop: click-to-pair with a drawn connector line in `gold-500`. Mobile: tap source then target. Matched pairs go `success-50` and lock. |
| `multiple_choice` | Radio cards, `rounded-md border p-4`; selected `border-gold-500 bg-gold-50`; correct after submit `border-success-500 bg-success-50`; wrong `border-danger-500 bg-danger-50`. |
| `word_order` | Draggable tokens; `dnd-kit`; tokens `rounded-md bg-cream-200 px-3 py-2`; drop zone dashed `border-cream-400`. Tap-to-append fallback for touch. |
| `speaking` | See `<SpeakingRecorder>` below. |
| `roleplay` | Branching choice cards; the chosen path stays visible with its consequence, building a transcript. |

**Feedback region** (after submit): correct → `success-50` panel, `CircleCheck`, "Correct". Wrong → `danger-50` panel, `XCircle`, the correct answer, and the explanation. Both use `motion-base` slide-down. Never a bare colour change with no words.

### 4.11 `<SpeakingRecorder>`

States: `idle` → `recording` → `recorded` → `uploading` → `submitted`.

- Record button 64×64 `rounded-full bg-danger-500 text-white`; while recording it pulses and becomes a stop square
- Live waveform from the `AnalyserNode`, 40px tall, bars in `gold-500`
- Elapsed timer `tabular-nums`; a 120-second cap with a warning at 100
- `recorded`: inline player, "Re-record" (ghost) and "Submit for review" (primary)
- Copy states plainly: **"Your teacher will listen and give feedback."** No implication of automatic scoring — there is none at MVP.
- Permission denied: `warning-50` panel explaining how to enable the microphone per browser, with a link
- Unsupported browser: falls back to a file upload input

### 4.12 `<FidelBadge>`

The brand's smallest recurring unit.

| Size | Fidel char | CEFR label | Use |
|---|---|---|---|
| `sm` | 20px | hidden | Sidebar nav, chips |
| `md` | 32px | 10px below | Unit breadcrumb, tables |
| `lg` | 56px | 12px below | Level overview header |
| `xl` | 88px | 14px below | Level card, certificate |

`font-ethiopic text-gold-500 leading-none`, CEFR in `caption uppercase tracking-wider text-muted-foreground`. On dark backgrounds the char stays `gold-500` and the label becomes `cream-100/70`.

### 4.13 `<AmharicText>`

```tsx
<AmharicText size="lg" as="span">ሰላም</AmharicText>
```

Applies `font-ethiopic`, `lang="am"`, the size from §1.2's Amharic scale, and the correct line-height. **Every Amharic glyph in the product goes through this component** — a lint rule flags Ethiopic Unicode ranges (U+1200–U+137F) appearing in JSX outside it.

### 4.14 Buttons

| Variant | Resting | Hover | Use |
|---|---|---|---|
| `primary` | `bg-green-700 text-cream-100` | `bg-green-600` | Main action per screen |
| `gold` | `bg-gold-500 text-green-900` | `bg-gold-600` | Achievement actions: start quiz, get certificate, book session |
| `secondary` | `bg-cream-200 text-green-700` | `bg-cream-300` | Secondary |
| `outline` | `border-cream-400 bg-transparent` | `bg-cream-100` | Tertiary |
| `ghost` | transparent | `bg-cream-200` | Toolbars, icon buttons |
| `ghost-cream` | transparent, `text-cream-50 border-cream-50/40` | `bg-cream-50/15` | On image cards |
| `destructive` | `bg-danger-500 text-white` | `bg-danger-500/90` | Delete, revoke, cancel |

Sizes: `sm` h-9 px-3 · `default` h-10 px-4 · `lg` h-12 px-6 · `icon` 40×40. All get `rounded-md font-medium transition-colors duration-150`. Loading state swaps the label for a spinner while preserving width, and sets `aria-busy`.

### 4.15 Sidebar

- Expanded 264px, collapsed 72px, `bg-sidebar` (`green-700`), `text-sidebar-foreground` (`green-100`)
- Header: `fidel-wordmark-cream.svg` at 160×36, `px-4 py-5`
- Item: `h-10 rounded-md px-3 gap-3 text-sm`; hover `bg-sidebar-accent`; **active** `bg-gold-500/15 text-gold-300` with a 3px `gold-500` left bar
- "My Levels" is a collapsible group listing six `<FidelBadge size="sm">` rows; locked levels show a 14px `Lock` at the right
- Badge counts (homework, notifications): `rounded-full bg-gold-500 text-green-900 text-[11px] px-1.5 min-w-5 tabular-nums`
- Footer: avatar + name + role chip, opening the user menu upward
- Below `lg`: becomes a `Sheet` from the left, triggered by a hamburger in a 64px topbar

### 4.16 `<EmptyState>`

```
        [illustration 320×240]
        No sessions booked yet
   Book a live lesson and practise
   what you have studied with a teacher.
        [ Book a session ]
```

`flex flex-col items-center gap-4 py-16 text-center`; illustration from `/illustrations/`; title `h3`; description `body-sm text-muted-foreground max-w-[42ch]`; one primary action. **Every list in the product has one of these with a real action.** "No data" is not an acceptable empty state.

### 4.17 `<StatusChip>`

`inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium`, 14px icon, colours per §1.1. Always includes text — never icon-only, because colour alone fails accessibility and fails a learner scanning quickly.

### 4.18 `<ProgressBar>` and `<ProgressRing>`

**Bar:** 8px tall, `rounded-full bg-cream-300`, fill `bg-gold-500`, width transitions over `motion-slow`. Optional label right-aligned in `caption tabular-nums`. On dark surfaces the track is `cream-50/20`.

**Ring:** 40/56/80px. Track `cream-300` (or `gold-200` on dark), fill `gold-500`, 4px stroke, `linecap: round`, starting at 12 o'clock. Centre shows percent or a fraction. Both expose `role="progressbar"` with `aria-valuenow`.

### 4.19 `<SessionCard>`

```
┌────────────────────────────────────────────────────────┐
│ ╭──╮  Wed 29 Jul · 14:00 EAT              [🔵 Booked]  │
│ │TA│  Tigist Alemu · Unit 1: Greetings                 │
│ ╰──╯  in 2 days · 60 min                               │
│       [ Join Meet ]  [ Reschedule ]  [ Cancel ]        │
└────────────────────────────────────────────────────────┘
```

- `rounded-lg border border-cream-300 bg-cream-50 p-5`
- **Time always carries an explicit timezone label.** A diplomat in Addis and a diaspora student in Toronto must never have to guess.
- Countdown in `caption text-muted-foreground`; inside 1 hour it turns `gold-700 font-semibold`
- "Join Meet" is disabled until T−10min, with a tooltip stating when it opens
- Cancel shows the 12-hour rule **before** the click, not as a rejection after it
- Imminent session (< 15 min): `border-gold-500 ring-1 ring-gold-300` and a soft pulse on the join button

### 4.20 `<NudgeBanner>`

Shown on the Practice tab when Parts 1–2 have no progress (PRD §3.1).

`rounded-lg border border-gold-300 bg-gold-50 p-4 flex items-start gap-3`; `Lightbulb` icon in `gold-700`; text "You haven't reviewed the vocabulary for this unit yet — want to check it first?"; a link "Go to Part 2" and a dismiss `X`. Dismissal persists to `part_progress.nudge_dismissed`, so it never appears twice for that unit. It is a suggestion, styled as one — no red, no warning iconography, no blocking.

### 4.21 Certificate (PDF composition)

A4 landscape, 1684×1190 at 144dpi.

| Layer | Asset / spec |
|---|---|
| Background | `#FEFDFB` + `/backgrounds/texture-parchment.webp` at 8% |
| Frame | `/certificate/border-ornament.svg`, 48px inset |
| Watermark | `/certificate/watermark-fidel.svg`, centred, 5% |
| Wordmark | `/brand/fidel-full.svg`, 240px wide, top centre |
| Heading | "Certificate of Completion", `display-2` green-700, letterspaced |
| Fidel char | The level character, 180px, `gold-500`, centred |
| Student name | `display-1` green-700, centred, on a `gold-400` hairline rule |
| Body | "has completed **ሀ — Foundations**, equivalent to **CEFR A1**" |
| Score | "Final assessment: 92%" if present |
| Date | Long form, e.g. "26 July 2026" |
| Seal | `/certificate/seal-fidel.svg`, 140px, bottom right |
| Signature | `/certificate/signature-line.svg` + printed name, bottom left |
| Verification | Bottom centre: `Verify at fidel.app/verify/FDL-7K3M-QX92` in `caption`, plus a QR code to the same URL |

The verification code and QR are what make the document useful to an embassy. Do not omit them.

---

## 5. Page Composition

### 5.1 Landing hero

Full-bleed `hero-landing.webp` with `.img-card-overlay` and `.hero-gradient` beneath. `min-h-[560px] lg:min-h-[680px]`. Centred stack: `fidel-mark.svg` at 72px, `display-1` headline in `cream-50`, `body-lg` subhead in `cream-100/85` capped at `56ch`, then a gold primary and a cream-ghost secondary button. A scroll-cue chevron sits at the bottom.

### 5.2 Login split

Two columns at `lg`. Left 42%: `hero-auth.webp` with `.img-card-overlay`, the cream wordmark top-left, and a pull-quote from a student bottom-left. Right 58%: centred form, `max-w-[400px]`. Below `lg` the image is dropped entirely — not stacked — because a 2000px-tall portrait above a login form is hostile on a phone.

### 5.3 Unit page

Sticky sub-header (top 64px, `bg-cream-100/90 backdrop-blur border-b border-cream-300`) holding the breadcrumb, part tabs, and a thin progress bar. Body: `max-w-[68ch]` for prose parts; full `max-w-5xl` for Practice, where exercises need width. A right rail appears at `xl` with the vocabulary shortcut and the quiz card.

### 5.4 Dashboard grid

`grid gap-6 lg:grid-cols-3`. The **Continue** card spans `lg:col-span-2` and is visually dominant — it is the only thing most returning students need. **Upcoming session** takes the remaining column. **Next up** and **Needs attention** sit on the second row.

---

## 6. Dark Mode

Not a Phase 2 requirement, but every token has a dark value so it is never a rewrite. Rules when it ships: image-card overlays get 6% more opacity; gold shifts from `gold-500` to `gold-400` for contrast on `green-950`; card surfaces become `green-800`; borders become `green-600`. Amharic text on dark uses `gold-300`, never `gold-700`.

---

## 7. Design QA Checklist

Run this before any UI PR merges.

- [ ] Every Amharic glyph is inside `<AmharicText>`
- [ ] No hardcoded hex values — tokens only
- [ ] No hardcoded strings — everything from `messages/en.json`
- [ ] Every image has explicit dimensions or `fill` with `sizes`
- [ ] Every image-background card uses `.img-card-overlay*`, not an inline gradient
- [ ] Every icon conveying meaning is paired with text
- [ ] Focus-visible ring present on all interactive elements
- [ ] Text contrast ≥ 4.5:1 (≥ 3:1 for text above 24px)
- [ ] Keyboard-only pass completes the flow
- [ ] `prefers-reduced-motion` honoured
- [ ] Empty state exists, with an action
- [ ] Loading skeleton matches the real layout
- [ ] Renders at 375px without horizontal scroll
- [ ] Every displayed time shows its timezone
- [ ] Missing images fall back to the brand gradient, not a broken icon

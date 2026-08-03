import type { PublishedUnit } from '@/lib/data/curriculum'
import type { StudentUnitProgressView } from '@/lib/data/progress'

const ETHIOPIC_NUMERALS = ['፩', '፪', '፫', '፬', '፭', '፮', '፯', '፰', '፱', '፲'] as const

export function ethiopicUnitNumber(index: number): string {
  return ETHIOPIC_NUMERALS[index] ?? String(index + 1)
}

export function isUnitUnlocked(unit: Pick<PublishedUnit, 'status'>): boolean {
  return unit.status === 'published'
}

/** Prefer an in-progress (opened) unit; otherwise the first unlocked incomplete; else first unlocked. */
export function pickActiveUnit(
  units: PublishedUnit[],
  progressByUnitId: Map<string, StudentUnitProgressView>,
): PublishedUnit | null {
  const unlocked = units.filter(isUnitUnlocked)
  if (unlocked.length === 0) return null

  const opened = unlocked
    .filter((u) => {
      const p = progressByUnitId.get(u.id)
      return p != null && p.selfPacedStatus !== 'not_started' && !p.grade.isComplete
    })
    .sort((a, b) => {
      const aAt = progressByUnitId.get(a.id)?.updatedAt ?? ''
      const bAt = progressByUnitId.get(b.id)?.updatedAt ?? ''
      return bAt.localeCompare(aAt)
    })

  if (opened[0]) return opened[0]

  const next = unlocked.find((u) => {
    const p = progressByUnitId.get(u.id)
    return !p || p.selfPacedStatus === 'not_started' || !p.grade.isComplete
  })

  return next ?? unlocked[0] ?? null
}

export function unitHref(levelId: string, unitSlug: string, part: 'culture' | 'lesson' | 'practice' = 'culture') {
  return `/levels/${levelId}/units/${unitSlug}/${part}` as const
}

export const DASHBOARD_PARTS = [
  {
    id: 'culture',
    part: 'Part 1',
    title: 'Cultural Insight',
    body: 'Discover body language, greeting etiquette, and values behind Ethiopian hospitality.',
    cta: 'Explore cultural context',
    route: 'culture' as const,
  },
  {
    id: 'lesson',
    part: 'Part 2',
    title: 'Language Lesson',
    body: 'Master greetings by gender, time of day, audio pronunciation, and grammar endings.',
    cta: 'Study Amharic rules',
    route: 'lesson' as const,
  },
  {
    id: 'practice',
    part: 'Part 3',
    title: 'Practice & Drill',
    body: 'Flashcard deck, interactive quizzes, dialogue playback, and speaking recorder drill.',
    cta: 'Start exercises',
    route: 'practice' as const,
  },
] as const

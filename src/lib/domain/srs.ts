/**
 * Simple Leitner-box spaced repetition.
 * Rating: 1 = Again (hard), 2 = Good, 3 = Easy
 * Harder cards stay in lower boxes and resurface sooner.
 */

export type ReviewRating = 1 | 2 | 3

export type ReviewState = {
  box: number
  ease: number
  intervalDays: number
  repetitions: number
  nextReviewAt: Date
}

const BOX_INTERVALS = [0, 1, 3, 7, 14, 30] as const

export function createInitialReviewState(now = new Date()): ReviewState {
  return {
    box: 1,
    ease: 2.5,
    intervalDays: 0,
    repetitions: 0,
    nextReviewAt: now,
  }
}

export function applyReviewRating(
  current: ReviewState,
  rating: ReviewRating,
  difficultyWeight = 1,
  now = new Date(),
): ReviewState {
  let box = current.box
  let ease = current.ease
  let repetitions = current.repetitions

  if (rating === 1) {
    box = 1
    ease = Math.max(1.3, ease - 0.2)
    repetitions = 0
  } else if (rating === 2) {
    box = Math.min(5, box + 1)
    repetitions += 1
  } else {
    box = Math.min(5, box + 1)
    ease = Math.min(3.0, ease + 0.15)
    repetitions += 1
  }

  const base = BOX_INTERVALS[box] ?? 30
  const difficultyPenalty = Math.max(0, difficultyWeight - 1)
  const intervalDays =
    rating === 1
      ? 0
      : Math.max(1, Math.round(base * (ease / 2.5) - difficultyPenalty))

  const next = new Date(now)
  next.setDate(next.getDate() + intervalDays)

  return {
    box,
    ease: Number(ease.toFixed(2)),
    intervalDays,
    repetitions,
    nextReviewAt: next,
  }
}

export function isDue(state: Pick<ReviewState, 'nextReviewAt'>, now = new Date()) {
  return state.nextReviewAt.getTime() <= now.getTime()
}

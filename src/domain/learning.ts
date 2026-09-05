import type { Exercise } from './types'

export function normalizeAnswer(answer: string) {
  return answer
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('en')
    .replace(/[’‘]/g, "'")
    .replace(/[.!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isCorrect(exercise: Exercise, answer: string) {
  const normalized = normalizeAnswer(answer)
  return (
    normalized.length > 0 &&
    exercise.answers.some((expected) => normalizeAnswer(expected) === normalized)
  )
}

export const DAY = 86_400_000
const intervals = [1, 3, 7, 14, 30]

export type ReviewCard = { dueAt: number; step: number; attempts: number; successes: number }

export function initialReview(now: number): ReviewCard {
  return { dueAt: now + DAY, step: 0, attempts: 0, successes: 0 }
}

// Transparent starter schedule, not FSRS or a prediction of mastery.
export function scheduleReview(card: ReviewCard, independent: boolean, now: number): ReviewCard {
  const step = independent ? Math.min(card.step + 1, intervals.length - 1) : 0
  return {
    dueAt: now + (independent ? intervals[step] * DAY : 10 * 60_000),
    step,
    attempts: card.attempts + 1,
    successes: card.successes + Number(independent),
  }
}

import type { StudyState } from '../data/schema'
import { localDay } from './activity'
import { itemResult } from './planner'

export function activityWeek(state: StudyState, now: number) {
  const today = new Date(now)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + index)
    const day = localDay(date.getTime())
    return {
      day,
      date,
      ms: state.activityLog
        .filter((entry) => entry.day === day)
        .reduce((sum, entry) => sum + entry.elapsedMs, 0),
    }
  })
}

export function sessionHistory(state: StudyState) {
  const archived = state.planHistory.map((entry) => ({ ...entry, current: false }))
  const plan = state.plan
  if (!plan?.items.length || archived.some((entry) => entry.id === plan.id))
    return archived.reverse()
  const items = plan.items.map((item) => ({ ...item, completed: !!itemResult(state, item) }))
  return [
    {
      ...plan,
      endedAt: null,
      status: plan.cursor === plan.items.length ? ('completed' as const) : ('active' as const),
      current: true,
      items,
    },
    ...archived.reverse(),
  ]
}

export function practiceHistory(state: StudyState) {
  const lessons = state.completions.map((entry) => ({
    id: entry.id,
    lessonId: entry.lessonId,
    at: entry.completedAt,
    kind: 'lesson' as const,
    result: `${entry.independent}/3 câu đúng độc lập`,
    reflection: entry.reflection,
  }))
  const retrieval = [
    ...state.quickLog.map((entry) => ({ ...entry, at: entry.completedAt, kind: 'quick' as const })),
    ...state.reviewLog.map((entry) => ({
      ...entry,
      at: entry.reviewedAt,
      kind: 'review' as const,
    })),
  ].map((entry) => ({
    id: entry.id,
    lessonId: entry.lessonId,
    at: entry.at,
    kind: entry.kind,
    result: !entry.correct
      ? 'Chưa đúng · đã xem giải thích'
      : entry.independent
        ? 'Đúng, không cần gợi ý'
        : 'Đúng với gợi ý',
    reflection: '',
  }))
  return [...lessons, ...retrieval]
    .sort((a, b) => b.at - a.at)
    .map((entry) => {
      const measurements = state.activityLog.filter(
        (item) => item.attemptId === entry.id && item.kind === entry.kind,
      )
      return {
        ...entry,
        ms: measurements.length
          ? measurements.reduce((sum, item) => sum + item.elapsedMs, 0)
          : null,
      }
    })
}

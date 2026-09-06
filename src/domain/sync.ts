import { emptyState, stateSchema, type StudyState } from '../data/schema'
import { initialReview, scheduleReview } from './learning'

export function equal(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const left = Object.keys(a),
    right = Object.keys(b)
  return (
    left.length === right.length &&
    left.every(
      (key) =>
        Object.hasOwn(b, key) &&
        equal((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    )
  )
}
export type MergeChoice = 'local' | 'remote'
const compareId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)

// Three-way merge. No implicit deletion of completed learning from a stale device.
export function mergeStudy(
  base: StudyState,
  local: StudyState,
  remote: StudyState,
  choice: MergeChoice = 'local',
) {
  const conflicts = new Set<string>()
  function pick<T>(before: T, here: T, there: T, label: string): T {
    if (equal(here, there) || equal(there, before)) return here
    if (equal(here, before)) return there
    conflicts.add(label)
    return choice === 'local' ? here : there
  }
  function records<T extends { id: string }>(
    before: T[],
    here: T[],
    there: T[],
    label: string,
    max?: (a: T, b: T) => T,
  ): T[] {
    const prior = new Map(before.map((item) => [item.id, item]))
    const result = new Map(here.map((item) => [item.id, item]))
    for (const item of there) {
      const own = result.get(item.id)
      result.set(
        item.id,
        own ? (max ? max(own, item) : pick(prior.get(item.id), own, item, label)!) : item,
      )
    }
    return [...result.values()].sort(compareId)
  }
  const completions = records(
    base.completions,
    local.completions,
    remote.completions,
    'Kết quả bài học',
  )
  const reviewLog = records(base.reviewLog, local.reviewLog, remote.reviewLog, 'Kết quả ôn')
  const quickLog = records(base.quickLog, local.quickLog, remote.quickLog, 'Kết quả khởi động')
  const activityLog = records(
    base.activityLog,
    local.activityLog,
    remote.activityLog,
    'Thời gian hoạt động',
    (a, b) => {
      if (
        a.attemptId !== b.attemptId ||
        a.lessonId !== b.lessonId ||
        a.kind !== b.kind ||
        a.planId !== b.planId ||
        a.day !== b.day ||
        a.startedAt !== b.startedAt
      )
        return pick(
          base.activityLog.find((item) => item.id === a.id),
          a,
          b,
          'Thời gian hoạt động',
        )!
      return a.elapsedMs > b.elapsedMs ||
        (a.elapsedMs === b.elapsedMs && a.recordedAt >= b.recordedAt)
        ? a
        : b
    },
  )
  const planHistory = records(
    base.planHistory,
    local.planHistory,
    remote.planHistory,
    'Lịch sử phiên',
  )
  const reviews: StudyState['reviews'] = {}
  const lessonIds = new Set([
    ...completions.map((item) => item.lessonId),
    ...Object.keys(local.reviews),
    ...Object.keys(remote.reviews),
  ])
  for (const lessonId of lessonIds) {
    const first = completions
      .filter((item) => item.lessonId === lessonId)
      .sort((a, b) => a.completedAt - b.completedAt || compareId(a, b))[0]
    const attempts = reviewLog
      .filter((item) => item.lessonId === lessonId)
      .sort((a, b) => a.reviewedAt - b.reviewedAt || compareId(a, b))
    // Actual app history is complete. Preserve opaque imported cards when history is missing.
    if (
      !first ||
      attempts.length <
        Math.max(local.reviews[lessonId]?.attempts ?? 0, remote.reviews[lessonId]?.attempts ?? 0)
    ) {
      const old = pick(
        base.reviews[lessonId],
        local.reviews[lessonId],
        remote.reviews[lessonId],
        'Lịch ôn cũ',
      )
      if (old) reviews[lessonId] = old
    } else {
      reviews[lessonId] = attempts.reduce(
        (card, attempt) => scheduleReview(card, attempt.independent, attempt.reviewedAt),
        initialReview(first.completedAt),
      )
    }
  }
  const chosenDraft = pick(base.draft, local.draft, remote.draft, 'Bài đang làm')
  const draft =
    chosenDraft &&
    completions.some((item) => item.id === chosenDraft.id && item.lessonId === chosenDraft.lessonId)
      ? null
      : chosenDraft
  const plan = pick(base.plan, local.plan, remote.plan, 'Phiên đang học')
  const merged = stateSchema.parse({
    ...emptyState(),
    profile: pick(base.profile, local.profile, remote.profile, 'Thiết lập học tập'),
    draft,
    plan,
    completions,
    reviewLog,
    quickLog,
    activityLog,
    planHistory,
    reviews,
  })
  return { state: merged, conflicts: [...conflicts] }
}

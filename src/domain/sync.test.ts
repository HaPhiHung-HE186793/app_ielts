import { describe, expect, it } from 'vitest'
import { emptyState, profileSchema, stateSchema, type StudyState } from '../data/schema'
import { equal, mergeStudy } from './sync'
import { initialReview, scheduleReview } from './learning'
import { startLesson } from './session'

const completed = (id = 'first', at = 1_000): StudyState => ({
  ...emptyState(),
  completions: [{ id, lessonId: 'hello', completedAt: at, independent: 3, reflection: '' }],
  reviews: { hello: initialReview(at) },
})
const profile = (name: string) =>
  profileSchema.parse({ name, dailyMinutes: 30, exam: 'undecided', interests: [] })
describe('three-way study merge', () => {
  it('compares objects independently of server key ordering', () => {
    expect(equal({ a: [1, 2], b: null }, { b: null, a: [1, 2] })).toBe(true)
    expect(equal({ a: [1, 2] }, { a: [2, 1] })).toBe(false)
    expect(equal([1], { 0: 1 })).toBe(false)
  })
  it('unions completed attempts and is idempotent when replayed', () => {
    const merged = mergeStudy(emptyState(), completed('A'), completed('B', 2_000))
    expect(merged.conflicts).toEqual([])
    expect(merged.state.completions.map((item) => item.id)).toEqual(['A', 'B'])
    expect(mergeStudy(emptyState(), merged.state, completed('B', 2_000)).state).toEqual(
      merged.state,
    )
    expect(mergeStudy(emptyState(), completed('B', 2_000), completed('A')).state).toEqual(
      merged.state,
    )
  })
  it('rebuilds review schedules chronologically from both devices without counting duplicates', () => {
    const base = completed()
    const early = {
      id: 'early',
      lessonId: 'hello',
      reviewedAt: 20_000,
      correct: false,
      independent: false,
    }
    const late = {
      id: 'late',
      lessonId: 'hello',
      reviewedAt: 30_000,
      correct: true,
      independent: true,
    }
    const local = {
      ...base,
      reviewLog: [late],
      reviews: { hello: scheduleReview(base.reviews.hello, true, late.reviewedAt) },
    }
    const remote = {
      ...base,
      reviewLog: [early],
      reviews: { hello: scheduleReview(base.reviews.hello, false, early.reviewedAt) },
    }
    const result = mergeStudy(base, local, remote)
    expect(result.conflicts).toEqual([])
    expect(result.state.reviews.hello).toEqual(
      scheduleReview(scheduleReview(base.reviews.hello, false, 20_000), true, 30_000),
    )
    expect(mergeStudy(remote, result.state, remote).state.reviews.hello.attempts).toBe(2)
  })
  it('takes the largest cumulative checkpoint rather than summing it again', () => {
    const entry = {
      id: 'visit/day',
      attemptId: 'first',
      lessonId: 'hello',
      kind: 'lesson' as const,
      planId: null,
      day: '2026-09-06',
      startedAt: 1_000,
      recordedAt: 6_000,
      elapsedMs: 5_000,
    }
    const a = { ...completed(), activityLog: [entry] },
      b = { ...completed(), activityLog: [{ ...entry, elapsedMs: 9_000, recordedAt: 10_000 }] }
    expect(mergeStudy(emptyState(), a, b).state.activityLog).toEqual(b.activityLog)
    expect(mergeStudy(emptyState(), b, a).state.activityLog).toEqual(b.activityLog)
  })
  it('requires a choice for different concurrent drafts and keeps both histories with either choice', () => {
    const base = startLesson(emptyState(), 'hello', 'same')
    const a = {
      ...base,
      draft: { ...base.draft!, pendingAnswer: 'from A' },
      quickLog: [
        { id: 'A', lessonId: 'hello', completedAt: 5_000, correct: true, independent: true },
      ],
    }
    const b = { ...base, draft: { ...base.draft!, pendingAnswer: 'from B' }, profile: profile('B') }
    expect(mergeStudy(base, a, b).conflicts).toEqual(['Bài đang làm'])
    expect(mergeStudy(base, a, b, 'remote').state.draft?.pendingAnswer).toBe('from B')
    expect(mergeStudy(base, a, b, 'remote').state.quickLog).toEqual(a.quickLog)
    expect(mergeStudy(base, a, b).state.profile?.name).toBe('B')
    expect(a.draft.pendingAnswer).toBe('from A')
  })
  it('detects a reused attempt ID with different results instead of silently overriding it', () => {
    const a = completed(),
      b = { ...a, completions: [{ ...a.completions[0], reflection: 'different' }] }
    expect(mergeStudy(emptyState(), a, b).conflicts).toContain('Kết quả bài học')
    expect(mergeStudy(emptyState(), a, b, 'remote').state.completions[0].reflection).toBe(
      'different',
    )
  })
  it('does not resurrect a completed draft or delete history absent on a stale device', () => {
    const base = startLesson(emptyState(), 'hello', 'first')
    const result = mergeStudy(base, base, completed())
    expect(result.state.draft).toBeNull()
    expect(mergeStudy(completed(), emptyState(), completed()).state.completions).toHaveLength(1)
  })
  it('keeps legacy review cards when no attempt history can explain them', () => {
    const legacy = {
      ...emptyState(),
      reviews: { hello: { dueAt: 9_000, attempts: 5, successes: 3, step: 2 } },
    }
    const result = mergeStudy(emptyState(), legacy, emptyState())
    expect(result.state.reviews).toEqual(legacy.reviews)
    expect(result.conflicts).toEqual([])
    expect(stateSchema.safeParse(result.state).success).toBe(true)
  })
})

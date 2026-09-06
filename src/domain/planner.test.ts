import { describe, expect, it } from 'vitest'
import { emptyState, parseBackup, profileSchema, type StudyState } from '../data/schema'
import { lessons } from '../content/lessons'
import { DAY, initialReview } from './learning'
import {
  advancePlan,
  beginPlannedLesson,
  buildPlan,
  itemResult,
  submitPlannedPractice,
} from './planner'
import { completeLesson, startLesson, submitAnswer } from './session'

const now = Date.UTC(2026, 8, 6, 16, 59)
const profile = profileSchema.parse({
  name: 'An',
  dailyMinutes: 60,
  exam: 'undecided',
  interests: [],
})
function withPlan(state = emptyState(), mode: '2' | '5' | '15' | 'full' = '2'): StudyState {
  return { ...state, plan: buildPlan(state, mode, now, 'plan') }
}

describe('finite duration plans', () => {
  it('gives different activities for 2/5/15/full and never claims unavailable content', () => {
    const state = { ...emptyState(), profile }
    expect(buildPlan(state, '2', now, '2').items.map((item) => item.kind)).toEqual(['quick'])
    expect(buildPlan(state, '5', now, '5').items).toHaveLength(1)
    expect(buildPlan(state, '15', now, '15').items).toHaveLength(3)
    const full = buildPlan(state, 'full', now, 'full')
    expect(full.budget).toBe(60)
    expect(full.items).toHaveLength(7)
    expect(full.items.reduce((sum, item) => sum + item.minutes, 0)).toBe(35)
  })
  it('prioritizes the oldest due reviews with a cap of three and respects the budget', () => {
    const state = emptyState()
    lessons.forEach((lesson, index) => {
      state.reviews[lesson.id] = { ...initialReview(now), dueAt: now - index * DAY }
    })
    const plan = buildPlan(state, '15', now, 'plan')
    expect(plan.items.slice(0, 3).map((item) => item.lessonId)).toEqual([
      'tonight',
      'yesterday',
      'morning',
    ])
    expect(plan.items.filter((item) => item.kind === 'lesson')).toHaveLength(2)
    expect(plan.items.reduce((sum, item) => sum + item.minutes, 0)).toBe(13)
    state.reviews = { hello: initialReview(now) }
    expect(buildPlan(state, '15', now, 'new').items.every((item) => item.kind === 'lesson')).toBe(
      true,
    )
  })
  it('preserves an unfinished lesson in short sessions and resumes it in a longer session', () => {
    const state = startLesson(emptyState(), 'tea', 'existing')
    state.draft!.pendingAnswer = 'not submitted'
    const short = withPlan(state)
    const full = withPlan(state, '5')
    expect(short.draft).toEqual(state.draft)
    expect(short.plan!.items[0]).toMatchObject({ kind: 'quick', lessonId: 'tea' })
    expect(full.plan!.items[0].id).toBe('existing')
    expect(beginPlannedLesson(full).draft).toEqual(state.draft)
    expect(parseBackup(JSON.stringify(full))).toEqual(full)
  })
  it('returns an empty new-lesson plan after the small catalogue is finished', () => {
    const state = emptyState()
    state.completions = lessons.map((lesson) => ({
      id: lesson.id,
      lessonId: lesson.id,
      independent: 3,
      completedAt: now,
      reflection: '',
    }))
    expect(buildPlan(state, '5', now, 'plan').items).toHaveLength(0)
    expect(buildPlan(state, 'full', now, 'plan').items).toHaveLength(0)
    expect(buildPlan(state, '2', now, 'plan').items).toHaveLength(1)
  })
})

describe('planned activity persistence and completion', () => {
  it('records quick recall once without completing a lesson or altering its review schedule', () => {
    const state = withPlan(
      startLesson({ ...emptyState(), reviews: { hello: initialReview(now) } }, 'hello', 'draft'),
    )
    expect(advancePlan(state)).toBe(state)
    state.plan!.practice = { stage: 'intro', answer: 'is', hinted: true }
    expect(submitPlannedPractice(state, now)).toBe(state)
    state.plan!.practice.stage = 'recall'
    const next = submitPlannedPractice(parseBackup(JSON.stringify(state)), now)
    expect(next.quickLog).toEqual([
      { id: 'plan-0', lessonId: 'hello', completedAt: now, correct: true, independent: false },
    ])
    expect(next.draft).toEqual(state.draft)
    expect(next.reviews).toEqual(state.reviews)
    expect(next.completions).toHaveLength(0)
    expect(submitPlannedPractice(next, now + 1)).toBe(next)
    const finished = advancePlan(next)
    expect(finished.plan!.cursor).toBe(1)
    expect(advancePlan(finished)).toBe(finished)
    expect(parseBackup(JSON.stringify(finished))).toEqual(finished)
  })
  it('persists wrong or hinted planned reviews and reschedules exactly once on reload', () => {
    let state = withPlan(
      { ...emptyState(), reviews: { hello: { ...initialReview(now), dueAt: now } } },
      '15',
    )
    state.plan!.practice = { stage: 'recall', answer: 'are', hinted: false }
    state = submitPlannedPractice(state, now)
    expect(state.reviewLog[0]).toMatchObject({ correct: false, independent: false })
    expect(state.reviews.hello.dueAt).toBe(now + 600_000)
    const restored = parseBackup(JSON.stringify(state))
    expect(submitPlannedPractice(restored, now + DAY)).toBe(restored)
    expect(advancePlan(restored).plan!.cursor).toBe(1)
  })
  it('credits only the actual attempt, and advances only after full lesson completion', () => {
    let state = beginPlannedLesson(withPlan(emptyState(), '5'))
    expect(advancePlan(state)).toBe(state)
    for (let index = 0; index < 3; index++) {
      state.draft = { ...state.draft!, stage: 'exercise', index }
      state = submitAnswer(state, lessons[0].exercises[index].answers[0])
    }
    state.draft!.stage = 'reflection'
    const next = completeLesson(state, now)
    expect(itemResult(next, next.plan!.items[0])).toMatchObject({ id: 'plan-0', independent: 3 })
    expect(advancePlan(next).plan!.cursor).toBe(1)
    expect(parseBackup(JSON.stringify(advancePlan(next))).completions).toHaveLength(1)
  })
  it('rebinds a planned lesson to a newer draft of that lesson without losing its answers', () => {
    let state = withPlan(emptyState(), '5')
    state = startLesson(state, 'hello', 'other-attempt')
    state.draft!.pendingAnswer = 'partial'
    const next = beginPlannedLesson(state)
    expect(next.plan!.items[0].id).toBe('other-attempt')
    expect(next.draft!.pendingAnswer).toBe('partial')
  })
})

describe('version 1 migration and safe plan backups', () => {
  it('migrates an old backup preserving profile, pending answer, completions and review', () => {
    const current = startLesson(emptyState(), 'hello', 'old-draft')
    current.draft!.pendingAnswer = 'my answer'
    const legacy = {
      version: 1,
      profile: { name: 'An', dailyMinutes: 30, exam: 'undecided', interests: ['Giải trí'] },
      draft: current.draft,
      completions: [],
      reviews: { hello: initialReview(now) },
      reviewLog: [],
    }
    const migrated = parseBackup(JSON.stringify(legacy))
    expect(migrated.version).toBe(3)
    expect(migrated.plan).toBeNull()
    expect(migrated.quickLog).toEqual([])
    expect(migrated.profile).toMatchObject({
      name: 'An',
      goal: 'explore',
      foundation: 'unsure',
      targetDate: null,
    })
    expect(migrated.draft).toEqual(legacy.draft)
    expect(migrated.reviews).toEqual(legacy.reviews)
  })
  it('rejects skipped activities, duplicate ids and invalid dates before restoration', () => {
    const skipped = withPlan()
    skipped.plan!.cursor = 1
    expect(() => parseBackup(JSON.stringify(skipped))).toThrow()
    const duplicate = withPlan(emptyState(), '15')
    duplicate.plan!.items[1].id = duplicate.plan!.items[0].id
    expect(() => parseBackup(JSON.stringify(duplicate))).toThrow()
    expect(() => profileSchema.parse({ ...profile, targetDate: '2026-02-30' })).toThrow()
    expect(profileSchema.parse({ ...profile, targetDate: '2024-02-29' }).targetDate).toBe(
      '2024-02-29',
    )
  })
})

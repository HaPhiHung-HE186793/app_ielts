import { describe, expect, it } from 'vitest'
import { curriculum, lessons } from '../content/lessons'
import { prerequisites } from '../content/prerequisites'
import { emptyState, parseBackup, profileSchema, type StudyState } from '../data/schema'
import { DAY, initialReview } from './learning'
import { recommendLessons, returningAfterGap, supportNeeds } from './adaptation'
import { buildPlan, replacePlan } from './planner'
import { startLesson } from './session'
import { mergeStudy } from './sync'

const now = Date.UTC(2026, 8, 7, 12)
const profile = profileSchema.parse({
  name: 'An',
  dailyMinutes: 60,
  exam: 'undecided',
  interests: ['Ăn uống'],
})
function completed(ids: string[], at = now - DAY): StudyState {
  return {
    ...emptyState(),
    profile,
    completions: ids.map((lessonId, index) => ({
      id: `done-${index}`,
      lessonId,
      completedAt: at + index,
      independent: 3,
      reflection: '',
    })),
  }
}

describe('bounded adaptive recommendations', () => {
  it('has an acyclic prerequisite graph covering every unit, with real referenced IDs', () => {
    expect(Object.keys(prerequisites).sort()).toEqual(lessons.map((item) => item.id).sort())
    const visit = (id: string, path: Set<string>) => {
      expect(path.has(id), `Cycle at ${id}`).toBe(false)
      expect(prerequisites[id]).toBeDefined()
      prerequisites[id].forEach((parent) => visit(parent, new Set([...path, id])))
    }
    lessons.forEach((item) => visit(item.id, new Set()))
  })
  it('keeps prerequisites before successors and checkpoints across every catalogue prefix', () => {
    for (let count = 0; count <= lessons.length; count++) {
      const state = completed(lessons.slice(0, count).map((item) => item.id))
      const done = new Set(state.completions.map((item) => item.lessonId))
      const plan = buildPlan(state, 'full', now, `plan-${count}`)
      for (const item of plan.items) {
        expect(
          prerequisites[item.lessonId].every((id) => done.has(id)),
          item.lessonId,
        ).toBe(true)
        const group = curriculum.find((week) =>
          week.lessons.some((lesson) => lesson.id === item.lessonId),
        )!
        expect(
          curriculum
            .filter((week) => week.week < group.week)
            .every((week) => week.lessons.every((lesson) => done.has(lesson.id))),
        ).toBe(true)
        done.add(item.lessonId)
      }
      expect(parseBackup(JSON.stringify({ ...state, plan })).plan).toEqual(plan)
      expect(plan.items.length).toBeLessThanOrEqual(10)
    }
  })
  it('uses interests only for ready neighbours and returns to core content on the next slot', () => {
    const state = completed(['hello'])
    const plan = buildPlan(state, '15', now, 'plan')
    expect(plan.items.map((item) => item.lessonId)).toEqual(['tea', 'friends', 'room'])
    expect(plan.items[0].reason).toContain('sở thích')
    expect(plan.items.every((item) => item.kind === 'lesson')).toBe(true)
    expect(buildPlan({ ...emptyState(), profile }, '5', now, 'first').items[0].lessonId).toBe(
      'hello',
    )
  })
  it('puts a supported lesson ahead of preferred topics without filling the plan with repeats', () => {
    const state = completed(['hello', 'friends'])
    state.completions[1].independent = 1
    const plan = buildPlan(state, '15', now, 'plan')
    expect(plan.items[0]).toMatchObject({ lessonId: 'friends', kind: 'lesson' })
    expect(plan.items[0].reason).toContain('hỗ trợ')
    expect(plan.items.slice(1).every((item) => item.lessonId !== 'friends')).toBe(true)
    expect(plan.items.some((item) => item.lessonId === 'tea')).toBe(true)
  })
  it('uses latest observed results deterministically, includes hints and ignores future records', () => {
    const state = completed(['hello'])
    state.reviewLog = [
      { id: 'a', lessonId: 'hello', reviewedAt: now - 200, correct: true, independent: false },
    ]
    expect(supportNeeds(state, now)).toEqual(['hello'])
    state.quickLog = [
      { id: 'b', lessonId: 'hello', completedAt: now - 100, correct: true, independent: true },
      {
        id: 'future',
        lessonId: 'hello',
        completedAt: now + DAY,
        correct: false,
        independent: false,
      },
    ]
    expect(supportNeeds(state, now)).toEqual([])
    state.quickLog.push({
      id: 'c',
      lessonId: 'hello',
      completedAt: now - 100,
      correct: false,
      independent: false,
    })
    expect(supportNeeds(state, now)).toEqual(
      supportNeeds({ ...state, quickLog: [...state.quickLog].reverse() }, now),
    )
    expect(supportNeeds(state, now)).toEqual(['hello'])
  })
  it('does not promote an unfamiliar advanced lesson from a failed quick attempt', () => {
    const state = emptyState()
    state.quickLog = [
      {
        id: 'advanced',
        lessonId: 'small-story',
        completedAt: now,
        correct: false,
        independent: false,
      },
    ]
    expect(recommendLessons(state, now, 'normal', 1)[0].lessonId).toBe('hello')
  })
  it('caps overdue work and each light pace without rewriting any due dates or budget', () => {
    const state = completed(lessons.map((item) => item.id))
    state.reviews = Object.fromEntries(
      lessons.map((item, index) => [
        item.id,
        { ...initialReview(now), dueAt: now - (index + 1) * DAY },
      ]),
    )
    const original = structuredClone(state)
    for (const pace of ['normal', 'tired', 'hard', 'returning'] as const) {
      for (const mode of ['2', '5', '15', 'full'] as const) {
        const plan = buildPlan(state, mode, now, `${pace}-${mode}`, pace)
        expect(plan.items.filter((item) => item.kind === 'review').length).toBeLessThanOrEqual(
          pace === 'normal' ? 3 : pace === 'returning' ? 2 : 1,
        )
        if (pace !== 'normal')
          expect(plan.items.filter((item) => item.kind === 'lesson').length).toBeLessThanOrEqual(1)
        if (pace !== 'normal' && mode !== '2') {
          expect(plan.items.find((item) => item.kind === 'lesson')?.lessonId).toBe('hello')
          expect(new Set(plan.items.map((item) => item.lessonId)).size).toBe(plan.items.length)
        }
        expect(plan.items.reduce((total, item) => total + item.minutes, 0)).toBeLessThanOrEqual(
          plan.budget,
        )
        expect(parseBackup(JSON.stringify({ ...state, plan })).plan).toEqual(plan)
      }
    }
    expect(state).toEqual(original)
  })
  it('keeps a difficult draft while a two-minute plan uses an earlier foundation', () => {
    const state = startLesson(emptyState(), 'small-story', 'original')
    state.draft!.pendingAnswer = 'keep this'
    const next = replacePlan(state, '2', now, 'light', 'hard')
    expect(next.plan!.items[0]).toMatchObject({ kind: 'quick', lessonId: 'hello' })
    expect(next.draft).toEqual(state.draft)
    expect(buildPlan(state, '5', now, 'resume', 'tired').items[0].id).toBe('original')
  })
  it('suggests a return only from dated activity, at seven days, and honours recent practice', () => {
    expect(returningAfterGap(emptyState(), now)).toBe(false)
    const state = completed(['hello'], now - 7 * DAY)
    expect(returningAfterGap(state, now - 1)).toBe(false)
    expect(returningAfterGap(state, now)).toBe(true)
    state.quickLog = [
      {
        id: 'recent',
        lessonId: 'hello',
        completedAt: now - DAY,
        correct: false,
        independent: false,
      },
    ]
    expect(returningAfterGap(state, now)).toBe(false)
    state.quickLog[0].completedAt = now + DAY
    expect(returningAfterGap(state, now)).toBe(true)
  })
  it('keeps frozen plans and reasons through restore, replacement and three-way sync', () => {
    const base = completed(['hello'])
    const local = replacePlan(base, '15', now, 'plan', 'tired')
    const restored = parseBackup(JSON.stringify(local))
    const remote = { ...base, profile: { ...profile, interests: [] } }
    const merged = mergeStudy(base, restored, remote)
    expect(merged.conflicts).toEqual([])
    expect(merged.state.plan).toEqual(local.plan)
    expect(replacePlan(merged.state, 'full', now + DAY, 'plan', 'normal')).toBe(merged.state)
    const next = replacePlan(merged.state, '2', now + DAY, 'new', 'hard')
    expect(next.planHistory[0].adaptation).toEqual({ rule: 1, pace: 'tired' })
    expect(next.planHistory[0].items[0].reason).toBe(local.plan!.items[0].reason)
    expect(parseBackup(JSON.stringify(next))).toEqual(next)
  })
  it('accepts plans without new metadata and rejects malformed adaptation metadata', () => {
    const state = replacePlan(emptyState(), '5', now, 'old')
    delete state.plan!.adaptation
    state.plan!.items.forEach((item) => delete item.reason)
    expect(parseBackup(JSON.stringify(state))).toEqual(state)
    expect(() =>
      parseBackup(
        JSON.stringify({
          ...state,
          plan: { ...state.plan, adaptation: { pace: 'unknown', rule: 1 } },
        }),
      ),
    ).toThrow()
    expect(() =>
      parseBackup(
        JSON.stringify({
          ...state,
          plan: { ...state.plan, items: [{ ...state.plan!.items[0], reason: 'x'.repeat(241) }] },
        }),
      ),
    ).toThrow()
  })
})

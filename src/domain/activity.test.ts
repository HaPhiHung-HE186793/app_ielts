import { describe, expect, it } from 'vitest'
import { emptyState, parseBackup, type ActivityEntry } from '../data/schema'
import {
  ActivityClock,
  formatDuration,
  localDay,
  measuredTime,
  recordActivity,
  splitAtMidnight,
} from './activity'
import { advancePlan, beginPlannedLesson, replacePlan, submitPlannedPractice } from './planner'
import { practiceHistory, sessionHistory } from './progress'

const now = new Date(2026, 8, 6, 10).getTime()
const entry: ActivityEntry = {
  id: 'visit/day',
  attemptId: 'attempt',
  lessonId: 'hello',
  kind: 'lesson',
  planId: null,
  day: localDay(now),
  startedAt: now,
  recordedAt: now + 5000,
  elapsedMs: 5000,
}

describe('active duration clock', () => {
  it('stops precisely at 60 seconds without interaction and resumes without counting the gap', () => {
    const clock = new ActivityClock(0, now, true)
    let total = 0
    for (let t = 5000; t <= 120_000; t += 5000) {
      const slice = clock.tick(t, now + t)
      total += slice ? slice.end - slice.start : 0
    }
    expect(total).toBe(60_000)
    expect(clock.isRunning(120_000)).toBe(false)
    expect(clock.interact(120_000, now + 120_000)).toBeNull()
    expect(clock.tick(125_000, now + 125_000)).toEqual({ start: now + 120_000, end: now + 125_000 })
  })
  it('excludes blurred/hidden/paused intervals but settles time just before suspension', () => {
    const clock = new ActivityClock(0, now, true)
    expect(clock.setEnabled(false, 3000, now + 3000)).toEqual({ start: now, end: now + 3000 })
    expect(clock.tick(8000, now + 8000)).toBeNull()
    expect(clock.setEnabled(true, 9000, now + 9000)).toBeNull()
    expect(clock.tick(10_000, now + 10_000)).toEqual({ start: now + 9000, end: now + 10_000 })
  })
  it('drops a suspended heartbeat or a system clock jump and waits for renewed interaction', () => {
    const clock = new ActivityClock(0, now, true)
    expect(clock.tick(30_000, now + 30_000)).toBeNull()
    expect(clock.tick(31_000, now + 31_000)).toBeNull()
    clock.interact(31_000, now + 31_000)
    expect(clock.tick(32_000, now + 32_000)).not.toBeNull()
    expect(clock.tick(33_000, now + 100_000)).toBeNull()
    expect(clock.isRunning(33_000)).toBe(false)
    expect(clock.tick(34_000, now + 101_000)).toBeNull()
  })
  it('ignores repeated checkpoints and negative monotonic differences', () => {
    const clock = new ActivityClock(5000, now, true)
    expect(clock.tick(5000, now)).toBeNull()
    expect(clock.tick(4000, now + 1000)).toBeNull()
    expect(clock.isRunning(5000)).toBe(false)
  })
  it('splits a measured interval at local midnight without gaining or losing milliseconds', () => {
    const start = new Date(2026, 8, 6, 23, 59, 58).getTime()
    expect(splitAtMidnight({ start, end: start + 5000 })).toEqual([
      { day: '2026-09-06', start, end: start + 2000 },
      { day: '2026-09-07', start: start + 2000, end: start + 5000 },
    ])
  })
})

describe('time checkpoints and migration', () => {
  it('upserts a cumulative checkpoint once, preserving other visits and ignoring stale writes', () => {
    let state = recordActivity(emptyState(), entry)
    expect(recordActivity(state, entry)).toBe(state)
    state = recordActivity(state, { ...entry, elapsedMs: 8000, recordedAt: now + 8000 })
    expect(recordActivity(state, entry)).toBe(state)
    state = recordActivity(state, { ...entry, id: 'another-visit/day' })
    expect(state.activityLog).toHaveLength(2)
    expect(measuredTime(state)).toBe(13_000)
    expect(recordActivity(state, { ...entry, attemptId: 'collision', elapsedMs: 10_000 })).toBe(
      state,
    )
    expect(parseBackup(JSON.stringify(state))).toEqual(state)
  })
  it('keeps missing old duration unknown when reading versions 1 and 2', () => {
    const completion = {
      id: 'old',
      lessonId: 'hello',
      independent: 2,
      completedAt: now,
      reflection: 'My name is An.',
    }
    const old = { ...emptyState(), version: 2, completions: [completion] }
    const migrated = parseBackup(JSON.stringify(old))
    expect(migrated.version).toBe(3)
    expect(migrated.activityLog).toEqual([])
    expect(migrated.completions).toEqual([completion])
    expect(measuredTime(migrated)).toBeNull()
    expect(practiceHistory(migrated)[0].ms).toBeNull()
    expect(parseBackup(JSON.stringify({ ...old, version: 1 })).version).toBe(3)
    expect(formatDuration(null)).toBe('Chưa có dữ liệu đo')
  })
  it('rejects invalid time, duplicate activity ids and historical progress lacking evidence', () => {
    for (const record of [
      { ...entry, elapsedMs: -1 },
      { ...entry, elapsedMs: 1e20 },
      { ...entry, day: '2026-02-30' },
      { ...entry, recordedAt: now - 1 },
    ])
      expect(() =>
        parseBackup(JSON.stringify({ ...emptyState(), activityLog: [record] })),
      ).toThrow()
    expect(() =>
      parseBackup(JSON.stringify({ ...emptyState(), activityLog: [entry, entry] })),
    ).toThrow()
    const state = replacePlan(emptyState(), '5', now, 'plan')
    const forged = {
      id: 'history',
      mode: '5',
      budget: 5,
      createdAt: now,
      endedAt: now,
      status: 'completed',
      items: state.plan!.items.map((item) => ({ ...item, completed: true })),
    }
    expect(() => parseBackup(JSON.stringify({ ...state, planHistory: [forged] }))).toThrow()
  })
})

describe('session history and honest progress', () => {
  it('archives completed quick sessions once, separately from lessons, and preserves them on replacement', () => {
    let state = replacePlan(emptyState(), '2', now, 'first')
    state.plan!.practice = { stage: 'recall', answer: 'is', hinted: true }
    state = submitPlannedPractice(state, now + 1000)
    state = advancePlan(state, now + 2000)
    expect(advancePlan(state, now + 3000)).toBe(state)
    expect(state.planHistory).toHaveLength(1)
    expect(state.planHistory[0]).toMatchObject({ status: 'completed', endedAt: now + 2000 })
    expect(state.completions).toHaveLength(0)
    expect(practiceHistory(state)[0]).toMatchObject({ kind: 'quick', result: 'Đúng với gợi ý' })
    state = replacePlan(state, '5', now + 3000, 'second')
    expect(state.planHistory).toHaveLength(1)
    expect(sessionHistory(state)).toHaveLength(2)
    expect(parseBackup(JSON.stringify(state))).toEqual(state)
  })
  it('snapshots partial work when changing plans without clearing the draft or counting future work', () => {
    let state = beginPlannedLesson(replacePlan(emptyState(), '15', now, 'first'))
    const draft = state.draft
    state = replacePlan(state, '2', now + 3000, 'second')
    expect(state.draft).toEqual(draft)
    expect(state.planHistory[0]).toMatchObject({ status: 'replaced' })
    expect(state.planHistory[0].items.every((item) => !item.completed)).toBe(true)
    expect(replacePlan(state, '2', now + 4000, 'second')).toBe(state)
    expect(parseBackup(JSON.stringify(state))).toEqual(state)
  })
  it('preserves a version-two unfinished plan and its answer without inventing a history', () => {
    const state = replacePlan(emptyState(), '2', now, 'existing')
    state.plan!.practice = { stage: 'recall', answer: 'i', hinted: true }
    const restored = parseBackup(JSON.stringify({ ...state, version: 2 }))
    expect(restored.plan).toEqual(state.plan)
    expect(restored.planHistory).toEqual([])
    expect(measuredTime(restored, 'existing')).toBeNull()
  })
})

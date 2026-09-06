import { describe, expect, it } from 'vitest'
import { lessons } from '../content/lessons'
import { emptyState, parseBackup, type StudyState } from '../data/schema'
import { DAY, initialReview, isCorrect, normalizeAnswer, scheduleReview } from './learning'
import { completeLesson, recordReview, startLesson, submitAnswer } from './session'

const now = Date.UTC(2026, 8, 6, 16, 59)

function completedDraft(
  lessonId = 'hello',
  id = 'session-1',
): StudyState & { draft: NonNullable<StudyState['draft']> } {
  const lesson = lessons.find((item) => item.id === lessonId)!
  let state = startLesson(emptyState(), lessonId, id)
  for (let index = 0; index < lesson.exercises.length; index++) {
    state = { ...state, draft: { ...state.draft!, stage: 'exercise', index } }
    state = submitAnswer(state, lesson.exercises[index].answers[0])
  }
  return { ...state, draft: { ...state.draft!, stage: 'reflection' as const } }
}

describe('answer grading', () => {
  it('accepts case, surrounding spaces, punctuation and curly apostrophes', () => {
    expect(normalizeAnswer('  I’d   LIKE. ')).toBe("i'd like")
    expect(isCorrect(lessons[0].exercises[1], '  IS! ')).toBe(true)
  })
  it('rejects empty, incorrect and partial answers', () => {
    for (const answer of ['', ' ', 'are', 'i', 'is not'])
      expect(isCorrect(lessons[0].exercises[1], answer)).toBe(false)
  })
  it('keeps Vietnamese accents significant for choice answers', () => {
    expect(isCorrect(lessons[0].exercises[0], 'Minh ten la Linh.')).toBe(false)
  })
})

describe('lesson lifecycle', () => {
  it.each(lessons.map((lesson) => [lesson.id]))(
    'completes %s only after all exercises and creates a review in one day',
    (id) => {
      const draft = completedDraft(id)
      const completed = completeLesson(draft, now)
      expect(completed.completions).toHaveLength(1)
      expect(completed.completions[0].independent).toBe(3)
      expect(completed.reviews[id].dueAt).toBe(now + DAY)
      expect(completed.draft).toBeNull()
      expect(parseBackup(JSON.stringify(completed))).toEqual(completed)
    },
  )
  it('does not grade intro, empty submissions or finish an incomplete draft', () => {
    const state = startLesson(emptyState(), 'hello', 'draft')
    expect(submitAnswer(state, 'is')).toBe(state)
    expect(completeLesson(state, now)).toBe(state)
    const exercise: StudyState = { ...state, draft: { ...state.draft!, stage: 'exercise' } }
    expect(submitAnswer(exercise, ' ')).toBe(exercise)
    const skipped: StudyState = { ...state, draft: { ...state.draft!, stage: 'reflection' } }
    expect(completeLesson(skipped, now)).toBe(skipped)
  })
  it('does not add a completion twice or erase a draft when resuming', () => {
    const draft = completedDraft()
    expect(startLesson(draft, 'hello', 'other-id')).toBe(draft)
    const completed = completeLesson(draft, now)
    expect(completeLesson(completed, now + 1)).toBe(completed)
    expect(completeLesson({ ...completed, draft: draft.draft }, now + 1).completions).toHaveLength(
      1,
    )
  })
  it('counts a hinted or corrected answer separately from independent success after reload', () => {
    let state = completedDraft()
    state.draft.responses.meaning.hintUsed = true
    state.draft.responses.recall.submissions = ['are', 'is']
    state = parseBackup(JSON.stringify(state)) as ReturnType<typeof completedDraft>
    expect(completeLesson(state, now).completions[0].independent).toBe(1)
  })
  it('does not accept more submissions for an already passed exercise', () => {
    let state = completedDraft()
    state = { ...state, draft: { ...state.draft, stage: 'exercise', index: 2 } }
    expect(submitAnswer(state, 'wrong')).toBe(state)
  })
  it('repeating a lesson preserves the existing review schedule', () => {
    const first = completeLesson(completedDraft(), now)
    const second = completeLesson(
      {
        ...completedDraft('hello', 'session-2'),
        reviews: first.reviews,
        completions: first.completions,
      },
      now + DAY * 3,
    )
    expect(second.completions).toHaveLength(2)
    expect(second.reviews.hello).toEqual(first.reviews.hello)
  })
})

describe('review schedule', () => {
  it('uses elapsed time across midnight and gaps, without piling up missed sessions', () => {
    const card = initialReview(now)
    const next = scheduleReview(card, true, now + DAY * 20)
    expect(next.dueAt).toBe(now + DAY * 23)
    expect(next.attempts).toBe(1)
  })
  it('returns mistakes and assisted responses after ten minutes', () => {
    const card = { dueAt: now, step: 3, attempts: 4, successes: 4 }
    expect(scheduleReview(card, false, now)).toEqual({
      dueAt: now + 600_000,
      step: 0,
      attempts: 5,
      successes: 4,
    })
  })
  it('caps the interval at thirty days', () => {
    const card = { dueAt: now, step: 4, attempts: 20, successes: 20 }
    expect(scheduleReview(card, true, now).dueAt).toBe(now + 30 * DAY)
  })
  it('records a review once and distinguishes correct with a hint', () => {
    const state = completeLesson(completedDraft(), now)
    const next = recordReview(state, 'hello', 'is', true, 'review-1', now + DAY)
    expect(next.reviewLog[0]).toMatchObject({ correct: true, independent: false })
    expect(next.reviews.hello.dueAt).toBe(now + DAY + 600_000)
    expect(recordReview(next, 'hello', 'is', true, 'review-1', now + DAY)).toBe(next)
    expect(recordReview(state, 'tea', 'like', false, 'missing-card', now)).toBe(state)
  })
})

describe('backup validation', () => {
  it('round-trips an unfinished exercise with its hint and attempts', () => {
    const state = startLesson(emptyState(), 'hello', 'saved')
    state.draft!.stage = 'exercise'
    state.draft!.pendingAnswer = 'A draft not yet submitted'
    const attempted = submitAnswer(state, 'wrong')
    expect(parseBackup(JSON.stringify(attempted))).toEqual(attempted)
  })
  it.each([
    '{not-json',
    JSON.stringify({ ...emptyState(), version: 99 }),
    JSON.stringify({ ...emptyState(), reviews: { nonexistent: initialReview(now) } }),
    JSON.stringify({ ...emptyState(), reviews: { hello: { ...initialReview(now), dueAt: 1e20 } } }),
    JSON.stringify({
      ...emptyState(),
      draft: {
        id: 'bad',
        lessonId: 'hello',
        index: 2,
        stage: 'reflection',
        responses: {},
        reflection: '',
      },
    }),
  ])('rejects corrupt, unsupported or impossible state %#', (raw) => {
    expect(() => parseBackup(raw)).toThrow()
  })
  it('rejects duplicate completion ids in a backup', () => {
    const state = completeLesson(completedDraft(), now)
    state.completions.push(state.completions[0])
    expect(() => parseBackup(JSON.stringify(state))).toThrow()
  })
})

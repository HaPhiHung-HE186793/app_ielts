import { findLesson } from '../content/lessons'
import type { StudyState } from '../data/schema'
import { initialReview, isCorrect, scheduleReview } from './learning'

export function startLesson(state: StudyState, lessonId: string, id: string): StudyState {
  if (!findLesson(lessonId)) return state
  if (state.draft?.lessonId === lessonId) return state
  return {
    ...state,
    draft: {
      id,
      lessonId,
      index: 0,
      stage: 'intro',
      responses: {},
      reflection: '',
      pendingAnswer: '',
    },
  }
}

export function submitAnswer(state: StudyState, answer: string): StudyState {
  const draft = state.draft
  if (!draft || draft.stage !== 'exercise' || !answer.trim() || answer.length > 500) return state
  const exercise = findLesson(draft.lessonId)!.exercises[draft.index]
  const response = draft.responses[exercise.id] ?? {
    submissions: [],
    hintUsed: false,
    passed: false,
  }
  if (response.passed || response.submissions.length >= 100) return state
  return {
    ...state,
    draft: {
      ...draft,
      responses: {
        ...draft.responses,
        [exercise.id]: {
          ...response,
          submissions: [...response.submissions, answer],
          passed: isCorrect(exercise, answer),
        },
      },
    },
  }
}

export function completeLesson(state: StudyState, now: number): StudyState {
  const draft = state.draft
  if (
    !draft ||
    draft.stage !== 'reflection' ||
    state.completions.some((item) => item.id === draft.id)
  )
    return state
  const lesson = findLesson(draft.lessonId)!
  if (lesson.exercises.some((exercise) => !draft.responses[exercise.id]?.passed)) return state
  const independent = lesson.exercises.filter((exercise) => {
    const response = draft.responses[exercise.id]
    return (
      !response.hintUsed &&
      response.submissions.length === 1 &&
      isCorrect(exercise, response.submissions[0])
    )
  }).length
  return {
    ...state,
    draft: null,
    completions: [
      ...state.completions,
      {
        id: draft.id,
        lessonId: draft.lessonId,
        completedAt: now,
        independent,
        reflection: draft.reflection,
      },
    ],
    reviews: {
      ...state.reviews,
      [draft.lessonId]: state.reviews[draft.lessonId] ?? initialReview(now),
    },
  }
}

export function recordReview(
  state: StudyState,
  lessonId: string,
  answer: string,
  hinted: boolean,
  id: string,
  now: number,
): StudyState {
  const lesson = findLesson(lessonId)
  const card = state.reviews[lessonId]
  if (!lesson || !card || !answer.trim() || state.reviewLog.some((item) => item.id === id))
    return state
  const correct = isCorrect(lesson.review, answer)
  const independent = correct && !hinted
  return {
    ...state,
    reviews: { ...state.reviews, [lessonId]: scheduleReview(card, independent, now) },
    reviewLog: [...state.reviewLog, { id, lessonId, reviewedAt: now, independent, correct }],
  }
}

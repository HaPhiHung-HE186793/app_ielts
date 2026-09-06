import { findLesson, lessons } from '../content/lessons'
import type { PlanItem, PlanMode, StudyPlan, StudyState } from '../data/schema'
import { isCorrect } from './learning'
import { recordReview, startLesson } from './session'

export const modeLabels: Record<PlanMode, string> = {
  '2': '2 phút',
  '5': '5 phút',
  '15': '15 phút',
  full: 'Buổi đầy đủ',
}
export const freshPractice = (): StudyPlan['practice'] => ({
  stage: 'intro',
  answer: '',
  hinted: false,
})

export function buildPlan(state: StudyState, mode: PlanMode, now: number, id: string): StudyPlan {
  const budget = mode === 'full' ? (state.profile?.dailyMinutes ?? 30) : Number(mode)
  const items: PlanItem[] = []
  const completed = new Set(state.completions.map((item) => item.lessonId))
  const remaining = lessons.filter(
    (lesson) => !completed.has(lesson.id) && lesson.id !== state.draft?.lessonId,
  )
  const candidates = state.draft ? [findLesson(state.draft.lessonId)!, ...remaining] : remaining
  const add = (kind: PlanItem['kind'], lessonId: string, minutes: number) => {
    items.push({
      id:
        kind === 'lesson' && state.draft?.lessonId === lessonId
          ? state.draft.id
          : `${id}-${items.length}`,
      kind,
      lessonId,
      minutes,
    })
  }
  if (mode === '2') add('quick', (candidates[0] ?? lessons[0]).id, 2)
  else {
    // Keep review finite after a gap; do not fill all available time with overdue cards.
    if (mode === '15' || mode === 'full') {
      Object.entries(state.reviews)
        .filter(([, card]) => card.dueAt <= now)
        .sort((a, b) => a[1].dueAt - b[1].dueAt)
        .slice(0, 3)
        .forEach(([lessonId]) => add('review', lessonId, 1))
    }
    let used = items.reduce((sum, item) => sum + item.minutes, 0)
    for (const lesson of candidates) {
      if (used + lesson.minutes > budget) break
      add('lesson', lesson.id, lesson.minutes)
      used += lesson.minutes
    }
  }
  return { id, mode, budget, createdAt: now, items, cursor: 0, practice: freshPractice() }
}

export function itemResult(state: StudyState, item: PlanItem) {
  const log =
    item.kind === 'lesson'
      ? state.completions
      : item.kind === 'review'
        ? state.reviewLog
        : state.quickLog
  return log.find((entry) => entry.id === item.id && entry.lessonId === item.lessonId)
}

export function advancePlan(state: StudyState): StudyState {
  const plan = state.plan
  const item = plan?.items[plan.cursor]
  if (!plan || !item || !itemResult(state, item)) return state
  return { ...state, plan: { ...plan, cursor: plan.cursor + 1, practice: freshPractice() } }
}

export function beginPlannedLesson(state: StudyState): StudyState {
  const plan = state.plan
  const item = plan?.items[plan.cursor]
  if (!plan || !item || item.kind !== 'lesson' || itemResult(state, item)) return state
  // UI resolves replacing another draft explicitly before calling this function.
  const next = startLesson(state, item.lessonId, item.id)
  const items = plan.items.map((entry, index) =>
    index === plan.cursor ? { ...entry, id: next.draft!.id } : entry,
  )
  return { ...next, plan: { ...plan, items } }
}

export function submitPlannedPractice(state: StudyState, now: number): StudyState {
  const plan = state.plan
  const item = plan?.items[plan.cursor]
  if (
    !plan ||
    !item ||
    item.kind === 'lesson' ||
    itemResult(state, item) ||
    !plan.practice.answer.trim()
  )
    return state
  const { answer, hinted } = plan.practice
  if (item.kind === 'review')
    return recordReview(state, item.lessonId, answer, hinted, item.id, now)
  if (plan.practice.stage !== 'recall') return state
  const correct = isCorrect(findLesson(item.lessonId)!.exercises[1], answer)
  return {
    ...state,
    quickLog: [
      ...state.quickLog,
      {
        id: item.id,
        lessonId: item.lessonId,
        completedAt: now,
        correct,
        independent: correct && !hinted,
      },
    ],
  }
}

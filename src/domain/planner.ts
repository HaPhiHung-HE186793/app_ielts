import { findLesson } from '../content/lessons'
import type { PlanItem, PlanMode, PlanPace, StudyPlan, StudyState } from '../data/schema'
import { quickRecommendation, recommendLessons } from './adaptation'
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

export function buildPlan(
  state: StudyState,
  mode: PlanMode,
  now: number,
  id: string,
  pace: PlanPace = 'normal',
): StudyPlan {
  const budget = mode === 'full' ? (state.profile?.dailyMinutes ?? 30) : Number(mode)
  const items: PlanItem[] = []
  const add = (kind: PlanItem['kind'], lessonId: string, minutes: number, reason: string) => {
    items.push({
      id:
        kind === 'lesson' && state.draft?.lessonId === lessonId
          ? state.draft.id
          : `${id}-${items.length}`,
      kind,
      lessonId,
      minutes,
      reason,
    })
  }
  if (mode === '2') {
    const choice = quickRecommendation(state, now, pace)
    add('quick', choice.lessonId, 2, choice.reason)
  } else {
    // Keep review finite after a gap; do not fill all available time with overdue cards.
    if (mode === '15' || mode === 'full') {
      Object.entries(state.reviews)
        .filter(([, card]) => card.dueAt <= now)
        .sort((a, b) => a[1].dueAt - b[1].dueAt)
        .slice(0, pace === 'normal' ? 3 : pace === 'returning' ? 2 : 1)
        .forEach(([lessonId]) =>
          add('review', lessonId, 1, 'Đã đến hạn theo lịch ôn; phần còn lại để dành phiên khác.'),
        )
    }
    let used = items.reduce((sum, item) => sum + item.minutes, 0)
    const candidates = recommendLessons(
      state,
      now,
      pace,
      pace === 'normal' ? 10 : 1,
      items.map((item) => item.lessonId),
    )
    for (const choice of candidates) {
      const lesson = findLesson(choice.lessonId)!
      if (items.length >= 10 || used + lesson.minutes > budget) break
      add('lesson', lesson.id, lesson.minutes, choice.reason)
      used += lesson.minutes
    }
  }
  return {
    id,
    mode,
    budget,
    createdAt: now,
    items,
    cursor: 0,
    practice: freshPractice(),
    adaptation: { rule: 1, pace },
  }
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

export function archivePlan(state: StudyState, now: number): StudyState {
  const plan = state.plan
  if (!plan?.items.length || state.planHistory.some((entry) => entry.id === plan.id)) return state
  const items = plan.items.map((item) => ({ ...item, completed: !!itemResult(state, item) }))
  return {
    ...state,
    planHistory: [
      ...state.planHistory,
      {
        id: plan.id,
        mode: plan.mode,
        budget: plan.budget,
        createdAt: plan.createdAt,
        endedAt: Math.max(now, plan.createdAt),
        status: items.every((item) => item.completed) ? 'completed' : 'replaced',
        ...(plan.adaptation ? { adaptation: plan.adaptation } : {}),
        items,
      },
    ],
  }
}

export function replacePlan(
  state: StudyState,
  mode: PlanMode,
  now: number,
  id: string,
  pace: PlanPace = 'normal',
): StudyState {
  if (state.plan?.id === id || state.planHistory.some((entry) => entry.id === id)) return state
  return { ...archivePlan(state, now), plan: buildPlan(state, mode, now, id, pace) }
}

export function advancePlan(state: StudyState, now = Date.now()): StudyState {
  const plan = state.plan
  const item = plan?.items[plan.cursor]
  if (!plan || !item || !itemResult(state, item)) return state
  const next = { ...state, plan: { ...plan, cursor: plan.cursor + 1, practice: freshPractice() } }
  return next.plan.cursor === plan.items.length ? archivePlan(next, now) : next
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

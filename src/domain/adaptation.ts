import { curriculum, findLesson, lessons } from '../content/lessons'
import { prerequisites } from '../content/prerequisites'
import type { PlanPace, StudyState } from '../data/schema'
import { DAY } from './learning'

export const paceLabels: Record<PlanPace, string> = {
  normal: 'Nhịp bình thường',
  tired: 'Hôm nay mệt',
  hard: 'Khó quá',
  returning: 'Quay lại sau nghỉ',
}
export const paceDescriptions: Record<PlanPace, string> = {
  normal: 'Ôn đến hạn, luyện phần còn cần hỗ trợ rồi học tiếp theo nền tảng và sở thích.',
  tired: 'Tối đa một bài và một câu ôn. Có thể chọn hai phút hoặc nghỉ ở đây.',
  hard: 'Gợi ý hai phút với câu nền tảng liên quan. Bài đang dở vẫn được giữ. Nếu chọn lâu hơn, tối đa một bài và một câu ôn.',
  returning: 'Tối đa một bài và hai câu ôn; không cần học bù tất cả hôm nay.',
}

export function returningAfterGap(state: StudyState, now: number) {
  let latest = 0
  for (const value of [
    ...state.completions.map((entry) => entry.completedAt),
    ...state.reviewLog.map((entry) => entry.reviewedAt),
    ...state.quickLog.map((entry) => entry.completedAt),
    ...state.activityLog.map((entry) => entry.recordedAt),
  ])
    if (value <= now) latest = Math.max(latest, value)
  return latest > 0 && now - latest >= 7 * DAY
}

// Latest observed answer signal, not a diagnosis of skill or long-term mastery.
export function supportNeeds(state: StudyState, now: number) {
  const signals = new Map<string, { id: string; at: number; needs: boolean }>()
  const record = (lessonId: string, id: string, at: number, needs: boolean) => {
    if (at > now) return
    const previous = signals.get(lessonId)
    if (!previous || at > previous.at || (at === previous.at && id > previous.id))
      signals.set(lessonId, { id, at, needs })
  }
  state.completions.forEach((entry) =>
    record(entry.lessonId, entry.id, entry.completedAt, entry.independent < 2),
  )
  state.reviewLog.forEach((entry) =>
    record(entry.lessonId, entry.id, entry.reviewedAt, !entry.independent),
  )
  state.quickLog.forEach((entry) =>
    record(entry.lessonId, entry.id, entry.completedAt, !entry.independent),
  )
  return [...signals]
    .filter(([, value]) => value.needs)
    .sort(
      (a, b) =>
        a[1].at - b[1].at ||
        lessons.findIndex((item) => item.id === a[0]) -
          lessons.findIndex((item) => item.id === b[0]),
    )
    .map(([id]) => id)
}

export type Recommendation = { lessonId: string; reason: string }
export function recommendLessons(
  state: StudyState,
  now: number,
  pace: PlanPace,
  limit = 10,
  reviewing: string[] = [],
): Recommendation[] {
  const result: Recommendation[] = []
  const completed = new Set(state.completions.map((entry) => entry.lessonId))
  const add = (lessonId: string, reason: string) => {
    result.push({ lessonId, reason })
    completed.add(lessonId)
  }
  if (state.draft) add(state.draft.lessonId, 'Tiếp tục bài đang dở, giữ các câu đã trả lời.')
  const currentWeek = curriculum.find((group) =>
    group.lessons.some((lesson) => !completed.has(lesson.id)),
  )
  const need = supportNeeds(state, now).find(
    (id) =>
      id !== state.draft?.lessonId &&
      !reviewing.includes(id) &&
      (completed.has(id) ||
        (currentWeek?.lessons.some((lesson) => lesson.id === id) &&
          prerequisites[id].every((prior) => completed.has(prior)))),
  )
  if (need && result.length < limit)
    add(need, 'Lượt gần nhất còn cần hỗ trợ; thử lại bài trước khi học thêm.')
  while (result.length < limit) {
    const week = curriculum.find((group) =>
      group.lessons.some((lesson) => !completed.has(lesson.id)),
    )
    if (!week) break
    const available = week.lessons.filter(
      (lesson) =>
        !completed.has(lesson.id) && prerequisites[lesson.id].every((id) => completed.has(id)),
    )
    if (!available.length) break
    // Every other new slot keeps catalogue order; interests choose only among the next three ready units.
    const interestSlot = (state.completions.length + result.length) % 2 === 1
    const preferred = interestSlot
      ? available.slice(0, 3).find((lesson) => state.profile?.interests.includes(lesson.topic))
      : undefined
    const chosen = preferred ?? available[0]
    add(
      chosen.id,
      preferred && preferred.id !== available[0].id
        ? 'Hợp sở thích, trong nhóm bài đã có phần học trước.'
        : chosen.checkpoint
          ? 'Nhìn lại tuần sau các bài đã học hoặc được xếp trước trong phiên.'
          : 'Bước nền tảng tiếp theo; các bài cần trước đã học hoặc được xếp trước trong phiên.',
    )
  }
  if (!result.length && pace !== 'normal') {
    const familiar = lessons.find(
      (lesson) =>
        !lesson.checkpoint &&
        !reviewing.includes(lesson.id) &&
        state.completions.some((entry) => entry.lessonId === lesson.id && entry.completedAt <= now),
    )
    if (familiar) add(familiar.id, 'Gặp lại một bài nền tảng quen thuộc để bắt đầu nhẹ nhàng.')
  }
  return result.slice(0, limit)
}

export function quickRecommendation(
  state: StudyState,
  now: number,
  pace: PlanPace,
): Recommendation {
  const target =
    state.draft?.lessonId ?? recommendLessons(state, now, pace, 1)[0]?.lessonId ?? lessons[0].id
  if (pace === 'hard') {
    let previous = prerequisites[target][0]
    const completed = new Set(state.completions.map((entry) => entry.lessonId))
    while (previous && !completed.has(previous) && prerequisites[previous].length)
      previous = prerequisites[previous][0]
    if (previous)
      return {
        lessonId: previous,
        reason: `Thử câu nền tảng trước bài “${findLesson(target)!.title}”; bài dở vẫn giữ nguyên.`,
      }
  }
  if (pace === 'returning' || pace === 'tired') {
    const known = lessons.find((lesson) =>
      state.completions.some((entry) => entry.lessonId === lesson.id),
    )
    if (known)
      return {
        lessonId: known.id,
        reason: 'Một câu đã gặp để khởi động nhẹ; chưa tính là hoàn thành bài.',
      }
  }
  return {
    lessonId: target,
    reason: 'Thử nhớ một câu; kết quả khởi động tách khỏi bài học và lịch ôn.',
  }
}

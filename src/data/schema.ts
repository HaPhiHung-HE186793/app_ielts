import { z } from 'zod'
import { findLesson } from '../content/lessons'
import { isCorrect } from '../domain/learning'

const lessonId = z
  .string()
  .refine((id) => !!findLesson(id), 'Bài học không tồn tại trong phiên bản này')
const timestamp = z.number().finite().nonnegative().max(8_640_000_000_000_000)
const response = z.object({
  submissions: z.array(z.string().max(500)).max(100),
  hintUsed: z.boolean(),
  passed: z.boolean(),
})

export const profileSchema = z.object({
  name: z.string().trim().max(40),
  dailyMinutes: z.union([
    z.literal(15),
    z.literal(30),
    z.literal(60),
    z.literal(120),
    z.literal(180),
  ]),
  exam: z.enum(['undecided', 'academic', 'general']),
  interests: z.array(z.enum(['Đời sống', 'Giải trí', 'Ăn uống', 'Học tập'])).max(4),
  goal: z.enum(['foundation', 'ielts65', 'explore']).default('explore'),
  foundation: z.enum(['starting', 'some', 'unsure']).default('unsure'),
  targetDate: z.iso.date().nullable().default(null),
})

const planItemSchema = z.object({
  id: z.string().min(1).max(120),
  kind: z.enum(['quick', 'lesson', 'review']),
  lessonId,
  minutes: z.number().int().min(1).max(5),
  reason: z.string().min(1).max(240).optional(),
})

const adaptationSchema = z.object({
  rule: z.literal(1),
  pace: z.enum(['normal', 'tired', 'hard', 'returning']),
})

const planSchema = z
  .object({
    id: z.string().min(1).max(100),
    mode: z.enum(['2', '5', '15', 'full']),
    budget: z.number().int().min(2).max(180),
    createdAt: timestamp,
    adaptation: adaptationSchema.optional(),
    items: z.array(planItemSchema).max(10),
    cursor: z.number().int().nonnegative(),
    practice: z.object({
      stage: z.enum(['intro', 'recall']),
      answer: z.string().max(500),
      hinted: z.boolean(),
    }),
  })
  .superRefine((plan, ctx) => {
    if (
      plan.cursor > plan.items.length ||
      new Set(plan.items.map((item) => item.id)).size !== plan.items.length
    )
      ctx.addIssue({ code: 'custom', message: 'Phiên học không hợp lệ' })
    if (plan.items.reduce((sum, item) => sum + item.minutes, 0) > plan.budget)
      ctx.addIssue({ code: 'custom', message: 'Phiên học vượt thời gian dự kiến' })
    const expected = { quick: 2, lesson: 5, review: 1 }
    if (plan.items.some((item) => item.minutes !== expected[item.kind]))
      ctx.addIssue({ code: 'custom', message: 'Thời lượng hoạt động không hợp lệ' })
    if (
      (plan.mode !== 'full' && plan.budget !== Number(plan.mode)) ||
      (plan.mode === 'full' && ![15, 30, 60, 120, 180].includes(plan.budget)) ||
      (plan.mode === '2' && (plan.items.length !== 1 || plan.items[0]?.kind !== 'quick')) ||
      (plan.mode !== '2' && plan.items.some((item) => item.kind === 'quick')) ||
      (plan.mode === '5' && plan.items.some((item) => item.kind !== 'lesson')) ||
      plan.items.filter((item) => item.kind === 'review').length > 3
    )
      ctx.addIssue({ code: 'custom', message: 'Hoạt động không phù hợp loại phiên' })
  })

const draftSchema = z.object({
  id: z.string().min(1).max(100),
  lessonId,
  stage: z.enum(['intro', 'exercise', 'reflection']),
  index: z.number().int().min(0).max(2),
  responses: z.record(z.string(), response),
  reflection: z.string().max(2000),
  pendingAnswer: z.string().max(500).default(''),
})

export const activityEntrySchema = z
  .object({
    id: z.string().min(1).max(150),
    attemptId: z.string().min(1).max(120),
    lessonId,
    kind: z.enum(['lesson', 'quick', 'review']),
    planId: z.string().min(1).max(100).nullable(),
    day: z.iso.date(),
    startedAt: timestamp,
    recordedAt: timestamp,
    elapsedMs: z
      .number()
      .int()
      .positive()
      .max(26 * 60 * 60 * 1000),
  })
  .refine(
    (entry) =>
      entry.recordedAt >= entry.startedAt &&
      entry.elapsedMs <= entry.recordedAt - entry.startedAt + 2000,
  )

const planHistorySchema = z
  .object({
    id: z.string().min(1).max(100),
    mode: z.enum(['2', '5', '15', 'full']),
    budget: z.number().int().min(2).max(180),
    createdAt: timestamp,
    endedAt: timestamp,
    adaptation: adaptationSchema.optional(),
    status: z.enum(['completed', 'replaced']),
    items: z
      .array(planItemSchema.extend({ completed: z.boolean() }))
      .min(1)
      .max(10),
  })
  .superRefine((entry, ctx) => {
    if (
      entry.endedAt < entry.createdAt ||
      new Set(entry.items.map((item) => item.id)).size !== entry.items.length ||
      (entry.status === 'completed' && entry.items.some((item) => !item.completed))
    )
      ctx.addIssue({ code: 'custom', message: 'Lịch sử phiên không hợp lệ' })
  })

export const stateSchema = z
  .object({
    version: z.literal(3),
    profile: profileSchema.nullable(),
    draft: draftSchema.nullable(),
    plan: planSchema.nullable(),
    activityLog: z.array(activityEntrySchema).max(50_000),
    planHistory: z.array(planHistorySchema).max(20_000),
    quickLog: z
      .array(
        z.object({
          id: z.string().min(1).max(120),
          lessonId,
          completedAt: timestamp,
          correct: z.boolean(),
          independent: z.boolean(),
        }),
      )
      .max(50_000),
    completions: z
      .array(
        z.object({
          id: z.string().min(1),
          lessonId,
          completedAt: timestamp,
          independent: z.number().int().min(0).max(3),
          reflection: z.string().max(2000),
        }),
      )
      .max(20_000),
    reviews: z.record(
      lessonId,
      z
        .object({
          dueAt: timestamp,
          step: z.number().int().min(0).max(4),
          attempts: z.number().int().nonnegative(),
          successes: z.number().int().nonnegative(),
        })
        .refine((card) => card.successes <= card.attempts),
    ),
    reviewLog: z
      .array(
        z.object({
          id: z.string().min(1),
          lessonId,
          reviewedAt: timestamp,
          independent: z.boolean(),
          correct: z.boolean(),
        }),
      )
      .max(50_000),
  })
  .superRefine((state, ctx) => {
    const ids = state.completions.map((item) => item.id)
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: 'custom', message: 'Trùng lượt hoàn thành' })
    const reviewIds = state.reviewLog.map((item) => item.id)
    if (new Set(reviewIds).size !== reviewIds.length)
      ctx.addIssue({ code: 'custom', message: 'Trùng lượt ôn' })
    const quickIds = state.quickLog.map((item) => item.id)
    if (new Set(quickIds).size !== quickIds.length)
      ctx.addIssue({ code: 'custom', message: 'Trùng lượt khởi động' })
    for (const entries of [state.activityLog, state.planHistory]) {
      if (new Set(entries.map((entry) => entry.id)).size !== entries.length)
        ctx.addIssue({ code: 'custom', message: 'Trùng bản ghi tiến bộ' })
    }
    for (const session of state.planHistory) {
      for (const item of session.items.filter((item) => item.completed)) {
        const logs =
          item.kind === 'lesson'
            ? state.completions
            : item.kind === 'review'
              ? state.reviewLog
              : state.quickLog
        if (!logs.some((log) => log.id === item.id && log.lessonId === item.lessonId))
          ctx.addIssue({ code: 'custom', message: 'Lịch sử phiên thiếu kết quả thực' })
      }
    }
    for (const item of [...state.reviewLog, ...state.quickLog]) {
      if (item.independent && !item.correct)
        ctx.addIssue({ code: 'custom', message: 'Kết quả độc lập không hợp lệ' })
    }
    if (state.plan) {
      for (const [index, item] of state.plan.items.entries()) {
        const logs =
          item.kind === 'lesson'
            ? state.completions
            : item.kind === 'review'
              ? state.reviewLog
              : state.quickLog
        if (
          index < state.plan.cursor &&
          !logs.some((log) => log.id === item.id && log.lessonId === item.lessonId)
        )
          ctx.addIssue({ code: 'custom', message: 'Thiếu kết quả của bước đã qua' })
        if (item.kind === 'review' && !state.reviews[item.lessonId])
          ctx.addIssue({ code: 'custom', message: 'Thiếu mục ôn trong phiên' })
      }
    }
    if (state.draft) {
      const lesson = findLesson(state.draft.lessonId)!
      for (const [id, answer] of Object.entries(state.draft.responses)) {
        const exercise = lesson.exercises.find((item) => item.id === id)
        if (!exercise || (answer.passed && !isCorrect(exercise, answer.submissions.at(-1) ?? '')))
          ctx.addIssue({ code: 'custom', message: 'Bài dở không hợp lệ' })
      }
      const required =
        state.draft.stage === 'reflection'
          ? lesson.exercises
          : lesson.exercises.slice(0, state.draft.index)
      if (required.some((exercise) => !state.draft?.responses[exercise.id]?.passed))
        ctx.addIssue({ code: 'custom', message: 'Thiếu câu trả lời trước bước hiện tại' })
    }
  })

export type StudyState = z.infer<typeof stateSchema>
export type Profile = z.infer<typeof profileSchema>
export type Draft = NonNullable<StudyState['draft']>
export type StudyPlan = NonNullable<StudyState['plan']>
export type PlanItem = StudyPlan['items'][number]
export type PlanMode = StudyPlan['mode']
export type PlanPace = z.infer<typeof adaptationSchema>['pace']
export type ActivityEntry = z.infer<typeof activityEntrySchema>
export type ActivityTarget = Pick<ActivityEntry, 'attemptId' | 'lessonId' | 'kind' | 'planId'>
export type PlanHistoryEntry = z.infer<typeof planHistorySchema>
export const emptyState = (): StudyState => ({
  version: 3,
  profile: null,
  draft: null,
  plan: null,
  activityLog: [],
  planHistory: [],
  quickLog: [],
  completions: [],
  reviews: {},
  reviewLog: [],
})

export function parseBackup(raw: string): StudyState {
  if (raw.length > 5_000_000) throw new Error('Bản sao vượt quá 5 MB. Hãy chọn bản sao nhỏ hơn.')
  const data: unknown = JSON.parse(raw)
  // Keep the storage key stable. Validate migrated data before any write occurs.
  if (typeof data === 'object' && data !== null && 'version' in data) {
    if (data.version === 1)
      return stateSchema.parse({
        ...data,
        version: 3,
        plan: null,
        quickLog: [],
        activityLog: [],
        planHistory: [],
      })
    if (data.version === 2)
      return stateSchema.parse({ ...data, version: 3, activityLog: [], planHistory: [] })
  }
  return stateSchema.parse(data)
}

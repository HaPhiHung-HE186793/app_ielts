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

export const stateSchema = z
  .object({
    version: z.literal(1),
    profile: profileSchema.nullable(),
    draft: draftSchema.nullable(),
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
export const emptyState = (): StudyState => ({
  version: 1,
  profile: null,
  draft: null,
  completions: [],
  reviews: {},
  reviewLog: [],
})

export function parseBackup(raw: string): StudyState {
  if (raw.length > 5_000_000) throw new Error('Bản sao vượt quá 5 MB. Hãy chọn bản sao nhỏ hơn.')
  return stateSchema.parse(JSON.parse(raw))
}

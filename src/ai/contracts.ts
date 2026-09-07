import { z } from 'zod'

export const AI_CONSENT_VERSION = '2026-09-07'
export const AI_PROMPT_VERSION = 'foundation-hint-v1'
export const aiRequestSchema = z.strictObject({
  requestId: z.uuid(),
  ownerId: z.uuid(),
  lessonId: z.string().min(1).max(50),
  text: z.string().trim().min(1).max(600),
  consentVersion: z.literal(AI_CONSENT_VERSION),
})
export type AiRequest = z.infer<typeof aiRequestSchema>
export const feedbackSchema = z.strictObject({
  verdict: z.enum(['on-track', 'try-again', 'needs-context']),
  summary: z.string().min(1).max(400),
  strength: z
    .strictObject({ quote: z.string().min(1).max(160), reason: z.string().min(1).max(240) })
    .nullable(),
  improvement: z
    .strictObject({ quote: z.string().min(1).max(160), hint: z.string().min(1).max(350) })
    .nullable(),
  nextStep: z.string().min(1).max(300),
})
export type AiFeedback = z.infer<typeof feedbackSchema>
export const aiResponseSchema = z.strictObject({
  requestId: z.uuid(),
  ownerId: z.uuid(),
  source: z.enum(['ai', 'test-fixture']),
  provider: z.string().min(1).max(60),
  model: z.string().min(1).max(100),
  promptVersion: z.literal(AI_PROMPT_VERSION),
  reviewedAt: z.iso.datetime(),
  feedback: feedbackSchema,
})
export type AiResponse = z.infer<typeof aiResponseSchema>
export const aiStatusSchema = z.strictObject({
  ownerId: z.uuid(),
  available: z.boolean(),
  dailyLimit: z.number().int().nonnegative(),
  provider: z.string().nullable(),
  retentionHours: z.literal(24),
})
export const aiErrorMessages: Record<string, string> = {
  unavailable:
    'Gia sư AI chưa được bật hoặc chưa có ngân sách. Câu của bạn vẫn được lưu; bạn có thể hoàn thành bài như thường.',
  unauthorized:
    'Cần đăng nhập lại để nhờ AI gợi ý. Câu đang viết vẫn được giữ trong phần học của bạn.',
  invalid: 'Chỉ gửi tối đa 600 ký tự từ bài hiện tại và chọn đồng ý gửi trước khi tiếp tục.',
  quota:
    'Bạn đã dùng hết lượt thử hôm nay hoặc vừa gửi quá gần nhau. Nghỉ một chút rồi quay lại nhé.',
  budget: 'Gia sư AI đã hết ngân sách thử nghiệm. Bạn vẫn có thể học và lưu câu của mình.',
  busy: 'Gia sư AI đang xử lý yêu cầu khác. Hãy thử kiểm tra lại sau một chút.',
  pending:
    'Yêu cầu này đang được xử lý. Kiểm tra lại để nhận kết quả; app không gửi thêm một lượt AI.',
  used: 'Lượt này không còn kết quả để tải lại. Câu vẫn được giữ; chỉ chọn gửi lượt mới nếu bạn muốn thử lại.',
  conflict:
    'Nội dung của lượt gửi đã thay đổi. Chọn gửi lượt mới nếu muốn nhận gợi ý cho câu hiện tại.',
  timeout: 'AI chưa phản hồi kịp. Câu vẫn được giữ. Kiểm tra lại lượt này trước khi gửi lượt mới.',
  invalid_feedback:
    'Phản hồi chưa vượt qua kiểm tra của app nên chưa được hiển thị. Câu của bạn vẫn được giữ.',
  provider_error: 'Dịch vụ AI chưa trả được gợi ý. Câu vẫn được giữ; bạn có thể tiếp tục bài học.',
  network: 'Chưa kết nối được với gia sư AI. Câu vẫn được giữ; kiểm tra lại khi có mạng.',
}
export function isGroundedFeedback(feedback: AiFeedback, input: string) {
  return (
    [feedback.strength, feedback.improvement].every(
      (item) => !item || input.includes(item.quote),
    ) &&
    !(feedback.verdict === 'on-track' && feedback.improvement !== null) &&
    !(feedback.verdict === 'try-again' && feedback.improvement === null)
  )
}

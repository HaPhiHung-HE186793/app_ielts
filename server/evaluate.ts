import { mkdir, writeFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import { localBackend } from '../scripts/local-backend.js'
import { lessons } from '../src/content/lessons.ts'
import {
  AI_CONSENT_VERSION,
  aiRequestSchema,
  aiResponseSchema,
  aiStatusSchema,
} from '../src/ai/contracts.ts'
import { evaluationCases } from './ai/evaluation.ts'
import { MODEL, MAX_PROVIDER_BODY_BYTES, readAiConfig } from './ai/config.ts'
import { buildProviderRequest } from './ai/provider.ts'

for (const sample of evaluationCases) {
  const lesson = lessons.find((item) => item.id === sample.lessonId)
  if (
    !lesson ||
    Buffer.byteLength(JSON.stringify(buildProviderRequest(lesson, sample.text))) >
      MAX_PROVIDER_BODY_BYTES
  )
    throw new Error('Tập đánh giá không khớp học liệu hoặc giới hạn request.')
  aiRequestSchema.parse({
    requestId: crypto.randomUUID(),
    ownerId: crypto.randomUUID(),
    lessonId: sample.lessonId,
    text: sample.text,
    consentVersion: AI_CONSENT_VERSION,
  })
}
const args = process.argv.slice(2)
if (args.length && (args.length !== 1 || args[0] !== '--live'))
  throw new Error('Chỉ hỗ trợ --live hoặc không có tham số.')
if (!args.length) {
  console.log(
    `Đã kiểm tra ${evaluationCases.length} mẫu gốc và giới hạn request. Chưa gọi AI hoặc đánh giá chất lượng. Xem docs/AI_EVALUATION.md.`,
  )
} else {
  const config = readAiConfig(process.env)
  if (!config.enabled)
    throw new Error('AI thật đang tắt. Cần ngân sách và cấu hình máy chủ trước khi đánh giá thật.')
  const local = localBackend()
  const admin = createClient(local.url, local.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const client = createClient(local.url, local.publicKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const email = `moi-ngay-${crypto.randomUUID()}@example.test`,
    password = `Eval-${crypto.randomUUID()}-9!`
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (created.error || !created.data.user)
    throw new Error('Chưa tạo được tài khoản đánh giá local.')
  const ownerId = created.data.user.id
  const report = {
    model: MODEL,
    startedAt: new Date().toISOString(),
    qualityReviewed: false,
    results: [] as unknown[],
  }
  const file = `.local/ai-eval-${crypto.randomUUID()}.json`
  try {
    await mkdir('.local', { recursive: true })
    const login = await client.auth.signInWithPassword({ email, password })
    if (login.error || !login.data.session)
      throw new Error('Chưa đăng nhập được tài khoản đánh giá local.')
    const headers = {
      Authorization: `Bearer ${login.data.session.access_token}`,
      'Content-Type': 'application/json',
    }
    const status = aiStatusSchema.safeParse(
      await (
        await fetch('http://127.0.0.1:8787/api/ai/status', {
          headers,
          signal: AbortSignal.timeout(10_000),
        })
      ).json(),
    )
    if (
      !status.success ||
      status.data.ownerId !== ownerId ||
      !status.data.available ||
      status.data.provider !== 'OpenAI'
    )
      throw new Error('Máy chủ AI local chưa sẵn sàng; không thay đổi ngân sách tự động.')
    await writeFile(file, JSON.stringify(report, null, 2))
    for (const sample of evaluationCases) {
      const requestId = crypto.randomUUID(),
        start = performance.now()
      let feedback: unknown = null,
        error: string | null = null
      try {
        const response = await fetch('http://127.0.0.1:8787/api/ai/feedback', {
          method: 'POST',
          headers,
          signal: AbortSignal.timeout(35_000),
          body: JSON.stringify({
            requestId,
            ownerId,
            lessonId: sample.lessonId,
            text: sample.text,
            consentVersion: AI_CONSENT_VERSION,
          }),
        })
        const body: unknown = await response.json()
        const parsed = aiResponseSchema.safeParse(body)
        if (
          !response.ok ||
          !parsed.success ||
          parsed.data.source !== 'ai' ||
          parsed.data.ownerId !== ownerId ||
          parsed.data.requestId !== requestId ||
          parsed.data.model !== MODEL
        )
          error = `http_${response.status}_or_invalid_response`
        else feedback = parsed.data
      } catch {
        error = 'network_or_timeout'
      }
      const elapsedMs = Math.round(performance.now() - start)
      const receipt = await client
        .from('ai_requests')
        .select('status,accounted_micro_usd')
        .eq('request_id', requestId)
        .maybeSingle()
      report.results.push({
        ...sample,
        requestId,
        elapsedMs,
        feedback,
        error,
        receipt: receipt.error ? null : receipt.data,
        humanReview: null,
      })
      await writeFile(file, JSON.stringify(report, null, 2))
      console.log(
        `${sample.id}: ${error ?? 'đã nhận phản hồi; chưa duyệt chất lượng'}, ${elapsedMs} ms`,
      )
      // Stop after any failure; never retry or reset the cumulative server budget.
      if (error) break
      if (sample !== evaluationCases.at(-1))
        await new Promise((resolve) => setTimeout(resolve, 21_000))
    }
    console.log(`Báo cáo chỉ có dữ liệu thử: ${file}. Cần người duyệt theo docs/AI_EVALUATION.md.`)
  } finally {
    const removed = await admin.auth.admin.deleteUser(ownerId)
    if (removed.error)
      console.error(
        'Chưa dọn được tài khoản do bộ đánh giá tạo; kiểm tra local Auth trước lần chạy tiếp.',
      )
  }
}

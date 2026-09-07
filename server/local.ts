import { createClient } from '@supabase/supabase-js'
import { localBackend } from '../scripts/local-backend.js'
import { readAiConfig } from './ai/config.ts'
import { openAiProvider } from './ai/provider.ts'
import { createAiServer } from './ai/http.ts'

export const LOCAL_AI_BUDGET = '00000000-0000-4000-8000-000000000001'
const local = localBackend(),
  config = readAiConfig(process.env)
const admin = createClient(local.url, local.secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(8000) }) },
})
const configured = await admin.rpc('configure_ai_budget', {
  p_id: LOCAL_AI_BUDGET,
  p_enabled: config.enabled,
  p_limit: config.totalBudgetMicroUsd,
})
if (configured.error)
  throw new Error(
    'Chưa cấu hình được hạn mức AI local. Kiểm tra Docker và db:migrate; không in khóa vào log.',
  )
async function purge() {
  const result = await admin.rpc('purge_ai_responses', { p_budget: LOCAL_AI_BUDGET })
  if (result.error) console.error('Chưa dọn được phản hồi AI quá hạn. Kiểm tra backend local.')
}
await purge()
const timer = setInterval(() => {
  void purge().catch(() => {})
}, 60_000)
const server = createAiServer({
  admin,
  budgetId: LOCAL_AI_BUDGET,
  provider: config.enabled ? openAiProvider(config.apiKey) : null,
  origins: [
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
    'http://127.0.0.1:4174',
    'http://127.0.0.1:4175',
  ],
})
server.on('error', () => {
  console.error('Chưa mở được máy chủ AI local ở cổng 8787. Kiểm tra tiến trình đang chạy.')
  clearInterval(timer)
  process.exitCode = 1
})
server.listen(8787, '127.0.0.1', () =>
  console.log(
    config.enabled
      ? 'Máy chủ AI local đã bật với hạn mức đã cấu hình.'
      : 'Máy chủ AI local đang chạy; gọi AI thật đang tắt. Bài học vẫn dùng bình thường.',
  ),
)
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    clearInterval(timer)
    server.close()
    server.closeAllConnections()
  })

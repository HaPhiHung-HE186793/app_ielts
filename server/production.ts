import { createClient } from '@supabase/supabase-js'
import { createAiServer } from './ai/http.ts'
import { openAiProvider } from './ai/provider.ts'
import { HOSTED_AI_BUDGET, readDeploymentConfig } from './deployment-config.ts'

// Render entrypoint: no Docker CLI, local .env file, or persistent filesystem required.
async function start() {
  const config = readDeploymentConfig(process.env)
  const admin = createClient(config.url, config.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(8000) }),
    },
  })
  const configured = await admin.rpc('configure_ai_budget', {
    p_id: HOSTED_AI_BUDGET,
    p_enabled: config.ai.enabled,
    p_limit: config.ai.totalBudgetMicroUsd,
  })
  if (configured.error)
    throw new Error(
      'Chưa kết nối được DB/RPC. Kiểm tra SUPABASE_URL, secret key và tám migration trước khi chạy Render.',
    )
  let purging = false
  async function purge() {
    if (purging) return
    purging = true
    try {
      const result = await admin.rpc('purge_ai_responses', { p_budget: HOSTED_AI_BUDGET })
      if (result.error) console.error('Chưa dọn được phản hồi quá hạn; kiểm tra kết nối DB.')
    } catch {
      console.error('Chưa kết nối được dịch vụ để dọn phản hồi quá hạn.')
    } finally {
      purging = false
    }
  }
  await purge()
  const timer = setInterval(() => {
    void purge()
  }, 60_000)
  const server = createAiServer({
    admin,
    budgetId: HOSTED_AI_BUDGET,
    provider: config.ai.enabled ? openAiProvider(config.ai.apiKey) : null,
    origins: config.origins,
  })
  server.on('error', () => {
    clearInterval(timer)
    console.error('Không mở được máy chủ HTTP. Kiểm tra PORT trên Render.')
    process.exitCode = 1
  })
  server.listen(config.port, '0.0.0.0', () =>
    console.log(
      `Backend sẵn sàng; AI ${config.ai.enabled ? 'bật với hạn mức' : 'tắt'}, ${config.origins.length} origin được cho phép.`,
    ),
  )
  for (const signal of ['SIGTERM', 'SIGINT'] as const)
    process.once(signal, () => {
      clearInterval(timer)
      server.close()
      // Render can stop the process; pending provider reservations remain accounted in DB.
      server.closeAllConnections()
    })
}

void start().catch((error: unknown) => {
  // Only our validation messages are displayed; SDK/network errors may contain credentials.
  console.error(
    error instanceof Error &&
      /^(SUPABASE_|APP_ORIGINS|PORT |Ngân sách|AI_ENABLED|Chưa có API key|Chưa kết nối được DB)/.test(
        error.message,
      )
      ? error.message
      : 'Backend chưa khởi động được. Kiểm tra cấu hình Render và migration Supabase; không đăng khóa vào log.',
  )
  process.exitCode = 1
})

export const MODEL = 'gpt-4.1-mini-2025-04-14'
export const RESERVATION_MICRO_USD = 10_000 // $0.01 reserved before each attempt; unknown outcomes keep it.
export const MAX_OUTPUT_TOKENS = 1000
export const MAX_PROVIDER_BODY_BYTES = 12_000
export const DAILY_LIMIT = 10
export type AiConfig = { apiKey: string; enabled: boolean; totalBudgetMicroUsd: number }
export function readAiConfig(env: Record<string, string | undefined>): AiConfig {
  const budget = env.AI_TOTAL_BUDGET_USD ?? '0'
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(budget) || Number(budget) > 10)
    throw new Error('Ngân sách thử cần từ 0 đến 10 USD, tối đa hai chữ số thập phân.')
  if (env.AI_ENABLED && !['true', 'false'].includes(env.AI_ENABLED))
    throw new Error('AI_ENABLED chỉ nhận true hoặc false.')
  const apiKey = env.OPENAI_API_KEY?.trim() ?? ''
  const enabled = env.AI_ENABLED === 'true'
  if (enabled && (!apiKey || Number(budget) === 0))
    throw new Error(
      'Chưa có API key hoặc ngân sách để bật AI. Giữ AI_ENABLED=false để tiếp tục học.',
    )
  return { apiKey, enabled, totalBudgetMicroUsd: Math.round(Number(budget) * 1_000_000) }
}

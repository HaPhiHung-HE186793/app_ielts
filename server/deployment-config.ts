import { readAiConfig } from './ai/config.ts'

export const HOSTED_AI_BUDGET = '00000000-0000-4000-8000-000000000002'

export function readDeploymentConfig(env: Record<string, string | undefined>) {
  const url = env.SUPABASE_URL?.trim() ?? ''
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))
    throw new Error('SUPABASE_URL cần dạng https://<project>.supabase.co, không có dấu / cuối.')
  const secretKey = env.SUPABASE_SECRET_KEY?.trim() ?? ''
  if (!/^sb_secret_[A-Za-z0-9_-]{16,}$/.test(secretKey))
    throw new Error('SUPABASE_SECRET_KEY phải là secret key máy chủ, không dùng publishable key.')
  const origins = (env.APP_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  for (const origin of origins) {
    let valid = false
    try {
      const parsed = new URL(origin)
      valid =
        parsed.protocol === 'https:' &&
        parsed.origin === origin &&
        parsed.hostname.includes('.') &&
        !parsed.hostname.includes('*') &&
        !['127.0.0.1', '0.0.0.0'].includes(parsed.hostname)
    } catch {
      /* Report the field, never the supplied value. */
    }
    if (!valid)
      throw new Error(
        'APP_ORIGINS chỉ nhận HTTPS origin chính xác, cách nhau bằng dấu phẩy, không wildcard/path.',
      )
  }
  const port = env.PORT ?? '10000'
  if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535)
    throw new Error('PORT cần là số cổng từ 1 đến 65535.')
  return { url, secretKey, origins, port: Number(port), ai: readAiConfig(env) }
}

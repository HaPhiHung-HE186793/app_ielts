import { neonAuthUrl } from '../../src/services/neon-config.ts'

export function readNeonConfig(env: Record<string, string | undefined>) {
  const databaseUrl = env.DATABASE_URL?.trim() ?? ''
  try {
    const url = new URL(databaseUrl)
    if (
      !['postgres:', 'postgresql:'].includes(url.protocol) ||
      url.username !== 'moi_ngay_runtime' ||
      !url.password ||
      !/^[a-z0-9.-]+\.neon\.tech$/.test(url.hostname) ||
      (url.port && url.port !== '5432') ||
      !/^\/[a-zA-Z0-9_-]+$/.test(url.pathname) ||
      url.hash ||
      !['require', 'verify-full'].includes(url.searchParams.get('sslmode') ?? '') ||
      [...url.searchParams.keys()].some((key) => !['sslmode', 'channel_binding'].includes(key)) ||
      (url.searchParams.has('channel_binding') &&
        url.searchParams.get('channel_binding') !== 'require')
    )
      throw new Error()
  } catch {
    throw new Error(
      'DATABASE_URL cần chuỗi Neon PostgreSQL có TLS, role moi_ngay_runtime; giá trị không được ghi vào log.',
    )
  }
  const authUrl = neonAuthUrl(env.NEON_AUTH_BASE_URL ?? '')
  const origins = (env.APP_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  for (const origin of origins) {
    try {
      const url = new URL(origin)
      if (
        url.origin !== origin ||
        url.protocol !== 'https:' ||
        !url.hostname.includes('.') ||
        url.hostname.includes('*') ||
        ['127.0.0.1', '0.0.0.0'].includes(url.hostname)
      )
        throw new Error()
    } catch {
      throw new Error('APP_ORIGINS cần HTTPS origin chính xác, không wildcard hoặc path.')
    }
  }
  const port = Number(env.PORT ?? 10000)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT không hợp lệ.')
  // Paid AI remains disabled for this deployment until Neon budget/provider integration is verified.
  if (env.AI_ENABLED && env.AI_ENABLED !== 'false')
    throw new Error('Bản Neon hiện cần AI_ENABLED=false.')
  if (env.AI_TOTAL_BUDGET_USD && env.AI_TOTAL_BUDGET_USD !== '0')
    throw new Error('Bản Neon hiện cần AI_TOTAL_BUDGET_USD=0.')
  return { databaseUrl, authUrl, origins, port }
}

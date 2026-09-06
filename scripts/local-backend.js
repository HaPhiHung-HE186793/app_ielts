import { execFileSync } from 'node:child_process'

export function localBackend() {
  let status
  try {
    status = JSON.parse(
      execFileSync(
        process.execPath,
        ['node_modules/supabase/dist/supabase.js', 'status', '-o', 'json'],
        {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
          env: { ...process.env, SUPABASE_TELEMETRY_DISABLED: '1' },
        },
      ),
    )
  } catch {
    throw new Error(
      'Supabase local chưa chạy. Dùng npm run db:start trước; không dùng cấu hình cloud cho bộ test này.',
    )
  }
  if (
    status.API_URL !== 'http://127.0.0.1:54321' ||
    status.MAILPIT_URL !== 'http://127.0.0.1:54324' ||
    !status.PUBLISHABLE_KEY?.startsWith('sb_publishable_') ||
    !status.SECRET_KEY?.startsWith('sb_secret_')
  )
    throw new Error('Bộ test chỉ cho phép Supabase local ở các cổng đã ghi trong config.toml.')
  return {
    url: status.API_URL,
    publicKey: status.PUBLISHABLE_KEY,
    secretKey: status.SECRET_KEY,
    mailUrl: status.MAILPIT_URL,
  }
}

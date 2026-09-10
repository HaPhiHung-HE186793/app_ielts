import type { IncomingMessage, ServerResponse } from 'node:http'

export const authPaths: Record<string, string> = {
  '/api/auth/get-session': 'GET',
  '/api/auth/token': 'GET',
  '/api/auth/email-otp/send-verification-otp': 'POST',
  '/api/auth/sign-in/email-otp': 'POST',
  '/api/auth/sign-out': 'POST',
}
// Keep cookies on the application's origin, including on Safari. Never forward unrelated cookies.
export function authCookies(header: string | undefined) {
  return (header ?? '')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => /^(?:__Secure-)?neonauth\.[a-zA-Z0-9_.-]+=/.test(s))
    .join('; ')
}
export function proxyCookie(cookie: string) {
  const name = cookie.split('=', 1)[0]
  if (!/^(?:__Secure-)?neonauth\.[a-zA-Z0-9_.-]+$/.test(name)) return null
  return (
    cookie
      .split(';')
      .map((s) => s.trim())
      .filter((s, i) => i === 0 || !/^(domain|path|samesite)=/i.test(s))
      .join('; ') + '; Path=/api/auth; SameSite=Lax'
  )
}
export async function proxyAuth(
  req: IncomingMessage,
  res: ServerResponse,
  authUrl: string,
  body?: unknown,
) {
  const path = req.url!
  const headers: Record<string, string> = { accept: 'application/json' }
  if (req.headers.origin) headers.origin = req.headers.origin
  const cookie = authCookies(req.headers.cookie)
  if (cookie) headers.cookie = cookie
  if (body !== undefined) headers['content-type'] = 'application/json'
  const upstream = await fetch(authUrl + path.slice('/api/auth'.length), {
    method: req.method,
    headers,
    redirect: 'error',
    signal: AbortSignal.timeout(12_000),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  if (!upstream.headers.get('content-type')?.includes('application/json'))
    throw new Error('Invalid auth response')
  // Auth responses are small; bound streaming bytes, not just Content-Length.
  const chunks: Uint8Array[] = []
  let bytes = 0
  const reader = upstream.body?.getReader()
  if (reader)
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        bytes += value.byteLength
        if (bytes > 64_000) throw new Error('Auth response too large')
        chunks.push(value)
      }
    } finally {
      await reader.cancel().catch(() => {})
      reader.releaseLock()
    }
  const cookies = upstream.headers
    .getSetCookie()
    .map(proxyCookie)
    .filter((s): s is string => !!s)
  res.writeHead(upstream.status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...(cookies.length ? { 'Set-Cookie': cookies } : {}),
  })
  res.end(Buffer.concat(chunks))
}

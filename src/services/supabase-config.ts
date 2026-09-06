type PublicConfig =
  | { status: 'disabled' }
  | { status: 'invalid'; reason: string }
  | { status: 'ready'; url: string; key: string }

export function readPublicConfig(urlInput = '', keyInput = ''): PublicConfig {
  const url = urlInput.trim()
  const key = keyInput.trim()
  if (!url && !key) return { status: 'disabled' }
  const invalid = {
    status: 'invalid',
    reason: 'Cần URL Supabase và khóa publishable hợp lệ; không dùng khóa bí mật.',
  } as const
  try {
    const parsed = new URL(url)
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
    if (
      (parsed.protocol !== 'https:' && !(loopback && parsed.protocol === 'http:')) ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      parsed.pathname !== '/'
    )
      return invalid
    // Deliberately support only the current public key format, never legacy service JWTs.
    if (!/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key)) return invalid
    return { status: 'ready', url: parsed.origin, key }
  } catch {
    return invalid
  }
}

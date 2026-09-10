export function neonAuthUrl(input: string): string {
  try {
    const url = new URL(input.trim())
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.port ||
      !/^[a-z0-9.-]+\.neon\.(build|tech)$/.test(url.hostname) ||
      !/^\/[a-zA-Z0-9_-]+\/auth\/?$/.test(url.pathname)
    )
      throw new Error()
    return url.href.replace(/\/$/, '')
  } catch {
    throw new Error('NEON_AUTH_BASE_URL cần URL HTTPS Auth của Neon, không phải chuỗi PostgreSQL.')
  }
}

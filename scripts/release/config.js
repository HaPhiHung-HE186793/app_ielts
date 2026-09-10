import { readPublicConfig } from '../../src/services/supabase-config.ts'
import { neonAuthUrl } from '../../src/services/neon-config.ts'

export function releaseConfig(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Cấu hình release phải là object JSON.')
  const keys =
    input.mode === 'guest'
      ? ['mode']
      : input.mode === 'neon'
        ? ['mode', 'authUrl']
        : ['mode', 'supabaseUrl', 'publishableKey']
  if (Object.keys(input).some((key) => !keys.includes(key)))
    throw new Error('Cấu hình release chứa trường không được hỗ trợ. Chỉ nhập cấu hình công khai.')
  if (input.mode === 'guest') return { mode: 'guest', supabaseUrl: '', publishableKey: '' }
  if (input.mode === 'neon')
    return {
      mode: 'neon',
      authUrl: neonAuthUrl(input.authUrl),
      supabaseUrl: '',
      publishableKey: '',
    }
  if (
    input.mode !== 'account' ||
    typeof input.supabaseUrl !== 'string' ||
    typeof input.publishableKey !== 'string'
  )
    throw new Error('Chọn guest hoặc account với URL và publishable key.')
  const config = readPublicConfig(input.supabaseUrl, input.publishableKey)
  if (config.status !== 'ready') throw new Error('Cấu hình Supabase công khai không hợp lệ.')
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url))
    throw new Error(
      'Release account hiện chỉ hỗ trợ Supabase hosted https://<project>.supabase.co.',
    )
  return { mode: 'account', supabaseUrl: config.url, publishableKey: config.key }
}

// Release builds never load .env files or expose environment variables by prefix.
export function isolatedViteConfig(config) {
  return {
    configFile: false,
    envDir: false,
    envPrefix: [],
    mode: 'production',
    base: '/',
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(config.supabaseUrl),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(config.publishableKey),
      'import.meta.env.VITE_NEON_AUTH_URL': JSON.stringify(config.authUrl ?? ''),
      'import.meta.env.VITE_AI_ENABLED': JSON.stringify('false'),
      'import.meta.env.VITE_SENTRY_DSN': JSON.stringify(config.sentryDsn ?? ''),
    },
  }
}

export function headerRules(config) {
  return [
    [
      '/*',
      {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data:",
          "media-src 'self' blob:",
          // sentryIngestUrl là URL cụ thể (không phải wildcard), chỉ có khi DSN được cấu hình
          `connect-src 'self'${config.supabaseUrl ? ' ' + config.supabaseUrl : ''}${config.sentryIngestUrl ? ' ' + config.sentryIngestUrl : ''}`,
          "object-src 'none'",
          "base-uri 'none'",
          "frame-ancestors 'none'",
          "form-action 'self'",
        ].join('; '),
      },
    ],
    ...[
      '/',
      '/index.html',
      '/404',
      '/404.html',
      '/sw.js',
      '/offline-manifest.json',
      '/manifest.webmanifest',
      '/favicon.svg',
      '/icons/*',
      '/packs/*',
    ].map((path) => [path, { 'Cache-Control': 'no-cache' }]),
    ['/sw.js', { 'Service-Worker-Allowed': '/' }],
    ['/assets/*', { 'Cache-Control': 'public, max-age=31536000, immutable' }],
  ]
}

export function renderHeaders(config) {
  return (
    headerRules(config)
      .map(([path, headers]) =>
        [path, ...Object.entries(headers).map(([key, value]) => `  ${key}: ${value}`)].join('\n'),
      )
      .join('\n\n') + '\n'
  )
}

export function headersForPath(config, path) {
  /** @type {Record<string, string>} */
  const result = {}
  for (const [pattern, headers] of headerRules(config)) {
    if (pattern === path || (pattern.endsWith('*') && path.startsWith(pattern.slice(0, -1)))) {
      for (const [key, value] of Object.entries(headers)) {
        if (key in result) throw new Error(`Header trùng: ${key}`)
        result[key] = value
      }
    }
  }
  return result
}

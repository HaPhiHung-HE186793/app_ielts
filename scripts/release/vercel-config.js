import { releaseConfig, headerRules } from './config.js'

export function readVercelConfig(env) {
  const input = {
    mode: 'neon',
    authUrl: env.VITE_NEON_AUTH_URL,
  }
  const config = releaseConfig(input)
  const backend = env.RENDER_API_URL?.trim() ?? ''
  if (!/^https:\/\/[a-z0-9-]+\.onrender\.com$/.test(backend))
    throw new Error(
      'RENDER_API_URL cần https://<service>.onrender.com, không dấu / cuối hoặc path.',
    )
  return { input, config, backend }
}

export function vercelRoutes(config, backend) {
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const headers = headerRules(config).map(([path, headers]) => ({
    src: '^' + escape(path).replaceAll('\\*', '.*') + '$',
    headers,
    continue: true,
  }))
  const privateHeaders = { 'Cache-Control': 'no-store', 'Vercel-CDN-Cache-Control': 'no-store' }
  return {
    version: 3,
    routes: [
      ...headers,
      { src: '^/api/healthz$', dest: `${backend}/healthz`, headers: privateHeaders },
      { src: '^/api/readyz$', dest: `${backend}/readyz`, headers: privateHeaders },
      { src: '^/api/data$', dest: `${backend}/api/data`, headers: privateHeaders },
      {
        src: '^/api/auth/(get-session|token|sign-out|sign-in/email-otp|email-otp/send-verification-otp)$',
        dest: `${backend}/api/auth/$1`,
        headers: privateHeaders,
      },
      { src: '^/api/ai/(status|feedback)$', dest: `${backend}/api/ai/$1`, headers: privateHeaders },
      { src: '^/api/.*$', dest: '/404.html', status: 404, headers: privateHeaders },
      { handle: 'filesystem' },
      { src: '/.*', dest: '/404.html', status: 404 },
    ],
  }
}

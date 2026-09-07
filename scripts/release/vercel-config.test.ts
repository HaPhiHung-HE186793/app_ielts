import { expect, it } from 'vitest'
import { readVercelConfig, vercelRoutes } from './vercel-config.js'

const env = {
  VITE_SUPABASE_URL: 'https://testproject.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_TEST_ONLY_0123456789',
  RENDER_API_URL: 'https://test-api.onrender.com',
}

it('reads only explicit public Vercel config and rejects wrong backend targets', () => {
  const value = readVercelConfig({
    ...env,
    OPENAI_API_KEY: 'PRIVATE_TEST_SENTINEL',
    VITE_OTHER_SECRET: 'PRIVATE_TEST_SENTINEL',
  })
  expect(JSON.stringify(value)).not.toContain('PRIVATE_TEST_SENTINEL')
  for (const RENDER_API_URL of [
    '',
    'http://localhost:8787',
    'https://api.onrender.com/path',
    'https://api.onrender.com.evil.test',
    'https://api.onrender.com/',
  ])
    expect(() => readVercelConfig({ ...env, RENDER_API_URL })).toThrow()
  expect(() => readVercelConfig({ ...env, VITE_SUPABASE_PUBLISHABLE_KEY: '' })).toThrow()
})

it('routes only the named APIs to Render without making private API responses cacheable', () => {
  const { config, backend } = readVercelConfig(env)
  const output = vercelRoutes(config, backend)
  expect(output.version).toBe(3)
  const routes = output.routes as Array<{
    src?: string
    dest?: string
    headers?: Record<string, string>
    continue?: boolean
    status?: number
    handle?: string
  }>
  const match = (path: string) =>
    routes.find((route) => route.src && !route.continue && new RegExp(route.src).test(path))
  expect(match('/api/ai/status')?.dest).toBe(`${backend}/api/ai/$1`)
  expect(match('/api/healthz')?.dest).toBe(`${backend}/healthz`)
  expect(match('/api/ai/status')?.headers?.['Cache-Control']).toBe('no-store')
  expect(match('/api/private')?.status).toBe(404)
  expect(routes.some((route) => route.handle === 'filesystem')).toBe(true)
  const shell = routes.filter(
    (route) => route.continue && route.src && new RegExp(route.src).test('/sw.js'),
  )
  expect(shell.flatMap((route) => Object.entries(route.headers ?? {}))).toContainEqual([
    'Cache-Control',
    'no-cache',
  ])
  expect(shell.flatMap((route) => Object.entries(route.headers ?? {}))).toContainEqual([
    'Service-Worker-Allowed',
    '/',
  ])
  expect(JSON.stringify(output)).not.toContain('*.')
})

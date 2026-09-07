import { expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAiServer } from './ai/http'

it('health check reveals no secrets and does not remove auth or origin checks from AI routes', async () => {
  const server = createAiServer({
    admin: {} as SupabaseClient,
    budgetId: 'test',
    provider: null,
    origins: ['https://moi-ngay.vercel.app'],
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Test server missing')
  const url = `http://127.0.0.1:${address.port}`
  try {
    const health = await fetch(`${url}/healthz`)
    expect(health.status).toBe(200)
    expect(await health.json()).toEqual({ status: 'ok' })
    expect(health.headers.get('Cache-Control')).toBe('no-store')
    expect(await (await fetch(`${url}/healthz`, { method: 'HEAD' })).text()).toBe('')
    expect((await fetch(`${url}/api/ai/status`)).status).toBe(401)
    expect(
      (await fetch(`${url}/api/ai/status`, { headers: { Origin: 'https://untrusted.test' } }))
        .status,
    ).toBe(403)
    expect((await fetch(`${url}/missing`)).status).toBe(404)
  } finally {
    server.closeAllConnections()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
})

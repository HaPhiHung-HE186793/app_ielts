import { test, expect } from '@playwright/test'
import type { Server } from 'node:http'
import { admin, cleanupAccount, createTestAccount, publicClient } from './helpers'
import { createAiServer } from '../../server/ai/http'
import { AiFailure, type AiProvider } from '../../server/ai/provider'
import { AI_CONSENT_VERSION, AI_PROMPT_VERSION } from '../../src/ai/contracts'

const fixture: AiProvider = {
  name: 'Test fixture',
  model: 'fixture-v1',
  source: 'test-fixture',
  review: async () => ({
    feedback: {
      verdict: 'try-again',
      summary: 'Phản hồi mô phỏng.',
      strength: null,
      improvement: { quote: 'I is', hint: 'Thử chọn lại động từ be.' },
      nextStep: 'Tự sửa câu.',
    },
    inputTokens: 500,
    outputTokens: 100,
  }),
}
async function listen(server: Server) {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Test server failed')
  return `http://127.0.0.1:${address.port}`
}
async function close(server: Server) {
  server.closeAllConnections()
  await new Promise<void>((resolve) => server.close(() => resolve()))
}
async function budget(limit = 100_000) {
  const id = crypto.randomUUID()
  expect(
    (await admin.rpc('configure_ai_budget', { p_id: id, p_enabled: true, p_limit: limit })).error,
  ).toBeNull()
  return id
}
const request = (ownerId: string) => ({
  requestId: crypto.randomUUID(),
  ownerId,
  lessonId: 'hello',
  text: 'I is a student.',
  consentVersion: AI_CONSENT_VERSION,
})

test('AI HTTP verifies real Auth/owner, limits bodies/origins and disabled service makes no requests', async () => {
  const a = await createTestAccount(),
    b = await createTestAccount(),
    budgetId = await budget()
  const server = createAiServer({
      admin,
      budgetId,
      provider: null,
      origins: ['http://127.0.0.1:4174'],
    }),
    url = await listen(server)
  const call = (token: string, body: unknown, extra = {}) =>
    fetch(`${url}/api/ai/feedback`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...extra },
      body: JSON.stringify(body),
    })
  try {
    expect((await call('forged.invalid.token', request(a.id))).status).toBe(401)
    expect((await call(b.session.access_token, request(a.id))).status).toBe(403)
    expect(
      (await call(a.session.access_token, request(a.id), { Origin: 'https://untrusted.example' }))
        .status,
    ).toBe(403)
    expect(
      (await call(a.session.access_token, { ...request(a.id), text: 'x'.repeat(9000) })).status,
    ).toBe(400)
    expect(
      (await call(a.session.access_token, { ...request(a.id), model: 'override' })).status,
    ).toBe(400)
    const disabled = await call(a.session.access_token, request(a.id))
    expect(disabled.status).toBe(503)
    expect(await disabled.json()).toEqual({ error: 'unavailable' })
    expect(disabled.headers.get('cache-control')).toBe('no-store')
    expect((await a.client.from('ai_requests').select('*')).data).toEqual([])
    expect((await publicClient().from('ai_requests').select('*')).error).not.toBeNull()
    expect(
      (
        await a.client.rpc('configure_ai_budget', {
          p_id: budgetId,
          p_enabled: true,
          p_limit: 999999,
        })
      ).error,
    ).not.toBeNull()
    expect(
      (
        await a.client.rpc('reserve_ai_request', {
          p_budget: budgetId,
          p_owner: a.id,
          p_request: crypto.randomUUID(),
          p_hash: 'a'.repeat(64),
        })
      ).error,
    ).not.toBeNull()
    expect(
      (
        await a.client.from('ai_requests').insert({
          user_id: a.id,
          request_id: crypto.randomUUID(),
          budget_id: budgetId,
          payload_hash: 'a'.repeat(64),
        })
      ).error,
    ).not.toBeNull()
  } finally {
    await close(server)
    await cleanupAccount(a.id, a.email)
    await cleanupAccount(b.id, b.email)
    await admin.from('ai_budgets').delete().eq('id', budgetId)
  }
})

test('one durable reservation survives concurrent retry/restart, replays only for owner and never stores raw input', async () => {
  const a = await createTestAccount(),
    b = await createTestAccount(),
    budgetId = await budget()
  let calls = 0,
    release!: () => void
  const waiting = new Promise<void>((resolve) => {
    release = resolve
  })
  const provider = {
    ...fixture,
    review: async (...args: Parameters<AiProvider['review']>) => {
      calls++
      await waiting
      return fixture.review(...args)
    },
  }
  let server = createAiServer({ admin, budgetId, provider, origins: [] }),
    url = await listen(server)
  const req = request(a.id)
  const send = (token = a.session.access_token, body = req) =>
    fetch(`${url}/api/ai/feedback`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  try {
    const first = send()
    await expect.poll(() => calls).toBe(1)
    const duplicate = await send()
    expect(await duplicate.json()).toEqual({ error: 'pending' })
    release()
    const result = await first
    expect(result.status).toBe(200)
    const response = await result.json()
    expect(response.source).toBe('test-fixture')
    expect(response.promptVersion).toBe(AI_PROMPT_VERSION)
    await close(server)
    server = createAiServer({ admin, budgetId, provider, origins: [] })
    url = await listen(server)
    expect(await (await send()).json()).toEqual(response)
    expect(calls).toBe(1)
    expect((await send(b.session.access_token)).status).toBe(403)
    expect((await b.client.from('ai_requests').select('*')).data).toEqual([])
    const changed = await send(a.session.access_token, { ...req, text: 'I am a student.' })
    expect(await changed.json()).toEqual({ error: 'conflict' })
    const receipt = (await a.client.from('ai_requests').select('*').single()).data!
    expect(receipt.accounted_micro_usd).toBe(360)
    expect(receipt).not.toHaveProperty('text')
    expect(JSON.stringify(receipt)).not.toContain('I is a student.')
    await admin
      .from('ai_requests')
      .update({ finished_at: new Date(Date.now() - 25 * 3600_000).toISOString() })
      .eq('budget_id', budgetId)
    await admin.rpc('purge_ai_responses', { p_budget: budgetId })
    expect(await (await send()).json()).toEqual({ error: 'used' })
    expect(calls).toBe(1)
  } finally {
    release()
    await close(server)
    await cleanupAccount(a.id, a.email)
    await cleanupAccount(b.id, b.email)
    await admin.from('ai_budgets').delete().eq('id', budgetId)
  }
})

test('budget is atomic across accounts, unknown cost stays reserved and deleting a user/restarting cannot reset spend', async () => {
  const a = await createTestAccount(),
    b = await createTestAccount(),
    budgetId = await budget(10_000)
  const removed = new Set<string>()
  try {
    const payload = (owner: string) => ({
      p_budget: budgetId,
      p_owner: owner,
      p_request: crypto.randomUUID(),
      p_hash: 'a'.repeat(64),
    })
    const one = payload(a.id),
      two = payload(b.id)
    const reserved = await Promise.all([
      admin.rpc('reserve_ai_request', one),
      admin.rpc('reserve_ai_request', two),
    ])
    expect(reserved.map((r) => r.data.status).sort()).toEqual(['budget', 'reserved'])
    const winner = reserved[0].data.status === 'reserved' ? one : two
    expect(
      (
        await admin.rpc('finish_ai_request', {
          p_budget: budgetId,
          p_owner: winner.p_owner,
          p_request: winner.p_request,
          p_response: null,
          p_error: 'timeout',
          p_cost: null,
        })
      ).data,
    ).toBe(true)
    const who = winner.p_owner === a.id ? a : b
    await cleanupAccount(who.id, who.email)
    removed.add(who.id)
    await admin.rpc('configure_ai_budget', { p_id: budgetId, p_enabled: true, p_limit: 10_000 })
    expect(
      (await admin.from('ai_budgets').select('accounted_micro_usd').eq('id', budgetId).single())
        .data?.accounted_micro_usd,
    ).toBe(10_000)
    const other = who === a ? b : a
    expect((await admin.rpc('reserve_ai_request', payload(other.id))).data.status).toBe('budget')
  } finally {
    for (const account of [a, b])
      if (!removed.has(account.id)) await cleanupAccount(account.id, account.email)
    await admin.from('ai_budgets').delete().eq('id', budgetId)
  }
})

test('provider timeout returns a useful error and the same request never calls provider again', async () => {
  const a = await createTestAccount(),
    budgetId = await budget()
  let calls = 0
  const provider: AiProvider = {
    ...fixture,
    review: async (_lesson, _text, signal) => {
      calls++
      await new Promise<void>((resolve) =>
        signal.addEventListener('abort', () => resolve(), { once: true }),
      )
      throw new AiFailure('timeout')
    },
  }
  const server = createAiServer({ admin, budgetId, provider, origins: [], providerTimeoutMs: 50 }),
    url = await listen(server)
  const req = request(a.id),
    send = () =>
      fetch(`${url}/api/ai/feedback`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${a.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req),
      })
  try {
    expect(await (await send()).json()).toEqual({ error: 'timeout' })
    expect(await (await send()).json()).toEqual({ error: 'used' })
    expect(calls).toBe(1)
    expect(
      (await a.client.from('ai_requests').select('accounted_micro_usd').single()).data
        ?.accounted_micro_usd,
    ).toBe(10_000)
  } finally {
    await close(server)
    await cleanupAccount(a.id, a.email)
    await admin.from('ai_budgets').delete().eq('id', budgetId)
  }
})

test('database enforces cooldown, active requests, expiry, daily quota and disables unexpected overspend', async () => {
  const accounts = [await createTestAccount(), await createTestAccount(), await createTestAccount()]
  const budgetId = await budget(500_000)
  const payload = (owner: string) => ({
    p_budget: budgetId,
    p_owner: owner,
    p_request: crypto.randomUUID(),
    p_hash: 'b'.repeat(64),
  })
  const [a, b, c] = accounts.map((account) => payload(account.id))
  const reserve = async (p: typeof a) => {
    const result = await admin.rpc('reserve_ai_request', p)
    expect(result.error).toBeNull()
    return result.data.status
  }
  try {
    expect(await reserve(a)).toBe('reserved')
    expect(await reserve(payload(a.p_owner))).toBe('quota')
    expect(await reserve(b)).toBe('reserved')
    expect(await reserve(c)).toBe('busy')
    await admin
      .from('ai_requests')
      .update({ created_at: new Date(Date.now() - 180_000).toISOString() })
      .eq('budget_id', budgetId)
      .eq('request_id', a.p_request)
    expect(await reserve(c)).toBe('reserved')
    expect(
      (
        await admin
          .from('ai_requests')
          .select('status')
          .eq('budget_id', budgetId)
          .eq('request_id', a.p_request)
          .single()
      ).data?.status,
    ).toBe('unknown')
    const finish = (p: typeof a, cost: number) =>
      admin.rpc('finish_ai_request', {
        p_budget: budgetId,
        p_owner: p.p_owner,
        p_request: p.p_request,
        p_response: null,
        p_error: 'timeout',
        p_cost: cost,
      })
    expect((await finish(a, 0)).data).toBe(false)
    expect((await finish(b, 11_000)).data).toBe(true)
    expect((await finish(b, 11_000)).data).toBe(false)
    expect(
      (
        await admin
          .from('ai_budgets')
          .select('enabled,accounted_micro_usd')
          .eq('id', budgetId)
          .single()
      ).data,
    ).toEqual({ enabled: false, accounted_micro_usd: 31_000 })
    await finish(c, 0)
    await admin.rpc('configure_ai_budget', { p_id: budgetId, p_enabled: true, p_limit: 500_000 })
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    // Test-owned history fixture puts this account at exactly ten attempts for today's UTC quota.
    expect(
      (
        await admin.from('ai_requests').insert(
          Array.from({ length: 9 }, () => ({
            user_id: c.p_owner,
            request_id: crypto.randomUUID(),
            budget_id: budgetId,
            payload_hash: 'c'.repeat(64),
            status: 'failed',
            created_at: today.toISOString(),
          })),
        )
      ).error,
    ).toBeNull()
    expect(await reserve(payload(c.p_owner))).toBe('quota')
  } finally {
    for (const account of accounts) await cleanupAccount(account.id, account.email)
    await admin.from('ai_budgets').delete().eq('id', budgetId)
  }
})

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { z } from 'zod'
import { dataRequestSchema } from '../../src/services/data-contract.ts'
import { aiRequestSchema } from '../../src/ai/contracts.ts'
import { NeonDatabase } from './database.ts'
import { type Identity } from './identity.ts'
import { executeData } from './data.ts'
import { authPaths, proxyAuth } from './auth-proxy.ts'
import { DAILY_LIMIT } from '../ai/config.ts'

function reply(res: ServerResponse, status: number, value: unknown) {
  if (res.destroyed || res.writableEnded) return
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  res.end(JSON.stringify(value))
}
async function body(req: IncomingMessage, limit: number) {
  if (
    req.headers['content-type']?.split(';')[0].trim() !== 'application/json' ||
    req.headers['content-encoding']
  )
    throw new Error('body')
  const chunks: Buffer[] = []
  let size = 0
  if (Number(req.headers['content-length'] ?? 0) > limit) throw new Error('body')
  for await (const part of req) {
    const chunk = Buffer.from(part)
    size += chunk.length
    if (size > limit) throw new Error('body')
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  } catch {
    throw new Error('body')
  }
}
const authSchemas = {
  '/api/auth/email-otp/send-verification-otp': z
    .object({ email: z.email().max(254), type: z.literal('sign-in') })
    .strict(),
  '/api/auth/sign-in/email-otp': z
    .object({ email: z.email().max(254), otp: z.string().regex(/^\d{6,10}$/) })
    .strict(),
  '/api/auth/sign-out': z.object({}).strict(),
}
export function createNeonServer(options: {
  db: NeonDatabase
  authUrl: string
  origins: string[]
  verify: (token: string) => Promise<Identity | null>
}) {
  const counters = new Map<string, { until: number; count: number }>()
  function allowed(key: string, limit: number) {
    const now = Date.now()
    for (const [name, value] of counters) if (value.until <= now) counters.delete(name)
    const entry = counters.get(key) ?? { until: now + 60_000, count: 0 }
    if (!counters.has(key) && counters.size >= 1000) return false
    entry.count++
    counters.set(key, entry)
    return entry.count <= limit
  }
  const server = createServer(async (req, res) => {
    try {
      const path = req.url ?? ''
      if (path === '/healthz' && ['GET', 'HEAD'].includes(req.method ?? ''))
        return reply(res, 200, { status: 'ok' })
      if (!allowed('total', 1000)) return reply(res, 429, { error: 'rate_limited' })
      if (req.headers.origin && !options.origins.includes(req.headers.origin))
        return reply(res, 403, { error: 'unauthorized' })
      if (authPaths[path]) {
        if (req.method !== authPaths[path]) return reply(res, 405, { error: 'invalid' })
        // Cookie endpoints require the exact browser origin on writes. GET never uses user input URLs.
        if (
          req.method === 'POST' &&
          (!req.headers.origin || !options.origins.includes(req.headers.origin))
        )
          return reply(res, 403, { error: 'unauthorized' })
        const schema = authSchemas[path as keyof typeof authSchemas]
        const input = schema ? schema.safeParse(await body(req, 4096)) : null
        if (input && !input.success) return reply(res, 400, { error: 'invalid' })
        if (
          path === '/api/auth/email-otp/send-verification-otp' &&
          input?.success &&
          'email' in input.data &&
          !allowed('otp:' + input.data.email.toLowerCase(), 3)
        )
          return reply(res, 429, { error: 'rate_limited' })
        await proxyAuth(req, res, options.authUrl, input?.data)
        return
      }
      if (!['/api/data', '/api/ai/status', '/api/ai/feedback', '/readyz'].includes(path))
        return reply(res, 404, { error: 'invalid' })
      if (path === '/readyz') {
        if (req.method !== 'GET') return reply(res, 405, { error: 'invalid' })
        await options.db.ready()
        return reply(res, 200, { status: 'ready' })
      }
      const method = path === '/api/ai/status' ? 'GET' : 'POST'
      if (req.method !== method) return reply(res, 405, { error: 'invalid' })
      const token = req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_.-]{20,4096})$/)?.[1]
      const identity = token ? await options.verify(token) : null
      if (!identity) return reply(res, 401, { error: 'unauthorized' })
      if (!allowed('user:' + identity.id, 240)) return reply(res, 429, { error: 'rate_limited' })
      if (path === '/api/ai/status')
        return reply(res, 200, {
          ownerId: identity.id,
          available: false,
          dailyLimit: DAILY_LIMIT,
          provider: null,
          retentionHours: 24,
        })
      if (path === '/api/ai/feedback') {
        const input = aiRequestSchema.safeParse(await body(req, 8192))
        if (!input.success) return reply(res, 400, { error: 'invalid' })
        if (input.data.ownerId !== identity.id) return reply(res, 403, { error: 'unauthorized' })
        return reply(res, 503, { error: 'unavailable' })
      }
      const input = dataRequestSchema.safeParse(await body(req, 5_000_000))
      if (!input.success) return reply(res, 400, { error: 'invalid' })
      if (input.data.owner !== identity.id) return reply(res, 403, { error: 'unauthorized' })
      const result = await executeData(options.db, input.data)
      reply(res, 200, { data: result })
    } catch (error) {
      reply(res, error instanceof Error && error.message === 'body' ? 400 : 503, {
        error: 'unavailable',
      })
    }
  })
  server.requestTimeout = 15_000
  server.headersTimeout = 5000
  server.keepAliveTimeout = 5000
  server.maxConnections = 50
  server.maxRequestsPerSocket = 100
  return server
}

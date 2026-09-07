import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AI_PROMPT_VERSION, aiRequestSchema, aiResponseSchema } from '../../src/ai/contracts.ts'
import { lessons } from '../../src/content/lessons.ts'
import { DAILY_LIMIT, RESERVATION_MICRO_USD } from './config.ts'
import { AiFailure, estimatedMicroUsd, type AiProvider } from './provider.ts'

export type AiServerOptions = {
  admin: SupabaseClient
  budgetId: string
  provider: AiProvider | null
  origins: string[]
  providerTimeoutMs?: number
}
function reply(res: ServerResponse, status: number, value: unknown) {
  if (res.destroyed || res.writableEnded) return
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  res.end(JSON.stringify(value))
}
async function readBody(req: IncomingMessage) {
  if (
    req.headers['content-type']?.split(';')[0].trim() !== 'application/json' ||
    req.headers['content-encoding']
  )
    throw new AiFailure('invalid')
  if (Number(req.headers['content-length'] ?? 0) > 8192) throw new AiFailure('invalid')
  const parts: Buffer[] = []
  let bytes = 0
  for await (const part of req) {
    const chunk = Buffer.from(part)
    bytes += chunk.length
    if (bytes > 8192) throw new AiFailure('invalid')
    parts.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(parts).toString('utf8')) as unknown
  } catch {
    throw new AiFailure('invalid')
  }
}
export function createAiServer(options: AiServerOptions) {
  const server = createServer(async (req, res) => {
    const controller = new AbortController()
    res.on('close', () => {
      if (!res.writableEnded) controller.abort()
    })
    try {
      if (req.url === '/healthz' && (req.method === 'GET' || req.method === 'HEAD')) {
        reply(res, 200, { status: 'ok' })
        return
      }
      if (req.headers.origin && !options.origins.includes(req.headers.origin)) {
        reply(res, 403, { error: 'unauthorized' })
        return
      }
      const path = req.url ?? ''
      if (!['/api/ai/status', '/api/ai/feedback'].includes(path)) {
        reply(res, 404, { error: 'invalid' })
        return
      }
      if (
        (path.endsWith('/status') && req.method !== 'GET') ||
        (path.endsWith('/feedback') && req.method !== 'POST')
      ) {
        reply(res, 405, { error: 'invalid' })
        return
      }
      const token = req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_.-]{20,4096})$/)?.[1]
      if (!token) {
        reply(res, 401, { error: 'unauthorized' })
        return
      }
      const identity = await options.admin.auth.getUser(token)
      if (identity.error || !identity.data.user) {
        reply(res, 401, { error: 'unauthorized' })
        return
      }
      const owner = identity.data.user.id
      if (controller.signal.aborted) return
      if (path.endsWith('/status')) {
        const budget = await options.admin
          .from('ai_budgets')
          .select('enabled,limit_micro_usd,accounted_micro_usd')
          .eq('id', options.budgetId)
          .single()
        reply(res, 200, {
          ownerId: owner,
          available: !!(
            options.provider &&
            !budget.error &&
            budget.data.enabled &&
            budget.data.accounted_micro_usd + RESERVATION_MICRO_USD <= budget.data.limit_micro_usd
          ),
          dailyLimit: DAILY_LIMIT,
          provider: options.provider?.name ?? null,
          retentionHours: 24,
        })
        return
      }
      const request = aiRequestSchema.safeParse(await readBody(req))
      if (!request.success) throw new AiFailure('invalid')
      if (request.data.ownerId !== owner) {
        reply(res, 403, { error: 'unauthorized' })
        return
      }
      const lesson = lessons.find((item) => item.id === request.data.lessonId)
      if (!lesson) throw new AiFailure('invalid')
      if (!options.provider) {
        reply(res, 503, { error: 'unavailable' })
        return
      }
      const provider = options.provider
      const hash = createHash('sha256')
        .update(
          JSON.stringify({
            lesson,
            text: request.data.text,
            consent: request.data.consentVersion,
            model: provider.model,
            prompt: AI_PROMPT_VERSION,
          }),
        )
        .digest('hex')
      const reserved = await options.admin.rpc('reserve_ai_request', {
        p_budget: options.budgetId,
        p_owner: owner,
        p_request: request.data.requestId,
        p_hash: hash,
      })
      if (reserved.error) throw new AiFailure('network')
      if (reserved.data.status === 'replay') {
        const replay = aiResponseSchema.safeParse(reserved.data.response)
        if (
          !replay.success ||
          replay.data.ownerId !== owner ||
          replay.data.requestId !== request.data.requestId
        )
          throw new AiFailure('invalid_feedback')
        reply(res, 200, replay.data)
        return
      }
      if (reserved.data.status !== 'reserved') {
        const status = reserved.data.status as string
        reply(
          res,
          ['quota', 'budget', 'busy'].includes(status) ? 429 : status === 'unavailable' ? 503 : 409,
          { error: status },
        )
        return
      }
      let response: unknown = null,
        error: string | null = null,
        cost: number | null = null
      try {
        const signal = AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(options.providerTimeoutMs ?? 20_000),
        ])
        if (signal.aborted) throw new AiFailure('timeout')
        const result = await provider.review(lesson, request.data.text, signal)
        cost = estimatedMicroUsd(result)
        if (cost > RESERVATION_MICRO_USD) throw new AiFailure('invalid_feedback')
        response = aiResponseSchema.parse({
          requestId: request.data.requestId,
          ownerId: owner,
          source: provider.source,
          provider: provider.name,
          model: provider.model,
          promptVersion: AI_PROMPT_VERSION,
          reviewedAt: new Date().toISOString(),
          feedback: result.feedback,
        })
      } catch (failure) {
        error = failure instanceof AiFailure ? failure.code : 'provider_error'
      }
      const finished = await options.admin.rpc('finish_ai_request', {
        p_budget: options.budgetId,
        p_owner: owner,
        p_request: request.data.requestId,
        p_response: response,
        p_error: error,
        p_cost: cost,
      })
      if (finished.error || !finished.data) throw new AiFailure('network')
      reply(res, error ? 502 : 200, error ? { error } : response)
    } catch (error) {
      const code = error instanceof AiFailure ? error.code : 'network'
      reply(res, code === 'invalid' ? 400 : 503, { error: code })
    }
  })
  server.requestTimeout = 10_000
  server.headersTimeout = 5000
  server.keepAliveTimeout = 5000
  server.maxConnections = 50
  server.maxRequestsPerSocket = 100
  return server
}

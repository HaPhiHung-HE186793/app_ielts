import { getAuthSnapshot } from '../app/auth'
import { authClient } from '../services/backend'
import { aiResponseSchema, aiStatusSchema, isGroundedFeedback, type AiRequest } from './contracts'

export class AiClientError extends Error {
  constructor(readonly code: string) {
    super(code)
  }
}
async function headers(owner: string) {
  if (
    !authClient ||
    getAuthSnapshot().status !== 'signed-in' ||
    getAuthSnapshot().user?.id !== owner
  )
    throw new AiClientError('unauthorized')
  const session = await authClient.getSession()
  if (
    session.error ||
    session.data.session?.user.id !== owner ||
    getAuthSnapshot().user?.id !== owner
  )
    throw new AiClientError('unauthorized')
  return {
    Authorization: `Bearer ${session.data.session.access_token}`,
    'Content-Type': 'application/json',
  }
}
async function call(path: string, owner: string, signal: AbortSignal, request?: AiRequest) {
  const auth = await headers(owner)
  if (signal.aborted) throw new AiClientError('timeout')
  try {
    const response = await fetch(`/api/ai/${path}`, {
      method: request ? 'POST' : 'GET',
      headers: auth,
      cache: 'no-store',
      signal: AbortSignal.any([signal, AbortSignal.timeout(35_000)]),
      ...(request ? { body: JSON.stringify(request) } : {}),
    })
    const body: unknown = await response.json()
    if (!response.ok)
      throw new AiClientError(
        typeof (body as { error?: unknown })?.error === 'string'
          ? (body as { error: string }).error
          : 'network',
      )
    return body
  } catch (error) {
    if (error instanceof AiClientError) throw error
    throw new AiClientError(signal.aborted ? 'timeout' : 'network')
  }
}
export async function loadAiStatus(owner: string, signal: AbortSignal) {
  const status = aiStatusSchema.safeParse(await call('status', owner, signal))
  if (!status.success || status.data.ownerId !== owner) throw new AiClientError('network')
  return status.data
}
export async function requestAiHint(request: AiRequest, signal: AbortSignal) {
  const result = aiResponseSchema.safeParse(
    await call('feedback', request.ownerId, signal, request),
  )
  if (
    !result.success ||
    result.data.ownerId !== request.ownerId ||
    result.data.requestId !== request.requestId ||
    !isGroundedFeedback(result.data.feedback, request.text)
  )
    throw new AiClientError('invalid_feedback')
  return result.data
}
async function requestHash(scope: string, draftId: string, lessonId: string, text: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify({ draftId, lessonId, text: text.trim() })),
  )
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
  const key = `moi-ngay.ai-request:${scope}`
  return { hash, key }
}
function storedIdentity(key: string, hash: string) {
  let previous: { hash?: string; requestId?: string } | null = null
  try {
    previous = JSON.parse(localStorage.getItem(key) ?? 'null')
  } catch {
    /* Replace only on explicit submission below. */
  }
  return previous?.hash === hash && /^[a-f0-9-]{36}$/i.test(previous.requestId ?? '')
    ? previous.requestId!
    : null
}
export async function loadAiRequestIdentity(
  scope: string,
  draftId: string,
  lessonId: string,
  text: string,
) {
  const { hash, key } = await requestHash(scope, draftId, lessonId, text)
  return storedIdentity(key, hash)
}
export async function aiRequestIdentity(
  scope: string,
  draftId: string,
  lessonId: string,
  text: string,
  fresh = false,
) {
  const { hash, key } = await requestHash(scope, draftId, lessonId, text)
  const previous = storedIdentity(key, hash)
  if (!fresh && previous) return previous
  const requestId = crypto.randomUUID()
  try {
    localStorage.setItem(key, JSON.stringify({ hash, requestId }))
  } catch {
    throw new AiClientError('storage')
  }
  return requestId
}

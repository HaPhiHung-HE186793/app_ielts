import { authClient } from './backend'
import { getAuthSnapshot } from '../app/auth'
import type { DataRequest } from './data-contract'

export async function neonRequest(input: DataRequest, signal?: AbortSignal): Promise<unknown> {
  if (getAuthSnapshot().status !== 'signed-in' || getAuthSnapshot().user?.id !== input.owner)
    throw new Error('Owner changed')
  const session = await authClient?.getSession()
  if (
    !session?.data.session ||
    session.error ||
    session.data.session.user.id !== input.owner ||
    getAuthSnapshot().user?.id !== input.owner
  )
    throw new Error('Owner changed')
  const response = await fetch('/api/data', {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.data.session.access_token}`,
    },
    body: JSON.stringify(input),
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(20_000)])
      : AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error('Data unavailable')
  if (getAuthSnapshot().user?.id !== input.owner) throw new Error('Owner changed')
  return ((await response.json()) as { data: unknown }).data
}

import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createNeonAuth } from './neon-auth'

const owner = { id: '7a1e2566-3810-48da-a1ae-1d67289827b6', email: 'test@example.test' }
let storage: Map<string, string>
let storageEvent: (event: {
  key: string | null
  newValue: string | null
  oldValue: string | null
}) => void
beforeEach(() => {
  storage = new Map()
  vi.stubGlobal('localStorage', {
    setItem: (k: string, v: string) => storage.set(k, v),
    removeItem: (k: string) => storage.delete(k),
  })
  vi.stubGlobal('window', {
    addEventListener: (_name: string, callback: typeof storageEvent) => {
      storageEvent = callback
    },
  })
})
afterEach(() => vi.unstubAllGlobals())
const response = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })
it('coalesces session reads and stores only an owner hint', async () => {
  const fetch = vi.fn(async (path: string) =>
    response(
      path.endsWith('/token')
        ? { token: 'signed-token-kept-only-in-memory' }
        : { user: owner, session: {} },
    ),
  )
  vi.stubGlobal('fetch', fetch)
  const client = createNeonAuth('hint'),
    events = vi.fn()
  client.onAuthStateChange(events)
  const [first, second] = await Promise.all([client.getSession(), client.getSession()])
  expect(first).toEqual(second)
  expect(first.data.session?.user).toEqual(owner)
  expect(fetch).toHaveBeenCalledTimes(2)
  expect(storage.get('hint')).toBe(JSON.stringify({ user: owner }))
  expect(events).toHaveBeenCalledTimes(1)
})
it('rejects a pending session response after logout and never refreshes during logout', async () => {
  let finishRead!: (response: Response) => void, finishLogout!: (response: Response) => void
  const fetch = vi.fn(
    (path: string) =>
      new Promise<Response>((resolve) => {
        if (path.endsWith('/sign-out')) finishLogout = resolve
        else finishRead = resolve
      }),
  )
  vi.stubGlobal('fetch', fetch)
  const client = createNeonAuth('hint'),
    events = vi.fn()
  client.onAuthStateChange(events)
  const read = client.getSession(),
    logout = client.signOut({ scope: 'local' })
  expect((await client.getSession()).error?.status).toBe(409)
  expect(fetch).toHaveBeenCalledTimes(2)
  finishLogout(response({}))
  expect((await logout).error).toBeNull()
  finishRead(response({ user: owner, session: {} }))
  expect((await read).error?.status).toBe(409)
  expect(events.mock.calls).toEqual([['SIGNED_OUT', null]])
  expect(storage.has('hint')).toBe(false)
})
it('invalidates an outstanding token response when another tab signs out', async () => {
  let finishToken!: (response: Response) => void
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string) =>
      path.endsWith('/token')
        ? new Promise<Response>((resolve) => {
            finishToken = resolve
          })
        : response({ user: owner, session: {} }),
    ),
  )
  const client = createNeonAuth('hint'),
    events = vi.fn()
  client.onAuthStateChange(events)
  const read = client.getSession()
  await vi.waitFor(() => expect(finishToken).toBeTypeOf('function'))
  storageEvent({ key: 'hint', oldValue: 'old', newValue: null })
  finishToken(response({ token: 'stale-token-never-persisted' }))
  expect((await read).error?.status).toBe(409)
  expect(events.mock.calls).toEqual([['SIGNED_OUT', null]])
})
it('keeps the offline owner hint when the network cannot restore a session', async () => {
  storage.set('hint', JSON.stringify({ user: owner }))
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new Error('offline')
    }),
  )
  const client = createNeonAuth('hint'),
    events = vi.fn()
  client.onAuthStateChange(events)
  expect((await client.getSession()).error?.status).toBe(503)
  expect(events).not.toHaveBeenCalled()
  expect(storage.has('hint')).toBe(true)
})

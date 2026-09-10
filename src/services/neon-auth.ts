import { z } from 'zod'

const userSchema = z.object({ id: z.uuid(), email: z.email() })
export type AuthSession = { user: { id: string; email?: string }; access_token: string }
type AuthError = { status?: number } | null
export type AuthPort = {
  getSession: () => Promise<{ data: { session: AuthSession | null }; error: AuthError }>
  onAuthStateChange: (callback: (event: string, session: AuthSession | null) => void) => unknown
  signInWithOtp: (input: {
    email: string
    options: { shouldCreateUser: boolean }
  }) => Promise<{ error: AuthError }>
  verifyOtp: (input: {
    email: string
    token: string
    type: 'email'
  }) => Promise<{ error: AuthError }>
  signOut: (input: { scope: 'local' }) => Promise<{ error: AuthError }>
}

// Uses Neon's managed REST endpoints. Only an owner hint is persisted here, never a JWT.
// Neon owns OTP validation and the HttpOnly session cookie, proxied on this origin for Safari.
export function createNeonAuth(storageKey: string): AuthPort {
  let generation = 0
  let changing = false
  let inFlight: Promise<{ data: { session: AuthSession | null }; error: AuthError }> | null = null
  const listeners = new Set<(event: string, session: AuthSession | null) => void>()
  function publish(event: string, next: AuthSession | null) {
    try {
      if (next) localStorage.setItem(storageKey, JSON.stringify({ user: next.user }))
      else localStorage.removeItem(storageKey)
    } catch {
      /* Learning storage reports its own errors. */
    }
    listeners.forEach((callback) => callback(event, next))
  }
  async function request(path: string, body?: unknown) {
    const response = await fetch('/api/auth/' + path, {
      method: body === undefined ? 'GET' : 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
      ...(body === undefined
        ? {}
        : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    })
    if (!response.ok)
      throw Object.assign(new Error('Auth unavailable'), { status: response.status })
    return (await response.json()) as unknown
  }
  function getSession() {
    if (changing) return Promise.resolve({ data: { session: null }, error: { status: 409 } })
    if (inFlight) return inFlight
    const run = generation
    const task = (async () => {
      try {
        const result = await request('get-session')
        if (run !== generation) return { data: { session: null }, error: { status: 409 } }
        if (!result) {
          publish('SIGNED_OUT', null)
          return { data: { session: null }, error: null }
        }
        const { user } = z
          .object({ user: userSchema, session: z.object({}).passthrough() })
          .parse(result)
        const { token } = z
          .object({ token: z.string().min(20).max(4096) })
          .parse(await request('token'))
        if (run !== generation) return { data: { session: null }, error: { status: 409 } }
        const next = { user, access_token: token }
        publish('TOKEN_REFRESHED', next)
        return { data: { session: next }, error: null }
      } catch (error) {
        return {
          data: { session: null },
          error: {
            status: error instanceof Error && 'status' in error ? Number(error.status) : 503,
          },
        }
      }
    })()
    inFlight = task
    void task.finally(() => {
      if (inFlight === task) inFlight = null
    })
    return task
  }
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey && event.key !== null) return
    if (event.key === storageKey && event.newValue === event.oldValue) return
    generation++
    inFlight = null
    if (!event.newValue) publish('SIGNED_OUT', null)
    else void getSession()
  })
  return {
    getSession,
    onAuthStateChange(callback) {
      listeners.add(callback)
      return () => listeners.delete(callback)
    },
    async signInWithOtp(input) {
      try {
        await request('email-otp/send-verification-otp', { email: input.email, type: 'sign-in' })
        return { error: null }
      } catch (error) {
        return {
          error: {
            status: error instanceof Error && 'status' in error ? Number(error.status) : 503,
          },
        }
      }
    },
    async verifyOtp(input) {
      if (changing) return { error: { status: 409 } }
      changing = true
      const run = ++generation
      inFlight = null
      try {
        await request('sign-in/email-otp', { email: input.email, otp: input.token })
        if (run !== generation) return { error: { status: 409 } }
        changing = false
        return { error: (await getSession()).error }
      } catch {
        return { error: { status: 400 } }
      } finally {
        changing = false
      }
    },
    async signOut() {
      if (changing) return { error: { status: 409 } }
      changing = true
      const run = ++generation
      inFlight = null
      try {
        await request('sign-out', {})
        if (run === generation) {
          generation++
          publish('SIGNED_OUT', null)
        }
        return { error: null }
      } catch {
        return { error: { status: 503 } }
      } finally {
        changing = false
      }
    },
  }
}

import type { AuthSession as Session } from '../services/neon-auth'
import { authStorageKey, publicConfig, authClient } from '../services/backend'
import { switchStudyOwner } from '../data/store'

type AuthSnapshot = {
  status: 'loading' | 'guest' | 'signed-in' | 'offline' | 'unavailable'
  user: { id: string; email?: string } | null
  error: string | null
}
let snapshot: AuthSnapshot = { status: authClient ? 'loading' : 'guest', user: null, error: null }
const listeners = new Set<() => void>()
let initialized = false
let receivedEvent = false
let beforeSignOut: (() => Promise<void>) | null = null
export function registerSignOutCleanup(cleanup: () => Promise<void>) {
  beforeSignOut = cleanup
}

function publish(next: AuthSnapshot) {
  snapshot = next
  listeners.forEach((listener) => listener())
}
function receiveSession(session: Session | null) {
  switchStudyOwner(
    session && publicConfig.status === 'ready'
      ? { project: publicConfig.url, userId: session.user.id }
      : null,
  )
  publish({ status: session ? 'signed-in' : 'guest', user: session?.user ?? null, error: null })
}
export function initializeAuth() {
  if (initialized || !authClient) return
  initialized = true
  window.addEventListener('online', () => {
    // Ask the SDK to refresh; its Auth events decide the actual owner/session.
    void authClient?.getSession().catch(() => {})
  })
  // An expired SDK session may need network before INITIAL_SESSION arrives.
  // Read only its owner hint for local learning; this grants no server access.
  if (authStorageKey && publicConfig.status === 'ready') {
    try {
      const cached = JSON.parse(localStorage.getItem(authStorageKey) ?? 'null')
      if (typeof cached?.user?.id === 'string' && /^[a-f0-9-]{36}$/i.test(cached.user.id)) {
        const user = {
          id: cached.user.id,
          email: typeof cached.user.email === 'string' ? cached.user.email : undefined,
        }
        switchStudyOwner({ project: publicConfig.url, userId: user.id })
        publish({
          status: 'offline',
          user,
          error:
            'Đang mở phần học đã lưu trên máy. Phiên sẽ được xác nhận khi kết nối được máy chủ.',
        })
      }
    } catch {
      /* Unreadable auth data stays untouched; the SDK handles recovery. */
    }
  }
  // Synchronous callback: no Supabase API call while the auth client's lock is held.
  authClient.onAuthStateChange((event, session) => {
    receivedEvent = true
    if (!session && event === 'INITIAL_SESSION' && snapshot.status === 'offline') return
    receiveSession(session)
  })
  void authClient
    .getSession()
    .then(({ data, error }) => {
      if (receivedEvent) return
      if (snapshot.status === 'offline') return
      if (error)
        publish({
          status: 'unavailable',
          user: null,
          error: 'Chưa khôi phục được phiên đăng nhập. Hãy thử tải lại trang.',
        })
      else receiveSession(data.session)
    })
    .catch(() => {
      if (!receivedEvent && snapshot.status !== 'offline')
        publish({
          status: 'unavailable',
          user: null,
          error: 'Chưa khôi phục được phiên đăng nhập. Hãy thử tải lại trang.',
        })
    })
}

export const getAuthSnapshot = () => snapshot
export function subscribeAuth(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export async function signOutHere() {
  if (!authClient) return null
  await beforeSignOut?.()
  const { error } = await authClient.signOut({ scope: 'local' })
  if (error && !snapshot.user) {
    publish({
      ...snapshot,
      error:
        'Đã rời tài khoản trên trình duyệt này. Chưa nhận được xác nhận thu hồi phiên từ máy chủ.',
    })
    return null
  }
  return error ? 'Chưa đăng xuất được. Kiểm tra kết nối rồi thử lại; tài khoản vẫn đang mở.' : null
}

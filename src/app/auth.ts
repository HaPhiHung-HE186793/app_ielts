import type { Session, User } from '@supabase/supabase-js'
import { publicConfig, supabase } from '../services/supabase'
import { switchStudyOwner } from '../data/store'

type AuthSnapshot = {
  status: 'loading' | 'guest' | 'signed-in' | 'unavailable'
  user: User | null
  error: string | null
}
let snapshot: AuthSnapshot = { status: supabase ? 'loading' : 'guest', user: null, error: null }
const listeners = new Set<() => void>()
let initialized = false
let receivedEvent = false

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
  if (initialized || !supabase) return
  initialized = true
  // Synchronous callback: no Supabase API call while the auth client's lock is held.
  supabase.auth.onAuthStateChange((_event, session) => {
    receivedEvent = true
    receiveSession(session)
  })
  void supabase.auth
    .getSession()
    .then(({ data, error }) => {
      if (receivedEvent) return
      if (error)
        publish({
          status: 'unavailable',
          user: null,
          error: 'Chưa khôi phục được phiên đăng nhập. Hãy thử tải lại trang.',
        })
      else receiveSession(data.session)
    })
    .catch(() => {
      if (!receivedEvent)
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
  if (!supabase) return null
  const { error } = await supabase.auth.signOut({ scope: 'local' })
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

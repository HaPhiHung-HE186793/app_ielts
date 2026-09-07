import { getAuthSnapshot, subscribeAuth } from './auth'
import { setEditingAllowed, studyStore } from '../data/store'
import { createSyncEngine, type SyncPhase } from '../data/sync-engine'
import { studyTransport } from '../services/study-sync'

export const syncLabels: Record<SyncPhase, string> = {
  guest: 'Học không đăng nhập',
  waiting: 'Đang mở ở tab khác',
  unsupported: 'Trình duyệt chưa hỗ trợ đồng bộ',
  disabled: 'Chỉ lưu trên trình duyệt',
  pending: 'Đang chờ đồng bộ',
  syncing: 'Đang đồng bộ',
  synced: 'Đã đồng bộ',
  offline: 'Mất mạng · chờ đồng bộ',
  error: 'Chưa đồng bộ được',
  conflict: 'Cần chọn bản giữ lại',
}
let snapshot = { phase: 'guest' as SyncPhase, canEdit: true }
const listeners = new Set<() => void>()
export const getSyncSnapshot = () => snapshot
export function subscribeSync(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
let engine: ReturnType<typeof createSyncEngine> | null = null
let release: (() => void) | null = null
let lockRequest: AbortController | null = null
let generation = 0
let initialized = false
let suspended = false
let activeUser: string | null | undefined
function publish(phase: SyncPhase, canEdit: boolean) {
  snapshot = { phase, canEdit }
  setEditingAllowed(canEdit && phase !== 'conflict')
  listeners.forEach((listener) => listener())
}
export function initializeSync() {
  if (initialized) return
  initialized = true
  const configure = () => {
    const userId = getAuthSnapshot().user?.id ?? null
    if (activeUser === userId) {
      // SDK callbacks are synchronous while its auth lock is held.
      // Wake on a later task, after a cached owner becomes an authenticated session.
      window.setTimeout(() => {
        void engine?.run()
      }, 0)
      return
    }
    activeUser = userId
    const run = ++generation
    engine?.dispose()
    engine = null
    release?.()
    release = null
    lockRequest?.abort()
    lockRequest = null
    if (!userId) {
      publish('guest', true)
      return
    }
    if (!navigator.locks) {
      publish('unsupported', true)
      return
    }
    publish('waiting', false)
    const ownerKey = studyStore.getSnapshot().scopeKey
    lockRequest = new AbortController()
    void navigator.locks
      .request(`moi-ngay.writer:${ownerKey}`, { signal: lockRequest.signal }, async () => {
        if (generation !== run) return
        studyStore.receiveStorage(ownerKey)
        publish(studyStore.getSnapshot().sync ? 'pending' : 'disabled', true)
        engine = createSyncEngine(
          studyStore,
          studyTransport(userId),
          (phase) => {
            if (generation === run) publish(phase, true)
          },
          () => navigator.onLine && getAuthSnapshot().status !== 'offline',
        )
        engine.suspend(suspended)
        await new Promise<void>((resolve) => {
          release = resolve
        })
      })
      .catch(() => {
        if (generation === run) publish('error', false)
      })
  }
  subscribeAuth(configure)
  configure()
  const wake = () => {
    if (document.visibilityState === 'visible') void engine?.run()
  }
  window.addEventListener('online', wake)
  window.addEventListener('offline', wake)
  window.addEventListener('focus', wake)
  document.addEventListener('visibilitychange', wake)
  window.setInterval(wake, 15_000)
}
export const retrySync = () => {
  void engine?.run()
}
export function suspendSync(value: boolean) {
  suspended = value
  engine?.suspend(value)
}
export const enableSync = () => engine?.enable()
export const pauseSync = () => engine?.pause()
export const resolveSync = (choice: 'local' | 'remote') => engine?.resolve(choice)

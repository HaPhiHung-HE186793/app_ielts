import { emptyState, parseBackup, stateSchema, type StudyState } from './schema'
import { encodeStudy, syncMetaSchema, type SyncMeta } from './sync-schema'
import { equal } from '../domain/sync'

export const STORAGE_KEY = 'moi-ngay.study.v1'
export type StudyOwner = { project: string; userId: string } | null
type Snapshot = {
  state: StudyState
  error: string | null
  scopeKey: string
  sync: SyncMeta | null
  viewRevision: number
}
type StorageAccess = () => Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function studyKey(owner: StudyOwner) {
  return owner
    ? `${STORAGE_KEY}.account:${encodeURIComponent(owner.project)}:${owner.userId}`
    : STORAGE_KEY
}

export function createStudyStore(storage: StorageAccess) {
  let scopeKey = STORAGE_KEY
  let unreadable = false
  let dataEpoch = 0
  let viewRevision = 0
  const listeners = new Set<() => void>()
  // Keep unsaved work in this page's memory across identity changes; never show it in another scope.
  const unsaved = new Map<string, { snapshot: Snapshot; unreadable: boolean }>()
  const emit = () => listeners.forEach((listener) => listener())

  function read(): Snapshot {
    try {
      const raw = storage().getItem(scopeKey)
      if (raw && raw.length > 25_000_000) throw new Error('Local data exceeds limit')
      const data = raw ? JSON.parse(raw) : null
      const sync = data?._sync === undefined ? null : syncMetaSchema.parse(data._sync)
      const state = data ? parseBackup(JSON.stringify({ ...data, _sync: undefined })) : emptyState()
      return { state, sync, error: null, scopeKey, viewRevision }
    } catch {
      unreadable = true
      return {
        state: emptyState(),
        scopeKey,
        sync: null,
        viewRevision,
        error:
          'Chưa đọc được dữ liệu đã lưu. Bản cũ được giữ nguyên. Bạn có thể tải bản sao trong cài đặt trước khi khôi phục hoặc xóa.',
      }
    }
  }
  let snapshot = read()

  return {
    getSnapshot: () => snapshot,
    getDataEpoch: () => dataEpoch,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    switchStudyOwner(owner: StudyOwner) {
      const nextKey = studyKey(owner)
      if (nextKey === scopeKey) return
      if (snapshot.error) unsaved.set(scopeKey, { snapshot, unreadable })
      else unsaved.delete(scopeKey)
      dataEpoch++ // Invalidate old timers before making the next learner's state visible.
      scopeKey = nextKey
      const previous = unsaved.get(scopeKey)
      unreadable = previous?.unreadable ?? false
      snapshot = previous?.snapshot ?? read()
      emit()
    },
    updateState(update: (state: StudyState) => StudyState) {
      const next = update(snapshot.state)
      if (next === snapshot.state) return
      if (unreadable) {
        snapshot = { ...snapshot, state: next }
        emit()
        return
      }
      try {
        stateSchema.parse(next)
        storage().setItem(scopeKey, encodeStudy(next, snapshot.sync))
        snapshot = { ...snapshot, state: next, error: null }
        unsaved.delete(scopeKey)
      } catch {
        snapshot = {
          ...snapshot,
          state: next,
          error:
            'Chưa lưu được thay đổi trên trình duyệt. Hãy giữ tab này và tải bản sao trong cài đặt để tránh mất tiến độ.',
        }
      }
      emit()
    },
    importBackup(raw: string) {
      const next = parseBackup(raw)
      storage().setItem(scopeKey, JSON.stringify(next))
      dataEpoch++
      unreadable = false
      unsaved.delete(scopeKey)
      snapshot = { state: next, error: null, scopeKey, sync: null, viewRevision }
      emit()
      return next
    },
    resetState() {
      storage().removeItem(scopeKey)
      dataEpoch++
      unreadable = false
      unsaved.delete(scopeKey)
      snapshot = { state: emptyState(), error: null, scopeKey, sync: null, viewRevision }
      emit()
    },
    backupText() {
      if (unreadable) {
        try {
          return storage().getItem(scopeKey) ?? JSON.stringify(snapshot.state, null, 2)
        } catch {
          /* Export unsaved work if storage is inaccessible. */
        }
      }
      return JSON.stringify(snapshot.state, null, 2)
    },
    readGuest() {
      const raw = storage().getItem(STORAGE_KEY)
      return raw ? parseBackup(raw) : emptyState()
    },
    writeSync(state: StudyState, sync: SyncMeta | null) {
      if (unreadable || snapshot.error)
        throw new Error('Resolve local storage error before syncing')
      stateSchema.parse(state)
      if (sync) syncMetaSchema.parse(sync)
      storage().setItem(scopeKey, encodeStudy(state, sync))
      if (!equal(state, snapshot.state)) {
        dataEpoch++
        if (
          !equal(state.draft, snapshot.state.draft) ||
          !equal(state.plan, snapshot.state.plan) ||
          !equal(state.profile, snapshot.state.profile)
        )
          viewRevision++
      }
      snapshot = { state, sync, error: null, scopeKey, viewRevision }
      emit()
    },
    receiveStorage(key: string | null) {
      if (key !== scopeKey && key !== null) return
      if (snapshot.error && !unreadable) return
      dataEpoch++
      unreadable = false
      unsaved.delete(scopeKey)
      snapshot = read()
      emit()
    },
  }
}

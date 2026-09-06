import { emptyState, parseBackup, stateSchema, type StudyState } from './schema'

export const STORAGE_KEY = 'moi-ngay.study.v1'
export type StudyOwner = { project: string; userId: string } | null
type Snapshot = { state: StudyState; error: string | null; scopeKey: string }
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
  const listeners = new Set<() => void>()
  // Keep unsaved work in this page's memory across identity changes; never show it in another scope.
  const unsaved = new Map<string, { snapshot: Snapshot; unreadable: boolean }>()
  const emit = () => listeners.forEach((listener) => listener())

  function read(): Snapshot {
    try {
      const raw = storage().getItem(scopeKey)
      return { state: raw ? parseBackup(raw) : emptyState(), error: null, scopeKey }
    } catch {
      unreadable = true
      return {
        state: emptyState(),
        scopeKey,
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
        storage().setItem(scopeKey, JSON.stringify(next))
        snapshot = { state: next, error: null, scopeKey }
        unsaved.delete(scopeKey)
      } catch {
        snapshot = {
          state: next,
          scopeKey,
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
      snapshot = { state: next, error: null, scopeKey }
      emit()
      return next
    },
    resetState() {
      storage().removeItem(scopeKey)
      dataEpoch++
      unreadable = false
      unsaved.delete(scopeKey)
      snapshot = { state: emptyState(), error: null, scopeKey }
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

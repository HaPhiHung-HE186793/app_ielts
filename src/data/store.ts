import { emptyState, parseBackup, stateSchema, type StudyState } from './schema'

export const STORAGE_KEY = 'moi-ngay.study.v1'
type Snapshot = { state: StudyState; error: string | null }
const listeners = new Set<() => void>()
let unreadable = false
let dataEpoch = 0
export const getDataEpoch = () => dataEpoch

function read(): Snapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return { state: raw ? parseBackup(raw) : emptyState(), error: null }
  } catch {
    unreadable = true
    return {
      state: emptyState(),
      error:
        'Chưa đọc được dữ liệu đã lưu. Bản cũ được giữ nguyên. Bạn có thể tải bản sao trong cài đặt trước khi khôi phục hoặc xóa.',
    }
  }
}

let snapshot = read()
const emit = () => listeners.forEach((listener) => listener())
export const getSnapshot = () => snapshot
export const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function updateState(update: (state: StudyState) => StudyState) {
  const next = update(snapshot.state)
  if (next === snapshot.state) return
  if (unreadable) {
    snapshot = { ...snapshot, state: next }
    emit()
    return
  }
  try {
    stateSchema.parse(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    snapshot = { state: next, error: null }
  } catch {
    snapshot = {
      state: next,
      error:
        'Chưa lưu được thay đổi trên trình duyệt. Hãy giữ tab này và tải bản sao trong cài đặt để tránh mất tiến độ.',
    }
  }
  emit()
}

export function importBackup(raw: string) {
  const next = parseBackup(raw)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  dataEpoch++
  unreadable = false
  snapshot = { state: next, error: null }
  emit()
  return next
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY)
  dataEpoch++
  unreadable = false
  snapshot = { state: emptyState(), error: null }
  emit()
}

export function backupText() {
  if (unreadable) {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? JSON.stringify(snapshot.state, null, 2)
    } catch {
      /* Export current session when storage is unavailable. */
    }
  }
  return JSON.stringify(snapshot.state, null, 2)
}

window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY && event.key !== null) return
  if (snapshot.error && !unreadable) return // Keep unsaved in-memory work.
  dataEpoch++
  unreadable = false
  snapshot = read()
  emit()
})

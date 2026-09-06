import { createStudyStore } from './study-store'
export { STORAGE_KEY } from './study-store'

export const studyStore = createStudyStore(() => localStorage)
let editingAllowed = true
export function setEditingAllowed(value: boolean) {
  editingAllowed = value
}
export const {
  getSnapshot,
  getDataEpoch,
  subscribe,
  switchStudyOwner,
  backupText,
  receiveStorage,
  readGuest,
} = studyStore
export function updateState(update: Parameters<typeof studyStore.updateState>[0]) {
  if (editingAllowed && !studyStore.getSnapshot().sync?.conflict) studyStore.updateState(update)
}
export function importBackup(raw: string) {
  if (!editingAllowed) throw new Error('Another tab is editing this account')
  return studyStore.importBackup(raw)
}
export function resetState() {
  if (!editingAllowed) throw new Error('Another tab is editing this account')
  studyStore.resetState()
}

window.addEventListener('storage', (event) => receiveStorage(event.key))

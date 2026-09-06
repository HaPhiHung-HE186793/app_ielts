import { createStudyStore } from './study-store'
export { STORAGE_KEY } from './study-store'

export const {
  getSnapshot,
  getDataEpoch,
  subscribe,
  switchStudyOwner,
  updateState,
  importBackup,
  resetState,
  backupText,
  receiveStorage,
} = createStudyStore(() => localStorage)

window.addEventListener('storage', (event) => receiveStorage(event.key))

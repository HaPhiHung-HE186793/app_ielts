import { describe, expect, it } from 'vitest'
import { createStudyStore, STORAGE_KEY, studyKey } from './study-store'
import { emptyState } from './schema'
import { startLesson } from '../domain/session'

const alice = { project: 'http://127.0.0.1:54321', userId: 'alice' }
const bob = { ...alice, userId: 'bob' }
function setup() {
  const entries = new Map<string, string>()
  let failWrite = false
  const storage = {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (failWrite) throw new Error('quota')
      entries.set(key, value)
    },
    removeItem: (key: string) => {
      if (failWrite) throw new Error('blocked')
      entries.delete(key)
    },
  }
  return {
    entries,
    storage,
    store: createStudyStore(() => storage),
    quota: (value: boolean) => {
      failWrite = value
    },
  }
}
const draft = (id: string) => startLesson(emptyState(), 'hello', id)

describe('scoped study storage', () => {
  it('keeps guest and two accounts separate and restores each unfinished lesson', () => {
    const { store, entries } = setup()
    store.importBackup(JSON.stringify(draft('guest')))
    store.switchStudyOwner(alice)
    expect(store.getSnapshot().state.draft).toBeNull()
    store.importBackup(JSON.stringify(draft('alice')))
    store.switchStudyOwner(bob)
    expect(store.getSnapshot().state.draft).toBeNull()
    store.importBackup(JSON.stringify(draft('bob')))
    store.switchStudyOwner(null)
    expect(store.getSnapshot().state.draft?.id).toBe('guest')
    store.switchStudyOwner(alice)
    expect(store.getSnapshot().state.draft?.id).toBe('alice')
    expect(entries.size).toBe(3)
    expect(JSON.parse(entries.get(STORAGE_KEY)!).draft.id).toBe('guest')
  })
  it('includes the Supabase project in the account scope', () => {
    const { store } = setup()
    store.switchStudyOwner(alice)
    store.importBackup(JSON.stringify(draft('first-project')))
    store.switchStudyOwner({ ...alice, project: 'https://another.supabase.co' })
    expect(store.getSnapshot().state.draft).toBeNull()
  })
  it('invalidates old callbacks exactly when the owner changes', () => {
    const { store } = setup()
    const epoch = store.getDataEpoch()
    store.switchStudyOwner(alice)
    expect(store.getDataEpoch()).toBe(epoch + 1)
    store.switchStudyOwner(alice)
    expect(store.getDataEpoch()).toBe(epoch + 1)
    store.switchStudyOwner(null)
    expect(store.getDataEpoch()).toBe(epoch + 2)
  })
  it('import and reset only replace the current scope', () => {
    const { store, entries } = setup()
    store.importBackup(JSON.stringify(draft('guest')))
    store.switchStudyOwner(alice)
    store.importBackup(JSON.stringify(draft('alice')))
    expect(() => store.importBackup('{invalid')).toThrow()
    expect(store.getSnapshot().state.draft?.id).toBe('alice')
    store.resetState()
    expect(entries.has(studyKey(alice))).toBe(false)
    expect(JSON.parse(entries.get(STORAGE_KEY)!).draft.id).toBe('guest')
  })
  it('preserves unsaved quota work in memory without showing it to another account', () => {
    const { store, quota } = setup()
    store.switchStudyOwner(alice)
    quota(true)
    store.updateState(() => draft('unsaved-alice'))
    expect(store.getSnapshot().error).not.toBeNull()
    store.switchStudyOwner(bob)
    expect(store.getSnapshot().state.draft).toBeNull()
    store.switchStudyOwner(alice)
    expect(JSON.parse(store.backupText()).draft.id).toBe('unsaved-alice')
    quota(false)
    store.updateState((current) => ({ ...current }))
    expect(store.getSnapshot().error).toBeNull()
  })
  it('keeps corrupt originals and export associated with the right owner', () => {
    const { store, entries } = setup()
    entries.set(studyKey(alice), 'original-corrupt')
    store.switchStudyOwner(alice)
    store.updateState(() => draft('memory'))
    expect(entries.get(studyKey(alice))).toBe('original-corrupt')
    store.switchStudyOwner(bob)
    expect(store.getSnapshot().error).toBeNull()
    store.switchStudyOwner(alice)
    expect(store.backupText()).toBe('original-corrupt')
    expect(store.getSnapshot().state.draft?.id).toBe('memory')
  })
  it('ignores storage events for another owner and reloads only its own data', () => {
    const { store, entries } = setup()
    store.switchStudyOwner(alice)
    entries.set(studyKey(bob), JSON.stringify(draft('bob')))
    store.receiveStorage(studyKey(bob))
    expect(store.getSnapshot().state.draft).toBeNull()
    entries.set(studyKey(alice), JSON.stringify(draft('alice-other-tab')))
    store.receiveStorage(studyKey(alice))
    expect(store.getSnapshot().state.draft?.id).toBe('alice-other-tab')
  })
})

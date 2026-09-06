import { afterEach, describe, expect, it, vi } from 'vitest'
import { createStudyStore, studyKey } from './study-store'
import { createSyncEngine, type SyncPhase, type SyncTransport } from './sync-engine'
import { emptyState } from './schema'
import { startLesson } from '../domain/session'
import type { RemoteStudy } from './sync-schema'

const owner = { project: 'http://127.0.0.1:54321', userId: 'alice' }
function setup() {
  const entries = new Map<string, string>()
  let quota = false
  const storage = {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (quota) throw new Error('quota')
      entries.set(key, value)
    },
    removeItem: (key: string) => {
      entries.delete(key)
    },
  }
  const store = createStudyStore(() => storage)
  store.switchStudyOwner(owner)
  let remote: RemoteStudy = { revision: 0, state: emptyState() }
  const receipts = new Map<string, number>()
  const transport: SyncTransport = {
    read: vi.fn(async () => structuredClone(remote)),
    commit: vi.fn<SyncTransport['commit']>(async (pending) => {
      if (receipts.has(pending.id))
        return { status: 'applied', revision: receipts.get(pending.id)! }
      if (pending.expectedRevision !== remote.revision)
        return { status: 'conflict', ...structuredClone(remote) }
      remote = { revision: remote.revision + 1, state: structuredClone(pending.state) }
      receipts.set(pending.id, remote.revision)
      return { status: 'applied', revision: remote.revision }
    }),
  }
  const phases: SyncPhase[] = []
  let online = true
  const engine = createSyncEngine(
    store,
    transport,
    (phase) => phases.push(phase),
    () => online,
    60_000,
  )
  return {
    store,
    engine,
    transport,
    phases,
    entries,
    storage,
    receipts,
    remote: () => remote,
    setRemote: (next: RemoteStudy) => {
      remote = next
    },
    offline: () => {
      online = false
    },
    online: () => {
      online = true
    },
    quota: () => {
      quota = true
    },
  }
}
afterEach(() => vi.restoreAllMocks())
describe('durable sync engine', () => {
  it('defers remote updates while an unsaved settings form is open', async () => {
    const f = setup()
    try {
      f.engine.enable()
      f.engine.suspend(true)
      f.setRemote({ revision: 1, state: startLesson(emptyState(), 'hello', 'remote-change') })
      await f.engine.run()
      expect(f.transport.read).not.toHaveBeenCalled()
      expect(f.store.getSnapshot().state.draft).toBeNull()
      f.engine.suspend(false)
      await f.engine.run()
      expect(f.store.getSnapshot().state.draft?.id).toBe('remote-change')
    } finally {
      f.engine.dispose()
    }
  })
  it('does not upload existing account data until enabled and excludes metadata from backup', async () => {
    const f = setup()
    try {
      f.store.updateState((state) => startLesson(state, 'hello', 'draft'))
      await f.engine.run()
      expect(f.transport.read).not.toHaveBeenCalled()
      f.engine.enable()
      await f.engine.run()
      expect(f.phases.at(-1)).toBe('synced')
      expect(f.remote().state.draft?.id).toBe('draft')
      expect(JSON.parse(f.store.backupText())._sync).toBeUndefined()
      expect(JSON.parse(f.entries.get(studyKey(owner))!)._sync.base.revision).toBe(1)
    } finally {
      f.engine.dispose()
    }
  })
  it('retries a lost response using the exact persisted mutation ID after reload', async () => {
    const f = setup()
    const commit = f.transport.commit
    let lose = true
    f.transport.commit = async (pending, signal) => {
      const result = await commit(pending, signal)
      if (lose) {
        lose = false
        throw new Error('lost response')
      }
      return result
    }
    f.store.updateState((state) => startLesson(state, 'hello', 'draft'))
    f.engine.enable()
    await f.engine.run()
    const id = f.store.getSnapshot().sync!.pending!.id
    expect(f.phases.at(-1)).toBe('error')
    expect(f.remote().revision).toBe(1)
    f.engine.dispose()
    const reloaded = createStudyStore(() => f.storage)
    reloaded.switchStudyOwner(owner)
    const engine = createSyncEngine(
      reloaded,
      f.transport,
      () => {},
      () => true,
      60_000,
    )
    try {
      await engine.run()
      expect(f.receipts.size).toBe(1)
      expect(f.receipts.has(id)).toBe(true)
      expect(reloaded.getSnapshot().sync!.pending).toBeNull()
    } finally {
      engine.dispose()
    }
  })
  it('keeps edits made during a request queued for a later commit', async () => {
    const f = setup(),
      commit = f.transport.commit
    let edit = true
    f.transport.commit = async (pending, signal) => {
      if (edit) {
        edit = false
        f.store.updateState((state) => ({
          ...state,
          draft: { ...state.draft!, pendingAnswer: 'new typing' },
        }))
      }
      return commit(pending, signal)
    }
    try {
      f.store.updateState((state) => startLesson(state, 'hello', 'draft'))
      f.engine.enable()
      await f.engine.run()
      await f.engine.run()
      expect(f.remote().state.draft?.pendingAnswer).toBe('new typing')
      expect(f.receipts.size).toBe(2)
    } finally {
      f.engine.dispose()
    }
  })
  it('waits offline, then converges after reconnecting', async () => {
    const f = setup()
    try {
      f.engine.enable()
      f.offline()
      f.store.updateState((state) => startLesson(state, 'hello', 'offline'))
      await f.engine.run()
      expect(f.phases.at(-1)).toBe('offline')
      expect(f.transport.commit).not.toHaveBeenCalled()
      f.online()
      await f.engine.run()
      expect(f.remote().state.draft?.id).toBe('offline')
    } finally {
      f.engine.dispose()
    }
  })
  it('persists both conflicting drafts and requires a choice before sending', async () => {
    const f = setup()
    try {
      f.store.updateState((state) => startLesson(state, 'hello', 'local'))
      f.engine.enable()
      f.setRemote({ revision: 1, state: startLesson(emptyState(), 'hello', 'remote') })
      await f.engine.run()
      expect(f.phases.at(-1)).toBe('conflict')
      expect(f.transport.commit).not.toHaveBeenCalled()
      expect(f.store.getSnapshot().sync?.conflict?.local.draft?.id).toBe('local')
      f.engine.resolve('remote')
      await f.engine.run()
      expect(f.store.getSnapshot().state.draft?.id).toBe('remote')
      expect(f.phases.at(-1)).toBe('synced')
    } finally {
      f.engine.dispose()
    }
  })
  it('rejects late responses after changing the owner', async () => {
    const f = setup()
    let release!: (value: RemoteStudy) => void
    f.transport.read = () =>
      new Promise((resolve) => {
        release = resolve
      })
    f.engine.enable()
    const run = f.engine.run()
    f.store.switchStudyOwner({ ...owner, userId: 'bob' })
    release({ revision: 1, state: startLesson(emptyState(), 'hello', 'alice-secret') })
    await run
    f.engine.dispose()
    expect(f.store.getSnapshot().state.draft).toBeNull()
    expect(f.store.getSnapshot().sync).toBeNull()
    expect(f.entries.has(studyKey({ ...owner, userId: 'bob' }))).toBe(false)
  })
  it('never sends an outbox entry that could not be persisted', async () => {
    const f = setup()
    try {
      f.engine.enable()
      f.store.updateState((state) => startLesson(state, 'hello', 'safe'))
      f.quota()
      await f.engine.run()
      expect(f.phases.at(-1)).toBe('error')
      expect(f.transport.commit).not.toHaveBeenCalled()
      expect(f.store.getSnapshot().state.draft?.id).toBe('safe')
    } finally {
      f.engine.dispose()
    }
  })
  it('reset and import stop syncing without deleting the server copy', async () => {
    const f = setup()
    try {
      f.store.updateState((state) => startLesson(state, 'hello', 'saved'))
      f.engine.enable()
      await f.engine.run()
      f.store.resetState()
      await f.engine.run()
      expect(f.remote().state.draft?.id).toBe('saved')
      expect(f.store.getSnapshot().sync).toBeNull()
      f.engine.enable()
      await f.engine.run()
      expect(f.store.getSnapshot().state.draft?.id).toBe('saved')
      f.store.importBackup(JSON.stringify(startLesson(emptyState(), 'hello', 'imported')))
      expect(f.store.getSnapshot().sync).toBeNull()
      expect(f.remote().state.draft?.id).toBe('saved')
    } finally {
      f.engine.dispose()
    }
  })
})

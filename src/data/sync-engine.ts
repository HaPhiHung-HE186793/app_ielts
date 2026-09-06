import { emptyState } from './schema'
import { equal, mergeStudy, type MergeChoice } from '../domain/sync'
import type { createStudyStore } from './study-store'
import type { RemoteStudy, SyncMeta } from './sync-schema'

export type SyncPhase =
  | 'guest'
  | 'waiting'
  | 'unsupported'
  | 'disabled'
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'error'
  | 'conflict'
export type SyncTransport = {
  read(signal: AbortSignal): Promise<RemoteStudy>
  commit(
    pending: NonNullable<SyncMeta['pending']>,
    signal: AbortSignal,
  ): Promise<{ status: 'applied'; revision: number } | ({ status: 'conflict' } & RemoteStudy)>
}
export type StudyStore = ReturnType<typeof createStudyStore>

export function createSyncEngine(
  store: StudyStore,
  transport: SyncTransport,
  report: (phase: SyncPhase) => void,
  online = () => true,
  delay = 800,
) {
  const ownerKey = store.getSnapshot().scopeKey
  let stopped = false,
    busy = false
  let suspended = false
  let controller: AbortController | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  const current = () => !stopped && store.getSnapshot().scopeKey === ownerKey
  const usable = () => current() && !!store.getSnapshot().sync
  let previous = store.getSnapshot()

  function schedule() {
    clearTimeout(timer)
    if (usable())
      timer = setTimeout(() => {
        void run()
      }, delay)
  }
  const unsubscribe = store.subscribe(() => {
    const next = store.getSnapshot()
    if (!current()) {
      controller?.abort()
      return
    }
    if (!next.sync) {
      controller?.abort()
      clearTimeout(timer)
      report('disabled')
    } else if (!busy && (previous.state !== next.state || !previous.sync)) {
      report(next.sync.conflict ? 'conflict' : 'pending')
      schedule()
    }
    previous = next
  })

  function rebase(remote: RemoteStudy) {
    const snap = store.getSnapshot(),
      meta = snap.sync!
    if (remote.revision < meta.base.revision) throw new Error('Server revision moved backward')
    if (remote.revision === meta.base.revision && !equal(remote.state, meta.base.state))
      throw new Error('Server revision changed its content')
    const merged = mergeStudy(meta.base.state, snap.state, remote.state)
    store.writeSync(merged.state, {
      ...meta,
      base: remote,
      pending: null,
      conflict: merged.conflicts.length
        ? { base: meta.base.state, local: snap.state, remote, fields: merged.conflicts }
        : null,
    })
  }

  async function run() {
    if (!usable() || busy || suspended) return
    if (!online()) {
      report('offline')
      return
    }
    if (store.getSnapshot().error) {
      report('error')
      return
    }
    if (store.getSnapshot().sync?.conflict) {
      report('conflict')
      return
    }
    busy = true
    controller = new AbortController()
    const signal = controller.signal
    const valid = () => usable() && !signal.aborted
    let pulled = false,
      failed = false
    report('syncing')
    try {
      // Bounded work per pass. Further typing stays queued for the next pass.
      for (let round = 0; round < 4 && valid(); round++) {
        const pending = store.getSnapshot().sync!.pending
        if (pending) {
          const result = await transport.commit(pending, signal)
          if (!valid()) return
          const snap = store.getSnapshot(),
            meta = snap.sync!
          if (meta.pending?.id !== pending.id) return
          if (result.status === 'conflict')
            rebase({ revision: result.revision, state: result.state })
          else {
            if (result.revision !== pending.expectedRevision + 1)
              throw new Error('Invalid commit receipt')
            store.writeSync(snap.state, {
              ...meta,
              base: { revision: result.revision, state: pending.state },
              pending: null,
            })
          }
          pulled = false // A receipt may be older than another device's latest commit.
        } else if (!pulled) {
          const remote = await transport.read(signal)
          if (!valid()) return
          rebase(remote)
          pulled = true
        }
        if (!valid()) return
        const snap = store.getSnapshot(),
          meta = snap.sync!
        if (meta.conflict) {
          report('conflict')
          return
        }
        if (equal(snap.state, meta.base.state) && !meta.pending && pulled) {
          store.writeSync(snap.state, { ...meta, lastSyncedAt: Date.now() })
          report('synced')
          return
        }
        if (!meta.pending && !equal(snap.state, meta.base.state)) {
          // Persist the exact ID + payload before making a request, atomically with local work.
          store.writeSync(snap.state, {
            ...meta,
            pending: {
              id: crypto.randomUUID(),
              expectedRevision: meta.base.revision,
              state: snap.state,
            },
          })
        }
      }
      if (valid()) report('pending')
    } catch {
      failed = true
      if (valid()) report(online() ? 'error' : 'offline')
    } finally {
      busy = false
      controller = null
      if (
        !failed &&
        usable() &&
        !store.getSnapshot().sync?.conflict &&
        (store.getSnapshot().sync?.pending ||
          !equal(store.getSnapshot().state, store.getSnapshot().sync?.base.state))
      )
        schedule()
    }
  }

  if (store.getSnapshot().sync) schedule()
  else report('disabled')
  return {
    run,
    suspend(value: boolean) {
      suspended = value
      if (value) controller?.abort()
      else schedule()
    },
    enable() {
      if (!current()) return
      const snap = store.getSnapshot()
      if (!snap.sync)
        store.writeSync(snap.state, {
          version: 1,
          base: { revision: 0, state: emptyState() },
          pending: null,
          conflict: null,
          lastSyncedAt: null,
        })
      schedule()
    },
    pause() {
      if (!current()) return
      controller?.abort()
      store.writeSync(store.getSnapshot().state, null)
    },
    resolve(choice: MergeChoice) {
      if (!current()) return
      const snap = store.getSnapshot(),
        meta = snap.sync!,
        conflict = meta?.conflict
      if (!conflict) return
      const merged = mergeStudy(conflict.base, conflict.local, conflict.remote.state, choice)
      store.writeSync(merged.state, {
        ...meta,
        base: conflict.remote,
        conflict: null,
        pending: null,
      })
      schedule()
    },
    dispose() {
      stopped = true
      clearTimeout(timer)
      controller?.abort()
      unsubscribe()
    },
  }
}

import { test, expect } from '@playwright/test'
import { cleanupAccount, createTestAccount, publicClient } from './helpers'
import { emptyState } from '../../src/data/schema'
import { startLesson } from '../../src/domain/session'

test('study RPC checks ownership, rejects direct writes and validates request shape', async () => {
  const a = await createTestAccount(),
    b = await createTestAccount()
  const request = {
    p_owner: a.id,
    p_mutation: crypto.randomUUID(),
    p_expected_revision: 0,
    p_state: startLesson(emptyState(), 'hello', 'private-A'),
  }
  try {
    expect((await publicClient().rpc('commit_study', request)).error).not.toBeNull()
    expect((await b.client.rpc('commit_study', request)).error).not.toBeNull()
    const saved = await a.client.rpc('commit_study', request)
    expect(saved.error).toBeNull()
    expect(saved.data).toEqual({ status: 'applied', revision: 1 })
    for (const table of ['study_snapshots', 'study_commits']) {
      expect((await b.client.from(table).select('*')).data).toEqual([])
      expect((await publicClient().from(table).select('*')).error).not.toBeNull()
      expect((await a.client.from(table).delete().eq('user_id', a.id)).error).not.toBeNull()
      expect(
        (await a.client.from(table).update({ state: emptyState() }).eq('user_id', a.id)).error,
      ).not.toBeNull()
      expect(
        (await b.client.from(table).insert({ user_id: a.id, state: emptyState(), revision: 99 }))
          .error,
      ).not.toBeNull()
    }
    expect(
      (await a.client.from('study_commits').update({ changes: {} }).eq('user_id', a.id)).error,
    ).not.toBeNull()
    expect(
      (
        await a.client.from('study_commits').insert({
          user_id: a.id,
          mutation_id: crypto.randomUUID(),
          base_revision: 0,
          revision: 99,
          payload_hash: 'a'.repeat(64),
          changes: {},
        })
      ).error,
    ).not.toBeNull()
    expect((await a.client.rpc('commit_study', { ...request, p_owner: b.id })).error).not.toBeNull()
    for (const state of [
      { version: 99 },
      { ...emptyState(), extra: 'unexpected' },
      { ...emptyState(), reviewLog: null },
      { ...emptyState(), draft: 'wrong type' },
      { ...emptyState(), quickLog: [{}] },
      { ...emptyState(), quickLog: [{ id: 'duplicate' }, { id: 'duplicate' }] },
    ]) {
      expect(
        (
          await a.client.rpc('commit_study', {
            ...request,
            p_mutation: crypto.randomUUID(),
            p_expected_revision: 1,
            p_state: state,
          })
        ).error,
      ).not.toBeNull()
    }
    expect(
      (await a.client.from('study_snapshots').select('revision').single()).data?.revision,
    ).toBe(1)
  } finally {
    await cleanupAccount(a.id, a.email)
    await cleanupAccount(b.id, b.email)
  }
})

test('concurrent commits use CAS and identical retries keep a single immutable receipt', async () => {
  const account = await createTestAccount()
  try {
    const a = {
      p_owner: account.id,
      p_mutation: crypto.randomUUID(),
      p_expected_revision: 0,
      p_state: startLesson(emptyState(), 'hello', 'draft-A'),
    }
    const b = {
      ...a,
      p_mutation: crypto.randomUUID(),
      p_state: startLesson(emptyState(), 'hello', 'draft-B'),
    }
    const results = await Promise.all([
      account.client.rpc('commit_study', a),
      account.client.rpc('commit_study', b),
    ])
    expect(results.every((result) => !result.error)).toBe(true)
    expect(results.map((result) => result.data.status).sort()).toEqual(['applied', 'conflict'])
    const winner = results[0].data.status === 'applied' ? a : b
    const retries = await Promise.all([
      account.client.rpc('commit_study', winner),
      account.client.rpc('commit_study', winner),
    ])
    expect(retries.map((result) => result.data)).toEqual([
      { status: 'applied', revision: 1 },
      { status: 'applied', revision: 1 },
    ])
    expect((await account.client.from('study_commits').select('revision')).data).toEqual([
      { revision: 1 },
    ])
    expect(
      (await account.client.rpc('commit_study', { ...winner, p_state: emptyState() })).error,
    ).not.toBeNull()
    expect(
      (await account.client.rpc('commit_study', { ...winner, p_expected_revision: 1 })).error,
    ).not.toBeNull()
    const second = {
      ...winner,
      p_mutation: crypto.randomUUID(),
      p_expected_revision: 1,
      p_state: {
        ...winner.p_state,
        draft: { ...winner.p_state.draft!, pendingAnswer: 'revision 2' },
      },
    }
    expect((await account.client.rpc('commit_study', second)).data).toEqual({
      status: 'applied',
      revision: 2,
    })
    const journal = await account.client
      .from('study_commits')
      .select('changes,payload_hash')
      .eq('revision', 2)
      .single()
    expect(journal.data?.changes).toEqual({ draft: second.p_state.draft })
    expect(journal.data?.payload_hash).toHaveLength(64)
    expect((await account.client.rpc('commit_study', winner)).data).toEqual({
      status: 'applied',
      revision: 1,
    })
    expect(
      (await account.client.from('study_snapshots').select('state').single()).data?.state.draft
        .pendingAnswer,
    ).toBe('revision 2')
  } finally {
    await cleanupAccount(account.id, account.email)
  }
})

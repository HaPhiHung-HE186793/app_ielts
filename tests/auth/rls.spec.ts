import { test, expect } from '@playwright/test'
import { cleanupAccount, createTestAccount, publicClient } from './helpers'

test('real Auth and RLS isolate two account profiles and deny anonymous or forged access', async () => {
  const alice = await createTestAccount()
  const bob = await createTestAccount()
  try {
    const own = await alice.client
      .from('account_profiles')
      .upsert({ id: alice.id, display_name: 'Alice local test' })
      .select()
      .single()
    expect(own.error).toBeNull()
    expect(own.data.display_name).toBe('Alice local test')
    expect(
      (
        await alice.client
          .from('account_profiles')
          .upsert({ id: alice.id, display_name: 'Alice revised' })
      ).error,
    ).toBeNull()
    const hidden = await bob.client.from('account_profiles').select('*')
    expect(hidden.error).toBeNull()
    expect(hidden.data).toEqual([])
    expect(
      (await bob.client.from('account_profiles').insert({ id: alice.id, display_name: 'forged' }))
        .error,
    ).not.toBeNull()
    const crossUpdate = await bob.client
      .from('account_profiles')
      .update({ display_name: 'forged' })
      .eq('id', alice.id)
      .select()
    expect(crossUpdate.error).toBeNull()
    expect(crossUpdate.data).toEqual([])
    expect(
      (await bob.client.from('account_profiles').delete().eq('id', alice.id).select()).data,
    ).toEqual([])
    expect(
      (await alice.client.from('account_profiles').update({ id: bob.id }).eq('id', alice.id)).error,
    ).not.toBeNull()
    expect(
      (
        await alice.client
          .from('account_profiles')
          .update({ created_at: '2000-01-01' })
          .eq('id', alice.id)
      ).error,
    ).not.toBeNull()
    expect(
      (
        await alice.client
          .from('account_profiles')
          .update({ display_name: 'x'.repeat(41) })
          .eq('id', alice.id)
      ).error,
    ).not.toBeNull()
    expect(
      (await alice.client.from('account_profiles').select('display_name').single()).data
        ?.display_name,
    ).toBe('Alice revised')
    const guest = publicClient()
    expect((await guest.from('account_profiles').select('*')).error).not.toBeNull()
    expect(
      (await guest.from('account_profiles').insert({ id: bob.id, display_name: 'guest' })).error,
    ).not.toBeNull()
    expect(
      (
        await bob.client
          .from('account_profiles')
          .insert({ id: bob.id, display_name: 'Bob local test' })
      ).error,
    ).toBeNull()
    expect((await bob.client.from('account_profiles').select('id')).data).toEqual([{ id: bob.id }])
    expect(
      (await alice.client.from('account_profiles').delete().eq('id', alice.id)).error,
    ).toBeNull()
    await alice.client.auth.signOut({ scope: 'local' })
    expect((await alice.client.from('account_profiles').select('*')).error).not.toBeNull()
  } finally {
    await cleanupAccount(alice.id, alice.email)
    await cleanupAccount(bob.id, bob.email)
  }
})

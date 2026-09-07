import { test, expect } from '@playwright/test'
import { admin, cleanupAccount, createTestAccount, publicClient } from './helpers'

const settings = {
  time: '20:30',
  timezone: 'Asia/Ho_Chi_Minh',
  days: [1, 2, 3, 4, 5, 6, 7],
  quietEnabled: true,
  quietStart: '22:00',
  quietEnd: '07:00',
}
async function request(owner: string) {
  const service = await admin.from('reminder_service').select('public_key').single()
  expect(service.error).toBeNull()
  return {
    p_owner: owner,
    p_id: crypto.randomUUID(),
    p_revision: 0,
    p_enabled: true,
    p_settings: settings,
    p_public_key: service.data!.public_key,
    p_subscription: {
      endpoint: `https://fcm.googleapis.com/fcm/send/test-${crypto.randomUUID()}`,
      keys: { p256dh: 'A'.repeat(87), auth: 'B'.repeat(22) },
    },
  }
}
test('reminder RPC isolates owners, checks revisions and rejects malformed settings/subscriptions', async () => {
  const a = await createTestAccount(),
    b = await createTestAccount()
  try {
    const req = await request(a.id)
    expect((await publicClient().rpc('save_reminder', req)).error).not.toBeNull()
    expect((await b.client.rpc('save_reminder', req)).error).not.toBeNull()
    for (const patch of [
      { p_owner: null },
      { p_revision: null },
      { p_enabled: null },
      { p_settings: null },
      { p_settings: { ...settings, days: [] } },
      { p_settings: { ...settings, days: [1, 1] } },
      { p_settings: { ...settings, timezone: 'Mars/A' } },
      { p_settings: { ...settings, time: '23:00' } },
      { p_subscription: { keys: req.p_subscription.keys } },
      { p_subscription: { ...req.p_subscription, endpoint: 'https://fcmXgoogleapisXcom/a' } },
    ]) {
      expect((await a.client.rpc('save_reminder', { ...req, ...patch })).error).not.toBeNull()
    }
    const saved = await a.client.rpc('save_reminder', req)
    expect(saved.error).toBeNull()
    expect(saved.data.revision).toBe(1)
    for (const table of ['reminder_devices', 'reminder_deliveries']) {
      expect((await b.client.from(table).select('*')).data).toEqual([])
      expect((await publicClient().from(table).select('*')).error).not.toBeNull()
      expect((await a.client.from(table).delete().eq('user_id', a.id)).error).not.toBeNull()
    }
    expect(
      (await a.client.from('reminder_devices').update({ enabled: false }).eq('id', req.p_id)).error,
    ).not.toBeNull()
    expect(
      (
        await a.client
          .from('reminder_service')
          .update({ heartbeat_at: new Date().toISOString() })
          .eq('id', true)
      ).error,
    ).not.toBeNull()
    expect((await a.client.rpc('claim_reminders')).error).not.toBeNull()
    expect(
      (await a.client.rpc('snooze_reminder', { p_owner: a.id, p_id: req.p_id, p_revision: null }))
        .error,
    ).not.toBeNull()
    const edits = await Promise.all([
      a.client.rpc('save_reminder', { ...req, p_revision: 1 }),
      a.client.rpc('save_reminder', { ...req, p_revision: 1 }),
    ])
    expect(edits.filter((r) => !r.error)).toHaveLength(1)
    expect(edits.filter((r) => r.error)).toHaveLength(1)
  } finally {
    await cleanupAccount(a.id, a.email)
    await cleanupAccount(b.id, b.email)
  }
})

test('server calendar observes weekdays, local dates, quiet boundaries and both DST transitions', async () => {
  const next = async (after: string, patch = {}) => {
    const result = await admin.rpc('reminder_next', {
      p_after: after,
      p_settings: { ...settings, ...patch },
    })
    expect(result.error).toBeNull()
    return new Date(result.data).toISOString()
  }
  expect(await next('2026-09-07T13:29:59Z')).toBe('2026-09-07T13:30:00.000Z')
  expect(await next('2026-09-07T13:30:00Z')).toBe('2026-09-08T13:30:00.000Z')
  expect(await next('2026-09-07T14:00:00Z', { days: [1] })).toBe('2026-09-14T13:30:00.000Z')
  expect(
    await next('2026-03-08T05:00:00Z', {
      timezone: 'America/New_York',
      time: '02:30',
      quietEnabled: false,
    }),
  ).toBe('2026-03-09T06:30:00.000Z')
  expect(
    await next('2026-11-01T04:00:00Z', {
      timezone: 'America/New_York',
      time: '01:30',
      quietEnabled: false,
    }),
  ).toBe('2026-11-01T06:30:00.000Z')
  for (const [at, quiet] of [
    ['2026-09-07T14:59:59Z', false],
    ['2026-09-07T15:00:00Z', true],
    ['2026-09-08T00:00:00Z', false],
  ] as const) {
    expect((await admin.rpc('reminder_quiet', { p_at: at, p_settings: settings })).data).toBe(quiet)
  }
})

test('claims are durable, one per local day, stale/quiet skipped and changed schedules cancel old pushes', async () => {
  const a = await createTestAccount()
  try {
    const req = await request(a.id)
    expect((await a.client.rpc('save_reminder', req)).error).toBeNull()
    const at = '2026-09-07T13:30:00Z'
    await admin.from('reminder_devices').update({ next_at: at }).eq('id', req.p_id)
    const results = await Promise.all([
      admin.rpc('claim_reminders', { p_now: at, p_device: req.p_id }),
      admin.rpc('claim_reminders', { p_now: at, p_device: req.p_id }),
    ])
    expect(results.every((r) => !r.error)).toBe(true)
    const receipts = results.flatMap((r) => r.data).filter((r) => r.device_id === req.p_id)
    expect(receipts).toHaveLength(1)
    await admin.from('reminder_devices').update({ next_at: at }).eq('id', req.p_id)
    expect((await admin.rpc('claim_reminders', { p_now: at, p_device: req.p_id })).data).toEqual([])
    const disabled = await a.client.rpc('save_reminder', {
      ...req,
      p_revision: 1,
      p_enabled: false,
    })
    expect(disabled.error).toBeNull()
    expect(
      (await admin.rpc('prepare_reminder', { p_delivery: receipts[0].id, p_now: at })).data,
    ).toBeNull()
    expect(
      (await a.client.from('reminder_deliveries').select('status').single()).data?.status,
    ).toBe('cancelled')
    for (const [due, now] of [
      ['2026-09-08T13:30:00Z', '2026-09-08T13:31:01Z'],
      ['2026-09-09T15:00:00Z', '2026-09-09T15:00:00Z'],
    ]) {
      await admin
        .from('reminder_devices')
        .update({ enabled: true, next_at: due })
        .eq('id', req.p_id)
      expect((await admin.rpc('claim_reminders', { p_now: now, p_device: req.p_id })).data).toEqual(
        [],
      )
    }
  } finally {
    await cleanupAccount(a.id, a.email)
  }
})

test('snooze avoids quiet time; expired endpoint stops and an old failure cannot disable a newer revision', async () => {
  const a = await createTestAccount()
  try {
    const req = await request(a.id)
    const saved = await a.client.rpc('save_reminder', req)
    expect(saved.error).toBeNull()
    // Pick a future evening using the server-produced date, so this test does not age out.
    const due = new Date(saved.data.next_at)
    due.setUTCHours(14, 45, 0, 0)
    await admin.from('reminder_devices').update({ next_at: due.toISOString() }).eq('id', req.p_id)
    const snoozed = await a.client.rpc('snooze_reminder', {
      p_owner: a.id,
      p_id: req.p_id,
      p_revision: 1,
    })
    expect(snoozed.error).toBeNull()
    expect(new Date(snoozed.data.next_at).getUTCHours()).toBe(0)
    const at = snoozed.data.next_at
    const receipt = (await admin.rpc('claim_reminders', { p_now: at, p_device: req.p_id })).data[0]
    expect(
      (await admin.rpc('prepare_reminder', { p_delivery: receipt.id, p_now: at })).data.deviceId,
    ).toBe(req.p_id)
    expect(
      (await admin.rpc('prepare_reminder', { p_delivery: receipt.id, p_now: at })).data,
    ).toBeNull()
    expect((await a.client.rpc('save_reminder', { ...req, p_revision: 2 })).error).toBeNull()
    expect(
      (await admin.rpc('finish_reminder', { p_delivery: receipt.id, p_status: 'expired' })).error,
    ).toBeNull()
    expect((await a.client.from('reminder_devices').select('enabled').single()).data?.enabled).toBe(
      true,
    )
    const later = new Date(Date.parse(at) + 86400_000).toISOString()
    await admin.from('reminder_devices').update({ next_at: later }).eq('id', req.p_id)
    const last = (await admin.rpc('claim_reminders', { p_now: later, p_device: req.p_id })).data[0]
    await admin.rpc('prepare_reminder', { p_delivery: last.id, p_now: later })
    await admin.rpc('finish_reminder', { p_delivery: last.id, p_status: 'expired' })
    const final = (
      await a.client.from('reminder_devices').select('enabled,subscription,next_at').single()
    ).data
    expect(final).toEqual({ enabled: false, subscription: null, next_at: null })
  } finally {
    await cleanupAccount(a.id, a.email)
  }
})

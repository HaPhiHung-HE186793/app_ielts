import { describe, expect, it } from 'vitest'
import { defaultReminderSettings, inQuietHours, reminderSettingsSchema } from './schema'
import { reminderMayDisplay } from '../../reminders/push-store'
import { sendDueReminders, supportedEndpoint } from '../../../scripts/reminder-sender'

const settings = { ...defaultReminderSettings(), timezone: 'Asia/Ho_Chi_Minh' }
describe('reminder settings and worker guards', () => {
  it('validates days, timezone, clocks and quiet boundaries', () => {
    expect(reminderSettingsSchema.safeParse(settings).success).toBe(true)
    for (const patch of [
      { days: [] },
      { days: [1, 1] },
      { days: [8] },
      { timezone: 'Mars/A' },
      { time: '24:00' },
      { time: '22:00' },
      { time: '06:59' },
      { quietEnd: '22:00' },
    ]) {
      expect(reminderSettingsSchema.safeParse({ ...settings, ...patch }).success).toBe(false)
    }
    expect(reminderSettingsSchema.safeParse({ ...settings, time: '07:00' }).success).toBe(true)
    expect(
      inQuietHours('13:00', { quietEnabled: true, quietStart: '12:00', quietEnd: '14:00' }),
    ).toBe(true)
    expect(
      inQuietHours('14:00', { quietEnabled: true, quietStart: '12:00', quietEnd: '14:00' }),
    ).toBe(false)
  })
  it('requires matching enabled revision, local date, expiry and an unseen day', () => {
    const now = Date.parse('2026-09-07T13:30:00Z')
    const binding = { owner: 'a', deviceId: 'device', revision: 2, enabled: true, settings }
    const payload = {
      kind: 'study-reminder',
      deviceId: 'device',
      revision: 2,
      day: '2026-09-07',
      expiresAt: now + 60_000,
    }
    expect(reminderMayDisplay(binding, payload, now)).toBe(true)
    for (const patch of [
      { enabled: false },
      { deviceId: 'other' },
      { revision: 3 },
      { lastDay: payload.day },
    ])
      expect(reminderMayDisplay({ ...binding, ...patch }, payload, now)).toBe(false)
    for (const patch of [
      { kind: 'other' },
      { day: '2026-09-08' },
      { expiresAt: now - 1 },
      { expiresAt: now + 180_000 },
    ])
      expect(reminderMayDisplay(binding, { ...payload, ...patch }, now)).toBe(false)
    const quiet = Date.parse('2026-09-07T15:00:00Z')
    expect(reminderMayDisplay(binding, { ...payload, expiresAt: quiet + 60_000 }, quiet)).toBe(
      false,
    )
    expect(reminderMayDisplay(null, payload, now)).toBe(false)
  })
})
describe('sender boundary', () => {
  it('accepts only supported HTTPS push hosts', () => {
    expect(supportedEndpoint('https://fcm.googleapis.com/fcm/send/abc')).toBe(true)
    for (const endpoint of [
      'http://fcm.googleapis.com/a',
      'https://fcmXgoogleapisXcom/a',
      'https://fcm.googleapis.com.attacker.test/a',
      'https://127.0.0.1/a',
      'https://u:p@fcm.googleapis.com/a',
      'https://fcm.googleapis.com/a?token=x',
    ])
      expect(supportedEndpoint(endpoint)).toBe(false)
  })
  it('records an attempt before sending and never retries an unknown network outcome', async () => {
    const calls: string[] = []
    const fake = {
      rpc: async (name: string, args?: { p_status: string }) => {
        calls.push(name + (args?.p_status ? ':' + args.p_status : ''))
        return {
          error: null,
          data:
            name === 'claim_reminders'
              ? [{ id: 'receipt' }]
              : name === 'prepare_reminder'
                ? {
                    id: 'receipt',
                    deviceId: 'd',
                    revision: 1,
                    day: '2026-09-07',
                    subscription: { endpoint: 'https://fcm.googleapis.com/a' },
                  }
                : null,
        }
      },
    }
    const result = await sendDueReminders(
      fake,
      {},
      async (_sub: unknown, _payload: string, options: { TTL: number }) => {
        calls.push('send')
        expect(options.TTL).toBe(0)
        throw new Error('unknown network outcome')
      },
    )
    expect(result.failed).toBe(1)
    expect(calls).toEqual(['claim_reminders', 'prepare_reminder', 'send', 'finish_reminder:failed'])
  })
})

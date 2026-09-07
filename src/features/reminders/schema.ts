import { z } from 'zod'

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
export const reminderSettingsSchema = z
  .object({
    time,
    timezone: z
      .string()
      .min(1)
      .max(100)
      .refine((zone) => {
        try {
          new Intl.DateTimeFormat('en', { timeZone: zone }).format()
          return true
        } catch {
          return false
        }
      }),
    days: z
      .array(z.number().int().min(1).max(7))
      .min(1)
      .max(7)
      .refine((days) => new Set(days).size === days.length),
    quietEnabled: z.boolean(),
    quietStart: time,
    quietEnd: time,
  })
  .refine(
    (settings) =>
      !settings.quietEnabled ||
      (settings.quietStart !== settings.quietEnd && !inQuietHours(settings.time, settings)),
    { message: 'Chọn giờ nhắc ngoài khoảng yên lặng.' },
  )
export type ReminderSettings = z.infer<typeof reminderSettingsSchema>
export function inQuietHours(
  value: string,
  settings: { quietEnabled: boolean; quietStart: string; quietEnd: string },
) {
  if (!settings.quietEnabled) return false
  return settings.quietStart < settings.quietEnd
    ? value >= settings.quietStart && value < settings.quietEnd
    : value >= settings.quietStart || value < settings.quietEnd
}
export const defaultReminderSettings = (): ReminderSettings => ({
  time: '20:30',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  days: [1, 2, 3, 4, 5, 6, 7],
  quietEnabled: true,
  quietStart: '22:00',
  quietEnd: '07:00',
})
export const reminderDeviceSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  revision: z.number().int().positive(),
  enabled: z.boolean(),
  settings: reminderSettingsSchema,
  next_at: z.string().nullable(),
  last_status: z.string(),
  subscription: z.unknown().nullable(),
})
export type ReminderDevice = z.infer<typeof reminderDeviceSchema>

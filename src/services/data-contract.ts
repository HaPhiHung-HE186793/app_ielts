import { z } from 'zod'
import { stateSchema } from '../data/schema.ts'
import { reminderSettingsSchema } from '../features/reminders/schema.ts'

const owner = { owner: z.uuid() }
export const dataRequestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('profile.read'), ...owner }).strict(),
  z
    .object({ action: z.literal('profile.save'), ...owner, name: z.string().trim().max(40) })
    .strict(),
  z.object({ action: z.literal('study.read'), ...owner }).strict(),
  z
    .object({
      action: z.literal('study.commit'),
      ...owner,
      mutation: z.uuid(),
      revision: z
        .number()
        .int()
        .min(0)
        .max(Number.MAX_SAFE_INTEGER - 1),
      state: stateSchema,
    })
    .strict(),
  z.object({ action: z.literal('reminders.read'), ...owner, device: z.uuid() }).strict(),
  z
    .object({
      action: z.literal('reminders.save'),
      ...owner,
      device: z.uuid(),
      revision: z.number().int().nonnegative(),
      enabled: z.boolean(),
      settings: reminderSettingsSchema,
      subscription: z.record(z.string(), z.unknown()).nullable(),
      publicKey: z.string().max(200).nullable(),
    })
    .strict(),
  z
    .object({
      action: z.literal('reminders.snooze'),
      ...owner,
      device: z.uuid(),
      revision: z.number().int().nonnegative(),
    })
    .strict(),
])
export type DataRequest = z.infer<typeof dataRequestSchema>

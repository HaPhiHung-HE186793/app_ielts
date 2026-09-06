import { z } from 'zod'
import { stateSchema, type StudyState } from './schema'

export const remoteStudySchema = z.object({
  revision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  state: stateSchema,
})
export type RemoteStudy = z.infer<typeof remoteStudySchema>
export const syncMetaSchema = z.object({
  version: z.literal(1),
  base: remoteStudySchema,
  pending: z
    .object({ id: z.uuid(), expectedRevision: z.number().int().nonnegative(), state: stateSchema })
    .nullable(),
  conflict: z
    .object({
      base: stateSchema,
      local: stateSchema,
      remote: remoteStudySchema,
      fields: z.array(z.string().max(100)).max(12),
    })
    .nullable(),
  lastSyncedAt: z.number().finite().nonnegative().nullable(),
})
export type SyncMeta = z.infer<typeof syncMetaSchema>
export function encodeStudy(state: StudyState, sync: SyncMeta | null) {
  return JSON.stringify(sync ? { ...state, _sync: sync } : state)
}

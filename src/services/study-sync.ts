import { z } from 'zod'
import { supabase } from './supabase'
import { isNeon } from './backend'
import { neonRequest } from './neon-request'
import { emptyState } from '../data/schema'
import { remoteStudySchema } from '../data/sync-schema'
import type { SyncTransport } from '../data/sync-engine'

const receiptSchema = z.object({
  status: z.literal('applied'),
  revision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
})
export function studyTransport(owner: string): SyncTransport {
  return {
    async read(signal) {
      if (isNeon) {
        const data = await neonRequest({ action: 'study.read', owner }, signal)
        return data ? remoteStudySchema.parse(data) : { revision: 0, state: emptyState() }
      }
      const { data, error } = await supabase!
        .from('study_snapshots')
        .select('revision,state')
        .eq('user_id', owner)
        .retry(false)
        .abortSignal(signal)
        .maybeSingle()
      if (error) throw new Error('Cannot read study data')
      return data ? remoteStudySchema.parse(data) : { revision: 0, state: emptyState() }
    },
    async commit(pending, signal) {
      if (isNeon) {
        const data = await neonRequest(
          {
            action: 'study.commit',
            owner,
            mutation: pending.id,
            revision: pending.expectedRevision,
            state: pending.state,
          },
          signal,
        )
        if (data && typeof data === 'object' && 'status' in data && data.status === 'conflict')
          return { status: 'conflict', ...remoteStudySchema.parse(data) }
        return receiptSchema.parse(data)
      }
      const { data, error } = await supabase!
        .rpc('commit_study', {
          p_owner: owner,
          p_mutation: pending.id,
          p_expected_revision: pending.expectedRevision,
          p_state: pending.state,
        })
        .abortSignal(signal)
      if (error) throw new Error('Cannot commit study data')
      if (data?.status === 'conflict')
        return { status: 'conflict', ...remoteStudySchema.parse(data) }
      return receiptSchema.parse(data)
    },
  }
}

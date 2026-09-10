import { z } from 'zod'
import { isNeon } from './backend'
import { supabase } from './supabase'
import { neonRequest } from './neon-request'

export async function readProfile(owner: string, signal: AbortSignal) {
  try {
    const result = isNeon
      ? { data: await neonRequest({ action: 'profile.read', owner }, signal), error: null }
      : await supabase!
          .from('account_profiles')
          .select('display_name')
          .retry(false)
          .eq('id', owner)
          .abortSignal(signal)
          .maybeSingle()
    if (result.error) throw new Error()
    return {
      data: z.object({ display_name: z.string() }).nullable().parse(result.data),
      error: null,
    }
  } catch {
    return { data: null, error: 'unavailable' }
  }
}
export async function saveProfile(owner: string, name: string) {
  try {
    if (isNeon) {
      await neonRequest({ action: 'profile.save', owner, name })
      return { error: null }
    }
    return await supabase!.from('account_profiles').upsert({ id: owner, display_name: name })
  } catch {
    return { error: 'unavailable' }
  }
}

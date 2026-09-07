import { createClient } from '@supabase/supabase-js'
import { readPublicConfig } from './supabase-config'

export const publicConfig = readPublicConfig(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)
export const authStorageKey =
  publicConfig.status === 'ready' ? `moi-ngay.auth:${encodeURIComponent(publicConfig.url)}` : null
export const supabase =
  publicConfig.status === 'ready'
    ? createClient(publicConfig.url, publicConfig.key, {
        auth: {
          storageKey: authStorageKey!,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false, // OTP entry does not need auth tokens in hash routes.
        },
        global: {
          fetch: (input, init) => {
            const timeout = AbortSignal.timeout(12_000)
            const original = init?.signal ?? (input instanceof Request ? input.signal : undefined)
            return fetch(input, {
              ...init,
              signal: original ? AbortSignal.any([original, timeout]) : timeout,
            })
          },
        },
      })
    : null

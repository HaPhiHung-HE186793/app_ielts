import { supabase, publicConfig as legacyConfig, authStorageKey as legacyKey } from './supabase'
import { neonAuthUrl } from './neon-config'
import { createNeonAuth, type AuthPort } from './neon-auth'

const input = import.meta.env.VITE_NEON_AUTH_URL?.trim() ?? ''
export const isNeon = !!input
function config() {
  if (!input) return legacyConfig
  try {
    return { status: 'ready' as const, url: neonAuthUrl(input), key: '' }
  } catch {
    return { status: 'invalid' as const, reason: 'Cấu hình tài khoản chưa hợp lệ.' }
  }
}
export const publicConfig = config()
export const authStorageKey =
  isNeon && publicConfig.status === 'ready'
    ? `moi-ngay.neon-auth:${encodeURIComponent(publicConfig.url)}`
    : legacyKey
export const authClient: AuthPort | null = isNeon
  ? publicConfig.status === 'ready'
    ? createNeonAuth(authStorageKey!)
    : null
  : (supabase?.auth ?? null)

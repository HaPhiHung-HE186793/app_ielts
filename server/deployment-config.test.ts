import { describe, expect, it } from 'vitest'
import { readDeploymentConfig } from './deployment-config'

const env = {
  SUPABASE_URL: 'https://testproject.supabase.co',
  SUPABASE_SECRET_KEY: 'sb_secret_TEST_ONLY_0123456789',
  APP_ORIGINS: 'https://moi-ngay-test.vercel.app',
}

describe('Render configuration', () => {
  it('defaults to disabled unpaid AI and Render port without requiring an AI key', () => {
    const config = readDeploymentConfig(env)
    expect(config.port).toBe(10000)
    expect(config.ai).toEqual({ enabled: false, apiKey: '', totalBudgetMicroUsd: 0 })
    expect(readDeploymentConfig({ ...env, APP_ORIGINS: '' }).origins).toEqual([])
  })
  it('rejects local backend, browser keys and missing configuration without echoing a secret', () => {
    for (const patch of [
      { SUPABASE_URL: 'http://127.0.0.1:54321' },
      { SUPABASE_SECRET_KEY: 'sb_publishable_01234567890123456789' },
      { SUPABASE_SECRET_KEY: 'MY_PRIVATE_TEST_VALUE' },
      { SUPABASE_URL: undefined },
    ]) {
      expect(() => readDeploymentConfig({ ...env, ...patch })).toThrow()
      try {
        readDeploymentConfig({ ...env, ...patch })
      } catch (error) {
        expect(String(error)).not.toContain('MY_PRIVATE_TEST_VALUE')
      }
    }
  })
  it('requires exact HTTPS origins and valid port', () => {
    for (const APP_ORIGINS of [
      'https://*.vercel.app',
      'http://localhost:4173',
      'https://app.vercel.app/path',
      'https://app.vercel.app/',
    ])
      expect(() => readDeploymentConfig({ ...env, APP_ORIGINS })).toThrow()
    for (const PORT of ['0', '65536', 'abc', '10.5'])
      expect(() => readDeploymentConfig({ ...env, PORT })).toThrow()
    expect(
      readDeploymentConfig({
        ...env,
        PORT: '8788',
        APP_ORIGINS: 'https://one.vercel.app, https://two.vercel.app',
      }).origins,
    ).toHaveLength(2)
  })
  it('does not allow accidental paid activation with a key but no budget', () => {
    expect(() =>
      readDeploymentConfig({ ...env, AI_ENABLED: 'true', OPENAI_API_KEY: 'test-only' }),
    ).toThrow()
  })
})

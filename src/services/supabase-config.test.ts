import { expect, it } from 'vitest'
import { readPublicConfig } from './supabase-config'
const key = 'sb_publishable_test_public_configuration'
it('disables accounts when both public settings are absent', () => {
  expect(readPublicConfig()).toEqual({ status: 'disabled' })
})
it('accepts HTTPS and normalizes an origin', () => {
  expect(readPublicConfig(' https://project.supabase.co/ ', key)).toEqual({
    status: 'ready',
    url: 'https://project.supabase.co',
    key,
  })
})
it('permits HTTP only for loopback development', () => {
  expect(readPublicConfig('http://127.0.0.1:54321', key).status).toBe('ready')
  expect(readPublicConfig('http://192.168.1.5:54321', key).status).toBe('invalid')
})
it('rejects secret or JWT keys rather than bundling a legacy service key', () => {
  for (const unsafe of ['sb_secret_test_not_a_real_key', 'eyJ.legacy.jwt', 'placeholder']) {
    expect(readPublicConfig('https://project.supabase.co', unsafe).status).toBe('invalid')
  }
})
it('rejects incomplete and credential-bearing configuration', () => {
  for (const url of [
    '',
    'https://user:pass@project.supabase.co',
    'https://project.supabase.co/path',
    'https://project.supabase.co?key=value',
  ]) {
    expect(readPublicConfig(url, key).status).toBe('invalid')
  }
  expect(readPublicConfig('https://project.supabase.co', '').status).toBe('invalid')
})

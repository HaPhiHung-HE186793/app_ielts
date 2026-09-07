import { describe, it, expect } from 'vitest'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { releaseConfig, isolatedViteConfig, headersForPath } from './config.js'
import { inventory } from './artifact.js'

const key = 'sb_publishable_test_public_key_123456'
const account = {
  mode: 'account',
  supabaseUrl: 'https://testproject.supabase.co',
  publishableKey: key,
}

describe('release configuration boundary', () => {
  it('isolates guest from ambient env and disables AI even with an account', () => {
    const guest = releaseConfig({ mode: 'guest' })
    expect(guest.supabaseUrl).toBe('')
    for (const config of [guest, releaseConfig(account)]) {
      const vite = isolatedViteConfig(config)
      expect(vite.envDir).toBe(false)
      expect(vite.envPrefix).toEqual([])
      expect(vite.configFile).toBe(false)
      expect(vite.define['import.meta.env.VITE_AI_ENABLED']).toBe('"false"')
    }
  })
  it('rejects secret fields, accidental guest credentials and missing configuration', () => {
    for (const input of [
      null,
      [],
      {},
      { mode: 'guest', publishableKey: key },
      { ...account, serviceKey: 'private' },
      { mode: 'account' },
    ])
      expect(() => releaseConfig(input)).toThrow()
  })
  it('rejects local/private hosts, HTTP, credentials and subpaths for production', () => {
    for (const supabaseUrl of [
      'http://127.0.0.1:54321',
      'https://localhost',
      'https://192.168.1.1',
      'http://test.supabase.co',
      'https://test.supabase.co:443/path',
      'https://user@test.supabase.co',
      'https://test.supabase.co?x=1',
      'https://test.supabase.co.evil.test',
    ])
      expect(() => releaseConfig({ ...account, supabaseUrl })).toThrow()
  })
  it('rejects private key formats without echoing the submitted value', () => {
    const secret = 'sb_secret_fake_test_01234567890123456789'
    expect(() => releaseConfig({ ...account, publishableKey: secret })).toThrow()
    try {
      releaseConfig({ ...account, publishableKey: secret })
    } catch (error) {
      expect(String(error)).not.toContain(secret)
    }
  })
  it('normalizes a valid public hosted configuration', () => {
    expect(releaseConfig({ ...account, supabaseUrl: account.supabaseUrl + '/' })).toEqual(account)
  })
})

describe('release cache and CSP', () => {
  it('revalidates mutable paths and only caches hashed assets indefinitely', () => {
    const config = releaseConfig({ mode: 'guest' })
    for (const path of [
      '/',
      '/index.html',
      '/sw.js',
      '/offline-manifest.json',
      '/manifest.webmanifest',
      '/packs/foundation-v1/hello.wav',
      '/icons/icon-192.png',
    ])
      expect(headersForPath(config, path)['Cache-Control']).toBe('no-cache')
    expect(headersForPath(config, '/assets/index-abc123.js')['Cache-Control']).toContain(
      'immutable',
    )
    expect(headersForPath(config, '/sw.js')['Service-Worker-Allowed']).toBe('/')
  })
  it('does not authorize external connections for guest and only the selected backend for account', () => {
    expect(
      headersForPath(releaseConfig({ mode: 'guest' }), '/')['Content-Security-Policy'],
    ).toContain("connect-src 'self';")
    expect(headersForPath(releaseConfig(account), '/')['Content-Security-Policy']).toContain(
      `connect-src 'self' ${account.supabaseUrl};`,
    )
  })
})

describe('public artifact inventory', () => {
  async function fixture() {
    const root = resolve('.local/release-test-fixtures')
    await mkdir(root, { recursive: true })
    return mkdtemp(resolve(root, 'case-'))
  }
  it('rejects accidentally copied data/config files', async () => {
    const root = await fixture()
    await writeFile(resolve(root, 'student-backup.json'), '{}')
    await expect(inventory(root)).rejects.toThrow('ngoài danh sách')
  })
  it('rejects unversioned files in the immutable asset directory', async () => {
    const root = await fixture()
    await mkdir(resolve(root, 'assets'))
    await writeFile(resolve(root, 'assets/custom.js'), 'public code')
    await expect(inventory(root)).rejects.toThrow('ngoài danh sách')
  })
  it('rejects recognizable private credentials inside otherwise public code', async () => {
    const root = await fixture()
    await writeFile(resolve(root, 'index.html'), 'sb_secret_fake_test_01234567890123456789')
    await expect(inventory(root)).rejects.toThrow('khóa riêng')
  })
})

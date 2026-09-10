import { describe, it, expect } from 'vitest'
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT } from 'jose'
import { readNeonConfig } from './config'
import { neonIdentity } from './identity'
import { authCookies, proxyCookie } from './auth-proxy'

const authUrl = 'https://ep-fixture.auth.ap-southeast-1.aws.neon.build/neondb/auth'
const env = {
  DATABASE_URL:
    'postgresql://moi_ngay_runtime:fixture@ep-fixture-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  NEON_AUTH_BASE_URL: authUrl,
  APP_ORIGINS: 'https://fixture.vercel.app',
}
describe('Neon trust boundaries', () => {
  it('accepts only a limited runtime login, exact origins and disabled AI without logging secrets', () => {
    expect(readNeonConfig(env).port).toBe(10000)
    for (const DATABASE_URL of [
      env.DATABASE_URL.replace('moi_ngay_runtime', 'neondb_owner'),
      env.DATABASE_URL.replace('neon.tech', 'neon.tech.evil.example'),
      env.DATABASE_URL.replace('sslmode=require', 'sslmode=disable'),
    ]) {
      expect(() => readNeonConfig({ ...env, DATABASE_URL })).toThrow('DATABASE_URL')
      try {
        readNeonConfig({ ...env, DATABASE_URL })
      } catch (error) {
        expect(String(error)).not.toContain('fixture@')
      }
    }
    for (const APP_ORIGINS of [
      '*',
      'https://*.vercel.app',
      'https://fixture.vercel.app/path',
      'http://fixture.vercel.app',
    ])
      expect(() => readNeonConfig({ ...env, APP_ORIGINS })).toThrow('APP_ORIGINS')
    expect(() => readNeonConfig({ ...env, AI_ENABLED: 'true' })).toThrow('AI_ENABLED')
  })
  it('verifies signature, issuer, audience, expiry and verified identity claims', async () => {
    const { privateKey, publicKey } = await generateKeyPair('EdDSA')
    const keys = createLocalJWKSet({ keys: [{ ...(await exportJWK(publicKey)), kid: 'test' }] })
    const verify = neonIdentity(authUrl, keys)
    const owner = crypto.randomUUID(),
      origin = new URL(authUrl).origin
    async function token(changes: Record<string, unknown> = {}) {
      return new SignJWT({
        sub: owner,
        email: 'fixture@example.test',
        emailVerified: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
        iss: origin,
        aud: origin,
        ...changes,
      })
        .setProtectedHeader({ alg: 'EdDSA', kid: 'test' })
        .sign(privateKey)
    }
    expect(await verify(await token())).toEqual({ id: owner, email: 'fixture@example.test' })
    for (const change of [
      { iss: origin + '/neondb/auth' },
      { aud: 'other' },
      { exp: 1 },
      { emailVerified: false },
      { banned: true },
      { sub: 'not-uuid' },
    ])
      expect(await verify(await token(change))).toBeNull()
    const signed = await token()
    expect(await verify(signed.slice(0, -12) + 'AAAAAAAAAAAA')).toBeNull()
  })
  it('proxies only Neon cookies and scopes them to same-origin auth routes', () => {
    expect(authCookies('analytics=secret; __Secure-neonauth.session_token=ok; other=secret')).toBe(
      '__Secure-neonauth.session_token=ok',
    )
    expect(
      proxyCookie(
        '__Secure-neonauth.session_token=ok; Domain=neon.build; Path=/; Secure; HttpOnly; SameSite=None',
      ),
    ).toBe('__Secure-neonauth.session_token=ok; Secure; HttpOnly; Path=/api/auth; SameSite=Lax')
    expect(proxyCookie('other=secret; Path=/')).toBeNull()
  })
})

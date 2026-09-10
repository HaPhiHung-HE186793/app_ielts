import { describe, expect, it } from 'vitest'
import { databaseStartupMessage } from './startup-error'

describe('safe Neon startup diagnostics', () => {
  it.each([
    ['28P01', 'AUTH_FAILED'],
    ['28000', 'LOGIN_DENIED'],
    ['3D000', 'DATABASE_MISSING'],
    ['0P000', 'ROLE_MISSING'],
    ['42501', 'PERMISSION_DENIED'],
    ['42P01', 'SCHEMA_MISSING'],
    ['3F000', 'SCHEMA_MISSING'],
    ['42703', 'SCHEMA_INVALID'],
    ['APP_SCHEMA_VERSION', 'SCHEMA_VERSION'],
    ['53300', 'CONNECTION_LIMIT'],
    ['57P03', 'NOT_READY'],
    ['57014', 'QUERY_TIMEOUT'],
    ['ENOTFOUND', 'DNS'],
    ['EAI_AGAIN', 'DNS'],
    ['ETIMEDOUT', 'CONNECT_TIMEOUT'],
    ['ECONNREFUSED', 'CONNECTION_REFUSED'],
    ['ECONNRESET', 'CONNECTION_RESET'],
    ['CERT_HAS_EXPIRED', 'TLS'],
    ['DEPTH_ZERO_SELF_SIGNED_CERT', 'TLS'],
    ['SELF_SIGNED_CERT_IN_CHAIN', 'TLS'],
    ['UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'TLS'],
    ['UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'TLS'],
    ['ERR_TLS_CERT_ALTNAME_INVALID', 'TLS'],
  ])('distinguishes %s without copying driver secrets', (code, expected) => {
    const secret = 'PRIVATE_CONNECTION_SENTINEL'
    const error = Object.assign(new Error(secret), {
      code,
      detail: secret,
      hint: secret,
      stack: secret,
    })
    expect(databaseStartupMessage(error)).toContain(`[NEON_DB_${expected}]`)
    expect(databaseStartupMessage(error)).toContain(`(${code})`)
    expect(databaseStartupMessage(error)).not.toContain(secret)
  })
  it('recognizes pg-pool timeouts and wrapped driver codes', () => {
    expect(
      databaseStartupMessage(new Error('Connection terminated due to connection timeout')),
    ).toContain('NEON_DB_CONNECT_TIMEOUT')
    expect(
      databaseStartupMessage(
        new Error('PRIVATE_WRAPPER', { cause: { code: '28P01', message: 'PRIVATE_PASSWORD' } }),
      ),
    ).toContain('NEON_DB_AUTH_FAILED')
  })
  it('never serializes unknown errors, arbitrary codes, credentials or recursive causes', () => {
    const cyclic = { code: 'PRIVATE_SECRET', message: 'PRIVATE_PASSWORD', cause: {} }
    cyclic.cause = cyclic
    for (const value of [
      cyclic,
      new Error('postgresql://user:PRIVATE_PASSWORD@example.test/db'),
      null,
      'PRIVATE_SECRET',
      { code: 'PRIVATE_SECRET', detail: 'PRIVATE_PASSWORD' },
    ]) {
      const message = databaseStartupMessage(value)
      expect(message).toContain('NEON_DB_UNKNOWN')
      expect(message).not.toMatch(/PRIVATE|postgresql|example\.test/)
    }
  })
})

import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'
import { z } from 'zod'

const identitySchema = z.object({
  sub: z.uuid(),
  email: z.email(),
  emailVerified: z.literal(true),
  banned: z.boolean().optional(),
})
export type Identity = { id: string; email: string }
export function neonIdentity(
  authUrl: string,
  keys: JWTVerifyGetKey = createRemoteJWKSet(new URL(authUrl + '/.well-known/jwks.json'), {
    timeoutDuration: 8000,
    cooldownDuration: 30_000,
    cacheMaxAge: 300_000,
  }),
) {
  const origin = new URL(authUrl).origin
  return async (token: string): Promise<Identity | null> => {
    try {
      const { payload } = await jwtVerify(token, keys, {
        issuer: origin,
        audience: origin,
        algorithms: ['EdDSA'],
        requiredClaims: ['sub', 'iat', 'exp'],
        maxTokenAge: '16m',
        clockTolerance: 5,
      })
      const parsed = identitySchema.safeParse(payload)
      if (!parsed.success || parsed.data.banned) return null
      return { id: parsed.data.sub, email: parsed.data.email }
    } catch {
      return null
    }
  }
}

import { expect, it } from 'vitest'
import { releaseSource } from './source.js'

it('uses real checkout metadata before provider metadata', () => {
  expect(
    releaseSource({}, (...args: string[]) =>
      args[0] === 'rev-parse' ? 'a'.repeat(40) : ' M file.ts',
    ),
  ).toEqual({ revision: 'a'.repeat(40), dirty: true, source: 'git' })
})

it('supports a Vercel source snapshot without Git and never claims it is a clean checkout', () => {
  const missingGit = () => {
    throw new Error('no git')
  }
  expect(releaseSource({ VERCEL: '1', VERCEL_GIT_COMMIT_SHA: 'b'.repeat(40) }, missingGit)).toEqual(
    { revision: 'b'.repeat(40), dirty: null, source: 'vercel-git-metadata' },
  )
  expect(() => releaseSource({}, missingGit)).toThrow('revision')
  expect(() =>
    releaseSource({ VERCEL: '1', VERCEL_GIT_COMMIT_SHA: 'malformed' }, missingGit),
  ).toThrow('revision')
})

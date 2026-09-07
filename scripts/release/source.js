import { execFileSync } from 'node:child_process'

export function releaseSource(
  env = process.env,
  git = (...args) =>
    execFileSync('git', args, {
      encoding: 'utf8',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim(),
) {
  try {
    return {
      revision: git('rev-parse', 'HEAD'),
      dirty: Boolean(git('status', '--porcelain')),
      source: 'git',
    }
  } catch {
    if (env.VERCEL === '1' && /^[a-f0-9]{40}$/.test(env.VERCEL_GIT_COMMIT_SHA ?? ''))
      return { revision: env.VERCEL_GIT_COMMIT_SHA, dirty: null, source: 'vercel-git-metadata' }
    throw new Error(
      'Không xác định được revision. Build trong Git checkout hoặc bật System Environment Variables của Vercel Git deployment.',
    )
  }
}

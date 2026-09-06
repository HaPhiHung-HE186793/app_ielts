import { spawnSync } from 'node:child_process'
import { localBackend } from './local-backend.js'

const local = localBackend()
const env = {
  ...process.env,
  VITE_SUPABASE_URL: local.url,
  VITE_SUPABASE_PUBLISHABLE_KEY: local.publicKey,
}
// Only the publishable key goes to Vite; no server key is passed via the environment.
for (const args of [
  ['node_modules/vite/bin/vite.js', 'build', '--outDir', '.local/auth-dist'],
  [
    'node_modules/@playwright/test/cli.js',
    'test',
    '--config',
    'playwright.auth.config.ts',
    ...process.argv.slice(2),
  ],
]) {
  const run = spawnSync(process.execPath, args, { env, stdio: 'inherit' })
  if (run.status !== 0) process.exit(run.status ?? 1)
}

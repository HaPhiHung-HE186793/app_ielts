import { spawn, spawnSync } from 'node:child_process'
import { localBackend } from './local-backend.js'

const local = localBackend()
const env = {
  ...process.env,
  VITE_SUPABASE_URL: local.url,
  VITE_SUPABASE_PUBLISHABLE_KEY: local.publicKey,
}
const build = spawnSync(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'build', '--outDir', '.local/preview-dist'],
  { env, stdio: 'inherit' },
)
if (build.status !== 0) process.exit(build.status ?? 1)
const child = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--outDir',
    '.local/preview-dist',
    '--host',
    '127.0.0.1',
    '--port',
    '4175',
    '--strictPort',
  ],
  { env, stdio: 'inherit' },
)
child.on('exit', (code) => {
  process.exitCode = code ?? 1
})

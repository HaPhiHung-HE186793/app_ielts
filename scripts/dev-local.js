import { spawn } from 'node:child_process'
import { localBackend } from './local-backend.js'
const local = localBackend()
const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...process.argv.slice(2)], {
  env: {
    ...process.env,
    VITE_SUPABASE_URL: local.url,
    VITE_SUPABASE_PUBLISHABLE_KEY: local.publicKey,
  },
  stdio: 'inherit',
})
child.on('exit', (code) => {
  process.exitCode = code ?? 1
})

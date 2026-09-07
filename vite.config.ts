import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { readPublicConfig } from './src/services/supabase-config.ts'
import { offlineBuild } from './scripts/offline-build.js'
import { lessons } from './src/content/lessons.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const config = readPublicConfig(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
  if (config.status === 'invalid') throw new Error(config.reason)
  return {
    plugins: [react(), offlineBuild(lessons)],
    server: { host: '127.0.0.1', port: 5173, strictPort: true },
    test: { include: ['src/**/*.test.ts'] },
  }
})

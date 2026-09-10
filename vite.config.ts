import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { readPublicConfig } from './src/services/supabase-config.ts'
import { neonAuthUrl } from './src/services/neon-config.ts'
import { offlineBuild } from './scripts/offline-build.js'
import { lessons } from './src/content/lessons.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  if (env.VITE_OPENAI_API_KEY)
    throw new Error('Khóa OpenAI chỉ được cấu hình ở máy chủ, không dùng biến VITE_OPENAI_API_KEY.')
  const config = readPublicConfig(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
  if (config.status === 'invalid') throw new Error(config.reason)
  if (env.VITE_NEON_AUTH_URL) neonAuthUrl(env.VITE_NEON_AUTH_URL)
  return {
    plugins: [react(), offlineBuild(lessons)],
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: { '/api': 'http://127.0.0.1:8787' },
    },
    preview: { proxy: { '/api': 'http://127.0.0.1:8787' } },
    test: { include: ['src/**/*.test.ts', 'server/**/*.test.ts', 'scripts/release/**/*.test.ts'] },
  }
})

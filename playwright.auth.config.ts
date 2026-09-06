import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/auth',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  reporter: 'list',
  outputDir: '.local/auth-results',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
    // Auth responses contain tokens; never capture them in traces.
    trace: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'supabase-api', testMatch: ['rls.spec.ts', 'sync-api.spec.ts'] },
    {
      name: 'account-desktop',
      testMatch: ['account.spec.ts', 'sync.spec.ts'],
      use: { viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'account-mobile',
      testMatch: ['account.spec.ts', 'sync.spec.ts'],
      use: { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    command:
      'npm run preview -- --outDir .local/auth-dist --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
  },
})

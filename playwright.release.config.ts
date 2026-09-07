import { defineConfig } from '@playwright/test'
import base from './playwright.config'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const { directory } = JSON.parse(readFileSync('.local/releases/latest.json', 'utf8'))
process.env.PLAYWRIGHT_ARTIFACT_DIR = resolve(directory, 'site')

export default defineConfig({
  ...base,
  testIgnore: ['**/auth/**'],
  testMatch: [
    '**/learning.spec.ts',
    '**/offline.spec.ts',
    '**/adaptation.spec.ts',
    '**/release/*.spec.ts',
  ],
  use: { ...base.use, baseURL: 'http://127.0.0.1:4176' },
  webServer: {
    command: 'npm run release:preview',
    url: 'http://127.0.0.1:4176',
    reuseExistingServer: false,
  },
})

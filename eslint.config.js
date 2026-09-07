import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  { ignores: ['dist/**', '.local/**', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  { files: ['**/*.js'], languageOptions: { globals: globals.node } },
  { files: ['src/offline/*.js'], languageOptions: { globals: globals.serviceworker } },
  { files: ['src/reminders/*.js'], languageOptions: { globals: globals.serviceworker } },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
])

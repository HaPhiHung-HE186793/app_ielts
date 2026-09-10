import { mkdir, realpath, lstat, rm, copyFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { createRelease } from './create.js'
import { readVercelConfig, vercelRoutes } from './vercel-config.js'

// Read only the two public deployment values; never load .env or expose other variables.
const { input, config, backend } = readVercelConfig(process.env)
// VITE_SENTRY_DSN is a public DSN (not a secret) — safe to embed in browser bundle.
const sentryDsn = process.env.VITE_SENTRY_DSN ?? ''
// Tính ingest URL cụ thể từ DSN (không phải wildcard) để dùng trong CSP connect-src.
// Ví dụ DSN: https://abc123@o1234567.ingest.sentry.io/1234567 → https://o1234567.ingest.sentry.io
function sentryIngestFromDsn(dsn) {
  if (!dsn) return ''
  try {
    const u = new URL(dsn)
    return `${u.protocol}//${u.hostname}`
  } catch {
    return ''
  }
}
const sentryIngestUrl = sentryIngestFromDsn(sentryDsn)
const configWithSentry = { ...config, sentryDsn, sentryIngestUrl }
const { directory, site, report } = await createRelease(input, { aiProxy: true, sentryDsn })
const root = await realpath(process.cwd())
const vercelRoot = resolve(root, '.vercel')
await mkdir(vercelRoot, { recursive: true })
if ((await realpath(vercelRoot)) !== vercelRoot) throw new Error('Không ghi qua symlink .vercel.')
const output = resolve(vercelRoot, 'output')
const previous = await lstat(output).catch((error) => {
  if (error.code !== 'ENOENT') throw error
  return null
})
if (previous?.isSymbolicLink()) throw new Error('Không thay output symlink.')
// Verified exact generated directory inside this checkout; preserve .vercel/project.json.
await rm(output, { recursive: true, force: true })
await mkdir(resolve(output, 'static'), { recursive: true })
for (const file of report.files) {
  if (file.path === '_headers') continue
  const destination = resolve(output, 'static', file.path)
  await mkdir(dirname(destination), { recursive: true })
  await copyFile(resolve(site, file.path), destination)
}
await writeFile(
  resolve(output, 'config.json'),
  JSON.stringify(vercelRoutes(configWithSentry, backend), null, 2) + '\n',
)
console.log(
  `Vercel Build Output API v3 đã tạo từ ${directory}. API được nối tới Render; việc gọi AI thật do máy chủ quyết định. Chưa triển khai.`,
)

import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { lessons } from '../../src/content/lessons.ts'
import { offlineBuild } from '../offline-build.js'
import { isolatedViteConfig, releaseConfig, renderHeaders } from './config.js'
import { inventory, verifyRelease } from './artifact.js'

process.env.NODE_ENV = 'production'
const args = process.argv.slice(2)
if (args.length > 1)
  throw new Error(
    'Dùng npm run release:build -- <file-cấu-hình-public.json> hoặc không có đối số cho bản khách.',
  )
const input = args[0] ? JSON.parse(await readFile(resolve(args[0]), 'utf8')) : { mode: 'guest' }
const config = releaseConfig(input)
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', windowsHide: true }).trim()
const revision = git('rev-parse', 'HEAD')
const dirty = Boolean(git('status', '--porcelain'))
const root = resolve('.local/releases')
await mkdir(root, { recursive: true })
// Always create a new directory; never empty dist or an earlier release.
const directory = await mkdtemp(
  resolve(root, `${new Date().toISOString().replaceAll(/[:.]/g, '-')}-${revision.slice(0, 8)}-`),
)
const site = resolve(directory, 'site')
await build({
  ...isolatedViteConfig(config),
  plugins: [react(), offlineBuild(lessons)],
  build: { outDir: site, emptyOutDir: false, sourcemap: false },
})
await writeFile(resolve(site, '_headers'), renderHeaders(config))
await writeFile(
  resolve(site, '404.html'),
  '<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Không tìm thấy trang · Mỗi ngày</title><h1>Không tìm thấy trang</h1><p>Đường dẫn này không còn dùng được.</p><a href="/#/today">Về bài học hôm nay</a></html>\n',
)
const offline = JSON.parse(await readFile(resolve(site, 'offline-manifest.json'), 'utf8'))
const files = await inventory(site)
const report = {
  version: 1,
  createdAt: new Date().toISOString(),
  revision,
  dirty,
  config: input,
  ai: 'disabled',
  offlineBuild: offline.build,
  studySchema: { writes: 3, reads: [1, 2, 3] },
  files,
}
await writeFile(resolve(directory, 'release.json'), JSON.stringify(report, null, 2) + '\n')
await verifyRelease(directory)
await writeFile(resolve(root, 'latest.json'), JSON.stringify({ directory }) + '\n')
console.log(
  `Release ${config.mode}: ${directory}\nUpload thư mục site; giữ release.json riêng. ${files.length} file, ${files.reduce((sum, file) => sum + file.bytes, 0)} bytes.\nGit ${revision}${dirty ? ' (có thay đổi chưa commit)' : ' (sạch)'}. Chưa triển khai công khai.`,
)

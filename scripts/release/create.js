import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { lessons } from '../../src/content/lessons.ts'
import { offlineBuild } from '../offline-build.js'
import { isolatedViteConfig, releaseConfig, renderHeaders } from './config.js'
import { inventory, verifyRelease } from './artifact.js'
import { releaseSource } from './source.js'

export async function createRelease(input, { aiProxy = false } = {}) {
  process.env.NODE_ENV = 'production'
  const config = releaseConfig(input)
  if (aiProxy && config.mode !== 'account') throw new Error('API gia sư cần chế độ tài khoản.')
  const { revision, dirty, source } = releaseSource()
  const root = resolve('.local/releases')
  await mkdir(root, { recursive: true })
  const directory = await mkdtemp(
    resolve(root, `${new Date().toISOString().replaceAll(/[:.]/g, '-')}-${revision.slice(0, 8)}-`),
  )
  const site = resolve(directory, 'site')
  const vite = isolatedViteConfig(config)
  if (aiProxy) vite.define['import.meta.env.VITE_AI_ENABLED'] = JSON.stringify('true')
  await build({
    ...vite,
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
    source,
    config: input,
    ai: aiProxy ? 'server-controlled' : 'disabled',
    offlineBuild: offline.build,
    studySchema: { writes: 3, reads: [1, 2, 3] },
    files,
  }
  await writeFile(resolve(directory, 'release.json'), JSON.stringify(report, null, 2) + '\n')
  await verifyRelease(directory)
  await writeFile(resolve(root, 'latest.json'), JSON.stringify({ directory }) + '\n')
  return { directory, site, config, report }
}

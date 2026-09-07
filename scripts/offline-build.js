import { readFile, writeFile, readdir } from 'node:fs/promises'
import { resolve, relative } from 'node:path'
import { createHash } from 'node:crypto'

// Build an exact public-resource allowlist from the finished Vite output.
// No runtime API response is ever added to this list.
export function offlineBuild(lessons) {
  let outDir
  return {
    name: 'moi-ngay-offline',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      const pack = JSON.parse(await readFile('src/content/offline-pack.json', 'utf8'))
      const hash = (data) => createHash('sha256').update(data).digest('hex')
      for (const asset of pack.resources) {
        const data = await readFile(resolve(outDir, `.${asset.path}`))
        if (data.length !== asset.bytes || hash(data) !== asset.sha256)
          throw new Error(`Offline resource changed: ${asset.path}. Regenerate the pack.`)
      }
      const content = await readFile(resolve(outDir, 'packs/foundation-v1/lessons.json'), 'utf8')
      if (content !== JSON.stringify(lessons))
        throw new Error('Lesson content changed: regenerate the offline pack.')
      const files = await readdir(outDir, { recursive: true, withFileTypes: true })
      const shell = []
      for (const file of files) {
        if (!file.isFile()) continue
        const absolute = resolve(file.parentPath, file.name)
        const path = '/' + relative(outDir, absolute).replaceAll('\\', '/')
        if (path.startsWith('/packs/') || path === '/sw.js' || path === '/offline-manifest.json')
          continue
        if (
          !/^\/(assets\/[^/]+\.(js|css|woff2?)|icons\/[^/]+\.(png|svg)|index\.html|favicon\.svg|manifest\.webmanifest)$/.test(
            path,
          )
        )
          continue
        const data = await readFile(absolute)
        shell.push({ path, bytes: data.length, sha256: hash(data) })
      }
      shell.sort((a, b) => a.path.localeCompare(b.path))
      const worker = await readFile('src/offline/worker.js', 'utf8')
      const range = (await readFile('src/offline/range.js', 'utf8')).replace(
        'export function',
        'function',
      )
      const build = hash(JSON.stringify(shell) + pack.version + worker + range).slice(0, 20)
      const manifest = { build, shell, pack }
      await writeFile(resolve(outDir, 'offline-manifest.json'), JSON.stringify(manifest))
      await writeFile(
        resolve(outDir, 'sw.js'),
        `const manifest = ${JSON.stringify(manifest)};\n${range}\n${worker}`,
      )
    },
  }
}

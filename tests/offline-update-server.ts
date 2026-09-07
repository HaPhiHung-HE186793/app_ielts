import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

// Isolated HTTP origin per test; never mutates dist or another test's server.
export async function updateServer() {
  const manifest = JSON.parse(await readFile('dist/offline-manifest.json', 'utf8'))
  const originalWorker = await readFile('dist/sw.js', 'utf8')
  const files = new Map<string, Buffer>()
  for (const asset of [...manifest.shell, ...manifest.pack.resources])
    files.set(asset.path, await readFile(`dist${asset.path}`))
  files.set('/sw.js', Buffer.from(originalWorker))
  let upgraded = false
  const next = new Map(files)
  const updatedManifest = structuredClone(manifest)
  updatedManifest.build = 'integration-update-v2'
  updatedManifest.pack.version += '-integration-v2'
  for (const asset of updatedManifest.shell) {
    if (asset.path.endsWith('.js'))
      next.set(
        asset.path,
        Buffer.from(
          files
            .get(asset.path)!
            .toString()
            .replaceAll(manifest.pack.version, updatedManifest.pack.version),
        ),
      )
    if (asset.path === '/index.html')
      next.set(
        asset.path,
        Buffer.from(files.get(asset.path)!.toString() + '\n<!-- integration release v2 -->'),
      )
    const data = next.get(asset.path)!
    asset.bytes = data.length
    asset.sha256 = createHash('sha256').update(data).digest('hex')
  }
  next.set(
    '/sw.js',
    Buffer.from(
      originalWorker.replace(
        /^const manifest = [^\n]+;\n/,
        `const manifest = ${JSON.stringify(updatedManifest)};\n`,
      ),
    ),
  )
  const server = createServer((request, response) => {
    const url = new URL(request.url!, 'http://localhost')
    const path = url.pathname === '/' ? '/index.html' : url.pathname
    const body = (upgraded ? next : files).get(path)
    const type = path.endsWith('.js')
      ? 'text/javascript'
      : path.endsWith('.css')
        ? 'text/css'
        : path.endsWith('.html')
          ? 'text/html'
          : path.endsWith('.wav')
            ? 'audio/wav'
            : path.endsWith('.json') || path.endsWith('.webmanifest')
              ? 'application/json'
              : path.endsWith('.svg')
                ? 'image/svg+xml'
                : path.endsWith('.png')
                  ? 'image/png'
                  : 'font/woff2'
    response.writeHead(body ? 200 : 404, { 'Content-Type': type, 'Cache-Control': 'no-store' })
    response.end(body)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Test server did not start')
  return {
    url: `http://127.0.0.1:${address.port}`,
    upgrade: () => {
      upgraded = true
    },
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections()
        server.close(() => resolve())
      }),
  }
}

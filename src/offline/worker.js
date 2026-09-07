/* global manifest, byteRange */
// Classic worker: manifest and the tested byteRange helper are injected by Vite.
const shellName = `moi-ngay.shell.${manifest.build}`
const packName = `moi-ngay.pack.${manifest.pack.version}`
const marker = new URL('/__moi-ngay-pack-ready__', self.location.origin).href
const shellPaths = new Set(manifest.shell.map((asset) => asset.path))
const packPaths = new Set(manifest.pack.resources.map((asset) => asset.path))
let queue = Promise.resolve()

async function verifiedResponse(asset) {
  const response = await fetch(asset.path, {
    cache: 'no-store',
    credentials: 'omit',
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok || response.status !== 200 || response.redirected) throw new Error('network')
  const data = await response.clone().arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', data)
  const hash = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  if (data.byteLength !== asset.bytes || hash !== asset.sha256) throw new Error('integrity')
  // Cache only public content, not response cookies or server-specific headers.
  return new Response(data, {
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Length': String(data.byteLength),
    },
  })
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(shellName)
      try {
        for (const asset of manifest.shell)
          await cache.put(asset.path, await verifiedResponse(asset))
      } catch (error) {
        await caches.delete(shellName)
        throw error
      }
      // No skipWaiting: old pages keep their code and draft until all are closed.
    })(),
  )
})
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (
          (name.startsWith('moi-ngay.shell.') && name !== shellName) ||
          (name.startsWith('moi-ngay.pack.') && name !== packName)
        )
          await caches.delete(name)
      }
      await self.clients.claim()
    })(),
  )
})

async function packStatus() {
  const cache = await caches.open(packName)
  const shell = await caches.open(shellName)
  let shellReady = true
  for (const asset of manifest.shell) {
    if (!(await shell.match(asset.path))) shellReady = false
  }
  let count = 0,
    bytes = 0
  for (const asset of manifest.pack.resources) {
    const response = await cache.match(asset.path)
    if (response && Number(response.headers.get('Content-Length')) === asset.bytes) {
      count++
      bytes += asset.bytes
    }
  }
  return {
    version: manifest.pack.version,
    build: manifest.build,
    count,
    bytes,
    total: manifest.pack.resources.length,
    totalBytes: manifest.pack.resources.reduce((sum, asset) => sum + asset.bytes, 0),
    shellBytes: manifest.shell.reduce((sum, asset) => sum + asset.bytes, 0),
    ready: shellReady && count === manifest.pack.resources.length && !!(await cache.match(marker)),
  }
}

self.addEventListener('message', (event) => {
  const { command, version } = event.data || {}
  if (!event.ports[0] || !['STATUS', 'DOWNLOAD', 'DELETE'].includes(command)) return
  // Reply only to pages in this app origin. Commands never accept arbitrary URLs.
  if (!event.source?.url || new URL(event.source.url).origin !== self.location.origin) return
  const port = event.ports[0]
  const task = queue.then(async () => {
    try {
      if (version !== manifest.pack.version) throw new Error('version')
      if (command === 'DELETE') await caches.delete(packName)
      if (command === 'DOWNLOAD') {
        const cache = await caches.open(packName)
        await cache.delete(marker)
        const shell = await caches.open(shellName)
        for (const asset of manifest.shell) {
          if (!(await shell.match(asset.path)))
            await shell.put(asset.path, await verifiedResponse(asset))
        }
        for (const asset of manifest.pack.resources) {
          // Recheck every asset on retry; an interrupted download is never "ready".
          await cache.put(asset.path, await verifiedResponse(asset))
          port.postMessage({ progress: await packStatus() })
        }
        await cache.put(marker, new Response(manifest.pack.version))
      }
      port.postMessage({ result: await packStatus() })
    } catch (error) {
      port.postMessage({
        error:
          error.name === 'QuotaExceededError'
            ? 'quota'
            : error.message === 'version'
              ? 'version'
              : 'download',
        result: await packStatus().catch(() => null),
      })
    }
  })
  queue = task.catch(() => {})
  event.waitUntil(task)
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    request.headers.has('Authorization')
  )
    return
  // Never cache query-dependent requests, API, Auth, user content, or third parties.
  if (url.search) return
  const navigation =
    request.mode === 'navigate' && (url.pathname === '/' || url.pathname === '/index.html')
  if (!navigation && !shellPaths.has(url.pathname) && !packPaths.has(url.pathname)) return
  event.respondWith(
    (async () => {
      const cache = await caches.open(packPaths.has(url.pathname) ? packName : shellName)
      const response = await cache.match(navigation ? '/index.html' : url.pathname)
      if (!response) return fetch(request) // online playback doesn't silently download the pack
      const rangeHeader = request.headers.get('Range')
      if (rangeHeader && packPaths.has(url.pathname)) {
        const data = await response.arrayBuffer()
        const range = byteRange(rangeHeader, data.byteLength)
        if (!range)
          return new Response(null, {
            status: 416,
            headers: { 'Content-Range': `bytes */${data.byteLength}` },
          })
        return new Response(data.slice(range.start, range.end + 1), {
          status: 206,
          headers: {
            'Content-Type': response.headers.get('Content-Type'),
            'Content-Length': String(range.end - range.start + 1),
            'Content-Range': `bytes ${range.start}-${range.end}/${data.byteLength}`,
            'Accept-Ranges': 'bytes',
          },
        })
      }
      return response
    })(),
  )
})

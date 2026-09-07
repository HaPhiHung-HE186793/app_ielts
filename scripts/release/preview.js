import { preview } from 'vite'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { headersForPath, isolatedViteConfig } from './config.js'
import { verifyRelease } from './artifact.js'

const args = process.argv.slice(2)
if (args.length > 1) throw new Error('Chỉ nhận đường dẫn thư mục release.')
const directory =
  args[0] || JSON.parse(await readFile('.local/releases/latest.json', 'utf8')).directory
const { config, site, files } = await verifyRelease(resolve(directory))
const paths = new Set(files.map((file) => `/${file.path}`))
const missing = await readFile(resolve(site, '404.html'))
const server = await preview({
  ...isolatedViteConfig(config),
  appType: 'mpa',
  build: { outDir: site },
  preview: { host: '127.0.0.1', port: 4176, strictPort: true },
  plugins: [
    {
      name: 'release-preview-headers',
      configurePreviewServer(server) {
        server.middlewares.use((request, response, next) => {
          const path = new URL(request.url || '/', 'http://localhost').pathname
          for (const [key, value] of Object.entries(headersForPath(config, path)))
            response.setHeader(key, value)
          if (
            !['GET', 'HEAD'].includes(request.method || '') ||
            (path !== '/' && (!paths.has(path) || path === '/_headers'))
          ) {
            response.writeHead(404, {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-cache',
            })
            response.end(request.method === 'HEAD' ? undefined : missing)
            return
          }
          next()
        })
      },
    },
  ],
})
console.log(
  `Kiểm tra artifact: ${directory}\nHTTP loopback cho phát triển; chưa xác minh HTTPS/hosting thật.`,
)
server.printUrls()

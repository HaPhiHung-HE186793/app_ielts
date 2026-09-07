import { mkdir, realpath, lstat, rm, copyFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { createRelease } from './create.js'
import { readVercelConfig, vercelRoutes } from './vercel-config.js'

// Read only these three public values; never load .env or expose other build variables.
const { input, config, backend } = readVercelConfig(process.env)
const { directory, site, report } = await createRelease(input, { aiProxy: true })
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
  JSON.stringify(vercelRoutes(config, backend), null, 2) + '\n',
)
console.log(
  `Vercel Build Output API v3 đã tạo từ ${directory}. API được nối tới Render; việc gọi AI thật do máy chủ quyết định. Chưa triển khai.`,
)

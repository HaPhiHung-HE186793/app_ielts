import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createRelease } from './create.js'

const args = process.argv.slice(2)
if (args.length > 1)
  throw new Error(
    'Dùng npm run release:build -- <file-cấu-hình-public.json> hoặc không có đối số cho bản khách.',
  )
const input = args[0] ? JSON.parse(await readFile(resolve(args[0]), 'utf8')) : { mode: 'guest' }
const { directory, report } = await createRelease(input)
console.log(
  `Release ${report.config.mode}: ${directory}\nUpload thư mục site; giữ release.json riêng. ${report.files.length} file, ${report.files.reduce((sum, file) => sum + file.bytes, 0)} bytes.\nGit ${report.revision}${report.dirty ? ' (có thay đổi chưa commit)' : ' (sạch)'}. Chưa triển khai công khai.`,
)

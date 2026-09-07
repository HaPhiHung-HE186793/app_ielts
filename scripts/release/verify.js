import { readFile } from 'node:fs/promises'
import { verifyRelease } from './artifact.js'

const args = process.argv.slice(2)
if (args.length > 1) throw new Error('Chỉ nhận đường dẫn thư mục release.')
const directory =
  args[0] || JSON.parse(await readFile('.local/releases/latest.json', 'utf8')).directory
const { files, report } = await verifyRelease(directory)
console.log(
  `Artifact hợp lệ: ${files.length} file; offline ${report.offlineBuild}; mode ${report.config.mode}. Không thay thế kiểm tra hosting thật.`,
)

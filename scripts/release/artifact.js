import { createHash } from 'node:crypto'
import { readFile, readdir, lstat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { releaseConfig, renderHeaders } from './config.js'

export const sha256 = (data) => createHash('sha256').update(data).digest('hex')
const allowed =
  /^(assets\/[^/]+-[A-Za-z0-9_-]{8}\.(js|css|woff2?)|icons\/[^/]+\.(png|svg)|packs\/foundation-v1\/(lessons\.json|[a-z0-9-]+\.wav)|index\.html|404\.html|favicon\.svg|manifest\.webmanifest|sw\.js|offline-manifest\.json|_headers)$/

export async function inventory(site) {
  const paths = (await readdir(site, { recursive: true }))
    .map((path) => path.replaceAll('\\', '/'))
    .sort()
  const files = []
  for (const path of paths) {
    const stat = await lstat(resolve(site, path))
    if (stat.isSymbolicLink()) throw new Error('Release không chứa symlink.')
    if (stat.isDirectory()) continue
    if (!stat.isFile() || !allowed.test(path))
      throw new Error(`File ngoài danh sách public: ${path}`)
    const data = await readFile(resolve(site, path))
    // A second guard for recognizable private credentials, not a universal secret detector.
    if (
      !/\.(wav|png|woff2?)$/.test(path) &&
      /(?:sb_secret_[A-Za-z0-9_-]{16,}|sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----)/.test(
        data.toString(),
      )
    )
      throw new Error(`Phát hiện dạng khóa riêng trong artifact: ${path}`)
    files.push({ path, bytes: data.length, sha256: sha256(data) })
  }
  if (files.length > 1000 || files.some((file) => file.bytes > 25 * 1024 * 1024))
    throw new Error('Artifact vượt giới hạn Direct Upload qua dashboard đã chọn.')
  return files
}

export async function verifyRelease(directory) {
  const report = JSON.parse(await readFile(resolve(directory, 'release.json'), 'utf8'))
  const config = releaseConfig(report.config)
  const site = resolve(directory, 'site')
  const files = await inventory(site)
  if (report.version !== 1 || JSON.stringify(files) !== JSON.stringify(report.files))
    throw new Error(
      'Artifact thay đổi/thiếu file so với release.json. Tạo release mới, không sửa bản kê.',
    )
  if ((await readFile(resolve(site, '_headers'), 'utf8')) !== renderHeaders(config))
    throw new Error('Header không khớp cấu hình release.')
  const offline = JSON.parse(await readFile(resolve(site, 'offline-manifest.json'), 'utf8'))
  if (offline.build !== report.offlineBuild) throw new Error('Sai phiên bản offline.')
  for (const resource of [...offline.shell, ...offline.pack.resources]) {
    const found = files.find((file) => `/${file.path}` === resource.path)
    if (!found || found.bytes !== resource.bytes || found.sha256 !== resource.sha256)
      throw new Error('Hash tài nguyên offline không khớp.')
  }
  for (const required of ['index.html', '404.html', 'sw.js', 'manifest.webmanifest']) {
    if (!files.some((file) => file.path === required)) throw new Error(`Thiếu ${required}`)
  }
  return { report, config, site, files }
}

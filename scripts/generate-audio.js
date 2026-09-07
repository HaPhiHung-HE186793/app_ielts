// Rebuild only when the original lesson phrases change. Docker is a build tool,
// never shipped to the learner. See docs/OFFLINE.md for provenance and limits.
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import ts from 'typescript'

const source = await readFile('src/content/lessons.ts', 'utf8')
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText
const { lessons } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
)
const work = '.local/audio-source'
await mkdir(work, { recursive: true })
for (const lesson of lessons) await writeFile(`${work}/${lesson.id}.txt`, lesson.phrase, 'utf8')
const run = spawnSync(
  'docker',
  [
    'run',
    '--rm',
    '--mount',
    `type=bind,source=${process.cwd()}/${work},target=/work`,
    'debian:bookworm-slim',
    'sh',
    '-ec',
    'apt-get update -qq && apt-get install -y -qq espeak-ng >/dev/null && espeak-ng --version && for f in /work/*.txt; do espeak-ng -v en-us -s 145 -w "${f%.txt}.wav" -f "$f"; done',
  ],
  { stdio: 'inherit' },
)
if (run.status !== 0) throw new Error('Audio generation failed')
const sha256 = (data) => createHash('sha256').update(data).digest('hex')
const version = 'foundation-v1'
await mkdir(`public/packs/${version}`, { recursive: true })
const resources = []
for (const lesson of lessons) {
  const data = await readFile(`${work}/${lesson.id}.wav`)
  const path = `/packs/${version}/${lesson.id}.wav`
  await copyFile(`${work}/${lesson.id}.wav`, `public${path}`)
  resources.push({
    path,
    bytes: data.length,
    sha256: sha256(data),
    lessonId: lesson.id,
    phrase: lesson.phrase,
  })
}
const content = JSON.stringify(lessons)
const path = `/packs/${version}/lessons.json`
await writeFile(`public${path}`, content)
resources.push({
  path,
  bytes: Buffer.byteLength(content),
  sha256: sha256(content),
  lessonId: null,
  phrase: null,
})
const revision = sha256(JSON.stringify(resources)).slice(0, 16)
await writeFile(
  'src/content/offline-pack.json',
  JSON.stringify(
    { version: `${version}-${revision}`, title: 'Bảy ngày khởi đầu', resources },
    null,
    2,
  ) + '\n',
)
console.log(`Generated ${lessons.length} original sentence recordings and a content manifest.`)

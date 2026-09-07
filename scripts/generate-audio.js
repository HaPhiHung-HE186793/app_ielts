// Only original public lesson text is synthesized. Never use learner input here.
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { createHash, randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { lessons } from '../src/content/lessons.ts'

const sha256 = (data) => createHash('sha256').update(data).digest('hex')
const version = 'foundation-v1'
const previous = JSON.parse(await readFile('src/content/offline-pack.json', 'utf8'))
const recordings = lessons.flatMap((lesson) => [
  { id: lesson.id, lessonId: lesson.id, phrase: lesson.phrase },
  ...lesson.exercises
    .filter((item) => item.audioText)
    .map((item) => ({
      id: `${lesson.id}-${item.id}`,
      lessonId: lesson.id,
      phrase: item.audioText,
    })),
])
const work = `.local/audio-source/${randomUUID()}`
await mkdir(work, { recursive: true })
await mkdir(`public/packs/${version}`, { recursive: true })
const pending = []
for (const recording of recordings) {
  if (!/^[a-z0-9-]+$/.test(recording.id)) throw new Error('Invalid public recording ID')
  const path = `/packs/${version}/${recording.id}.wav`
  const asset = previous.resources.find(
    (item) => item.path === path && item.phrase === recording.phrase,
  )
  const data = await readFile(`public${path}`).catch(() => null)
  if (asset && data && data.length === asset.bytes && sha256(data) === asset.sha256) continue
  pending.push(recording)
  await writeFile(`${work}/${recording.id}.txt`, recording.phrase, 'utf8')
}
if (pending.length) {
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
  if (run.status !== 0)
    throw new Error('Audio generation failed; previous manifest was not changed')
  for (const recording of pending)
    await copyFile(`${work}/${recording.id}.wav`, `public/packs/${version}/${recording.id}.wav`)
}
const resources = []
for (const recording of recordings) {
  const path = `/packs/${version}/${recording.id}.wav`,
    data = await readFile(`public${path}`)
  resources.push({
    path,
    bytes: data.length,
    sha256: sha256(data),
    lessonId: recording.lessonId,
    phrase: recording.phrase,
  })
}
const content = JSON.stringify(lessons),
  path = `/packs/${version}/lessons.json`
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
    { version: `${version}-${revision}`, title: 'Bốn tuần nền tảng', resources },
    null,
    2,
  ) + '\n',
)
console.log(
  `Prepared ${recordings.length} public recordings (${pending.length} generated, existing matching audio preserved) and ${lessons.length} lessons/checks.`,
)

import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import pack from '../src/content/offline-pack.json' with { type: 'json' }
import { updateServer } from './offline-update-server'
import { emptyState } from '../src/data/schema'
import { startLesson } from '../src/domain/session'
import { encodeStudy } from '../src/data/sync-schema'

async function prepare(page: Page) {
  await page.goto('/#/install')
  await expect(page.getByRole('button', { name: 'Tải gói để học offline' })).toBeEnabled({
    timeout: 20_000,
  })
}
async function download(page: Page) {
  await prepare(page)
  await page.getByRole('button', { name: 'Tải gói để học offline' }).click()
  await expect(page.getByText('Sẵn sàng học offline', { exact: true })).toBeVisible()
}

test('quota failure preserves progress and can retry without claiming completion', async ({
  page,
  context,
}) => {
  await prepare(page)
  await page.evaluate(() => localStorage.setItem('unrelated-progress', 'keep'))
  const worker = context.serviceWorkers()[0]
  await worker.evaluate(() => {
    const original = Cache.prototype.put
    let failed = false
    Cache.prototype.put = function (request, response) {
      if (!failed && String(request).endsWith('/friends.wav')) {
        failed = true
        return Promise.reject(new DOMException('test quota', 'QuotaExceededError'))
      }
      return original.call(this, request, response)
    }
  })
  await page.getByRole('button', { name: 'Tải gói để học offline' }).click()
  await expect(page.locator('.offline-error')).toContainText('không còn đủ chỗ')
  await expect(page.getByText('Gói còn thiếu file', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('unrelated-progress'))).toBe('keep')
  await page.getByRole('button', { name: 'Thử tải lại' }).click()
  await expect(page.getByText('Sẵn sàng học offline', { exact: true })).toBeVisible()
})

test('new release waits for all old windows and preserves draft and durable outbox', async ({
  page,
  context,
}) => {
  const server = await updateServer()
  test.setTimeout(60_000)
  try {
    await page.goto(`${server.url}/#/install`)
    await expect(page.getByRole('button', { name: 'Tải gói để học offline' })).toBeEnabled()
    await page.getByRole('button', { name: 'Tải gói để học offline' }).click()
    await expect(page.getByText('Sẵn sàng học offline', { exact: true })).toBeVisible()
    const state = startLesson(emptyState(), 'hello', 'upgrade-draft')
    state.draft!.pendingAnswer = 'my preserved answer'
    const raw = encodeStudy(state, {
      version: 1,
      base: { revision: 0, state: emptyState() },
      pending: { id: crypto.randomUUID(), expectedRevision: 0, state },
      conflict: null,
      lastSyncedAt: null,
    })
    await page.evaluate((raw) => {
      localStorage.setItem('moi-ngay.study.v1', raw)
      localStorage.setItem('moi-ngay.study.v1.account:upgrade-test', raw)
    }, raw)
    const oldWindow = await context.newPage()
    await oldWindow.goto(`${server.url}/#/install`)
    server.upgrade()
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration())!.update()
    })
    await expect(page.getByText(/Có bản cập nhật đã sẵn sàng/)).toBeVisible()
    await page.reload()
    await expect(page.getByText('Sẵn sàng học offline', { exact: true })).toBeVisible()
    const oldBuild = await page.evaluate(async () =>
      (await caches.keys()).filter((key) => key.startsWith('moi-ngay.shell.')),
    )
    expect(oldBuild.some((key) => key.endsWith('integration-update-v2'))).toBe(true)
    const workers = context.serviceWorkers()
    const builds = await Promise.all(
      workers.map((worker) => worker.evaluate('manifest.build').catch(() => '')),
    )
    const nextWorker = workers[builds.indexOf('integration-update-v2')]
    expect(nextWorker).toBeTruthy()
    await page.close()
    await oldWindow.close()
    // Wait for real activation, rather than reopening during its transition.
    await expect
      .poll(() =>
        nextWorker.evaluate(
          'self.registration.waiting === null && self.registration.active?.state === "activated"',
        ),
      )
      .toBe(true)
    const updated = await context.newPage()
    await updated.goto(`${server.url}/#/install`)
    await expect(updated.getByText('Chưa tải gói', { exact: true })).toBeVisible()
    await expect(updated.getByRole('button', { name: 'Tải gói để học offline' })).toBeEnabled()
    expect(await updated.evaluate(() => localStorage.getItem('moi-ngay.study.v1'))).toBe(raw)
    expect(
      await updated.evaluate(() => localStorage.getItem('moi-ngay.study.v1.account:upgrade-test')),
    ).toBe(raw)
    expect(
      await updated.evaluate(async () =>
        (await caches.keys()).filter((key) => key.startsWith('moi-ngay.shell.')),
      ),
    ).toEqual(['moi-ngay.shell.integration-update-v2'])
    await updated.getByRole('button', { name: 'Tải gói để học offline' }).click()
    await expect(updated.getByText('Sẵn sàng học offline', { exact: true })).toBeVisible()
    await context.setOffline(true)
    await updated.reload()
    await expect(updated.getByText('Sẵn sàng học offline', { exact: true })).toBeVisible()
    await updated.close()
  } finally {
    await server.close()
  }
})

test('download, close and open offline, hear real audio, save and resume a lesson', async ({
  page,
  context,
  baseURL,
}, info) => {
  await download(page)
  await expect(page.locator('.offline-panel')).toContainText('8/8 file')
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: info.outputPath('offline-pack.png'), fullPage: true })
  await context.setOffline(true)
  await page.close()
  const offline = await context.newPage()
  await offline.goto(`${baseURL}/#/lesson/hello`)
  await offline.getByRole('button', { name: 'Nghe câu mẫu' }).click()
  await expect
    .poll(() => offline.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime))
    .toBeGreaterThan(0)
  const ranges = await offline.evaluate(async (path) => {
    const a = await fetch(path, { headers: { Range: 'bytes=0-43' } })
    const b = await fetch(path, { headers: { Range: 'bytes=9999999-' } })
    return {
      status: a.status,
      bytes: (await a.arrayBuffer()).byteLength,
      header: a.headers.get('Content-Range'),
      bad: b.status,
    }
  }, pack.resources[0].path)
  expect(ranges).toEqual({
    status: 206,
    bytes: 44,
    header: `bytes 0-43/${pack.resources[0].bytes}`,
    bad: 416,
  })
  await offline.getByRole('button', { name: 'Bắt đầu bài này' }).click()
  await offline.getByRole('button', { name: 'Mình sẵn sàng thử' }).click()
  await offline.getByLabel('Mình tên là Linh.').check()
  await offline.getByRole('button', { name: 'Kiểm tra' }).click()
  await offline.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await offline.getByLabel('Câu trả lời của bạn').fill('is')
  await offline.reload()
  await expect(offline.getByLabel('Câu trả lời của bạn')).toHaveValue('is')
  await offline.getByRole('button', { name: 'Kiểm tra' }).click()
  await offline.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await offline.getByLabel('My name is Nam.', { exact: false }).check()
  await offline.getByRole('button', { name: 'Kiểm tra' }).click()
  await offline.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await offline.getByRole('button', { name: /Hoàn thành bài/ }).click()
  const saved = await offline.evaluate(() => JSON.parse(localStorage.getItem('moi-ngay.study.v1')!))
  expect(saved.completions).toHaveLength(1)
  expect(saved.reviews.hello).toBeTruthy()
  await offline.goto(`${baseURL}/#/install`)
  offline.on('dialog', (dialog) => dialog.accept())
  await offline.getByRole('button', { name: 'Xóa gói tải xuống' }).click()
  await expect(offline.getByText('Chưa tải gói', { exact: true })).toBeVisible()
  expect(
    await offline.evaluate(
      () => JSON.parse(localStorage.getItem('moi-ngay.study.v1')!).completions,
    ),
  ).toEqual(saved.completions)
  expect(
    await offline.evaluate(
      async () => (await caches.keys()).filter((key) => key.startsWith('moi-ngay.shell.')).length,
    ),
  ).toBe(1)
  // After deletion, a failed online-audio attempt can recover on the same page.
  await offline.goto(`${baseURL}/#/lesson/friends`)
  await offline.getByRole('button', { name: 'Nghe câu mẫu' }).click()
  await expect(offline.getByText(/Chưa phát được file nghe/)).toBeVisible()
  await context.setOffline(false)
  await offline.getByRole('button', { name: 'Nghe câu mẫu' }).click()
  await expect
    .poll(() => offline.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime))
    .toBeGreaterThan(0)
  await offline.close()
})

test('failed or interrupted pack stays incomplete and retry verifies every asset', async ({
  page,
  context,
}) => {
  // Context routing includes requests initiated by service workers in Chromium.
  await context.route('**/packs/**/friends.wav', (route) =>
    route.fulfill({ status: 200, contentType: 'audio/wav', body: 'invalid audio' }),
  )
  await prepare(page)
  await page.getByRole('button', { name: 'Tải gói để học offline' }).click()
  await expect(page.locator('.offline-error')).toContainText('Chưa tải đủ')
  await expect(page.getByText('Gói còn thiếu file', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Gói còn thiếu file', { exact: true })).toBeVisible()
  await context.unrouteAll()
  await page.getByRole('button', { name: 'Thử tải lại' }).click()
  await expect(page.getByText('Sẵn sàng học offline', { exact: true })).toBeVisible()
  // Simulate browser eviction of one file, leaving the completion marker behind.
  await page.evaluate(async (path) => {
    const name = (await caches.keys()).find((key) => key.startsWith('moi-ngay.pack.'))!
    await (await caches.open(name)).delete(path)
  }, pack.resources[1].path)
  await page.getByRole('button', { name: 'Kiểm tra file đã lưu' }).click()
  await expect(page.getByText('Gói còn thiếu file', { exact: true })).toBeVisible()
})

test('only allowlisted public content is cached; unrelated caches survive pack deletion', async ({
  page,
}) => {
  await download(page)
  await page.evaluate(async () => {
    const unrelated = await caches.open('another-app-data')
    await unrelated.put('/unrelated', new Response('keep'))
    await fetch('/rest/v1/study_snapshots')
    await fetch('/auth/v1/user')
    await fetch('/private-profile?account=someone')
  })
  const paths = await page.evaluate(async () => {
    const output: string[] = []
    for (const name of await caches.keys()) {
      if (!name.startsWith('moi-ngay.')) continue
      for (const request of await (await caches.open(name)).keys())
        output.push(new URL(request.url).pathname)
    }
    return output
  })
  expect(paths.some((path) => /rest|auth|private/.test(path))).toBe(false)
  page.on('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Xóa gói tải xuống' }).click()
  await expect(page.getByText('Chưa tải gói', { exact: true })).toBeVisible()
  expect(
    await page.evaluate(async () =>
      (await (await caches.open('another-app-data')).match('/unrelated'))?.text(),
    ),
  ).toBe('keep')
})

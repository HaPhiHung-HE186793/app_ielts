import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test('serves release headers, exact assets and real 404 without a local API proxy', async ({
  request,
}) => {
  const manifest = await (await request.get('/offline-manifest.json')).json()
  for (const path of [
    '/',
    '/sw.js',
    '/offline-manifest.json',
    '/manifest.webmanifest',
    manifest.pack.resources[0].path,
  ]) {
    const response = await request.get(path)
    expect(response.ok()).toBe(true)
    expect(response.headers()['cache-control']).toBe('no-cache')
    expect(response.headers()['x-content-type-options']).toBe('nosniff')
  }
  expect((await request.get('/sw.js')).headers()['service-worker-allowed']).toBe('/')
  const js = manifest.shell.find((asset: { path: string }) => asset.path.endsWith('.js'))
  expect((await request.get(js.path)).headers()['cache-control']).toContain('immutable')
  for (const path of [
    '/api/ai/status',
    '/not-a-real-page',
    '/assets/missing.js',
    '/.env',
    '/release.json',
    '/_headers',
  ])
    expect((await request.get(path)).status()).toBe(404)
  expect((await request.post('/api/ai/feedback', { data: {} })).status()).toBe(404)
})

test('guest artifact has no inherited config and learning works under CSP without API requests', async ({
  page,
  baseURL,
}) => {
  const { directory } = JSON.parse(await readFile('.local/releases/latest.json', 'utf8'))
  const report = JSON.parse(await readFile(`${directory}/release.json`, 'utf8'))
  expect(report.config.mode).toBe('guest')
  const failures: string[] = []
  const calls: string[] = []
  page.on('pageerror', (error) => failures.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(message.text())
  })
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.origin !== baseURL || url.pathname.startsWith('/api/')) calls.push(url.pathname)
  })
  await page.goto('/#/lesson/hello')
  await page.getByRole('button', { name: 'Bắt đầu bài này' }).click()
  await page.getByRole('button', { name: 'Mình sẵn sàng thử' }).click()
  await page.getByLabel('Mình tên là Linh.').check()
  await page.getByRole('button', { name: 'Kiểm tra' }).click()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByLabel('Câu trả lời của bạn').fill('is')
  await page.getByRole('button', { name: 'Kiểm tra' }).click()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByLabel('My name is Nam.', { exact: false }).check()
  await page.getByRole('button', { name: 'Kiểm tra' }).click()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await expect(
    page.getByText('Gia sư AI chưa bật trên bản web này.', { exact: false }),
  ).toBeVisible()
  await page.getByLabel('Ghi lại câu của bạn').fill('My name is An.')
  await page.getByRole('button', { name: 'Hoàn thành bài học' }).click()
  await page.reload()
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('moi-ngay.study.v1')!).completions.length,
    ),
  ).toBe(1)
  expect(calls).toEqual([])
  expect(failures).toEqual([])
})

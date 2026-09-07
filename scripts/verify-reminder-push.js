// Optional real network probe. Uses only a generated local test account and a temporary Chrome profile.
import { chromium } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'
import { localBackend } from './local-backend.js'
import { sendDueReminders } from './reminder-sender.js'

const local = localBackend()
const options = { auth: { persistSession: false, autoRefreshToken: false } }
const admin = createClient(local.url, local.secretKey, options)
const user = createClient(local.url, local.publicKey, options)
let context, userId
try {
  const vapid = JSON.parse(await readFile('.local/reminder-vapid.json', 'utf8'))
  const email = `moi-ngay-${crypto.randomUUID()}@example.test`,
    password = `Test-${crypto.randomUUID()}-9!`
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  userId = created.data.user?.id
  if (created.error || !userId) throw new Error('Test account unavailable')
  const login = await user.auth.signInWithPassword({ email, password })
  if (login.error) throw new Error('Test session unavailable')
  await admin
    .from('reminder_service')
    .update({ heartbeat_at: new Date().toISOString() })
    .eq('id', true)
  context = await chromium.launchPersistentContext('', {
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
    headless: true,
    permissions: ['notifications'],
    viewport: { width: 1000, height: 900 },
  })
  const page = context.pages()[0]
  await page.goto('http://127.0.0.1:4175')
  await page.evaluate(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), {
    key: `moi-ngay.auth:${encodeURIComponent(local.url)}`,
    session: login.data.session,
  })
  await page.goto('http://127.0.0.1:4175/#/reminders')
  await page.reload()
  await page.getByRole('button', { name: 'Lưu lịch nhắc', exact: true }).waitFor()
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true))
  await page.getByLabel('Dùng giờ yên lặng', { exact: true }).uncheck()
  await page.getByLabel('Múi giờ', { exact: true }).fill('UTC')
  await page.getByRole('button', { name: 'Bật nhắc trên thiết bị này', exact: true }).click()
  await page.getByRole('heading', { name: 'Đã bật nhắc', exact: true }).waitFor({ timeout: 22_000 })
  const devices = await user.from('reminder_devices').select('id,enabled')
  const device = devices.data?.find((item) => item.enabled)
  if (!device) throw new Error('Test subscription unavailable')
  // Allow the browser's newly-created push connection to settle before closing its last page.
  await new Promise((resolve) => setTimeout(resolve, 3000))
  await page.close()
  const openPages = context.pages().length
  await admin
    .from('reminder_devices')
    .update({ next_at: new Date(Date.now() - 500).toISOString() })
    .eq('id', device.id)
  const counts = await sendDueReminders(admin, vapid, undefined, device.id)
  let displayed = false
  for (let n = 0; n < 30; n++) {
    const worker = context.serviceWorkers()[0]
    if (worker)
      displayed = await worker.evaluate(async () =>
        (await globalThis.registration.getNotifications()).some(
          (note) => note.data?.kind === 'study-reminder',
        ),
      )
    if (displayed) break
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  console.log(
    JSON.stringify({
      realSubscription: true,
      openPagesDuringSend: openPages,
      counts,
      browserNotificationRegistered: displayed,
      physicalOsDisplayVerified: false,
    }),
  )
  if (!displayed || counts.accepted !== 1 || openPages !== 0) process.exitCode = 1
} catch {
  console.error(
    'Chưa xác minh được Web Push thật. Kiểm tra backend/migration, khóa local, preview 4175 và kết nối dịch vụ push. Không in token hoặc endpoint.',
  )
  process.exitCode = 1
} finally {
  if (context) {
    for (const worker of context.serviceWorkers())
      await worker
        .evaluate(async () => {
          const reg = globalThis.registration
          ;(await reg.getNotifications()).forEach((note) => note.close())
          await (await reg.pushManager.getSubscription())?.unsubscribe()
        })
        .catch(() => {})
    await context.close()
  }
  if (userId) {
    const result = await admin.auth.admin.deleteUser(userId)
    if (result.error) {
      console.error('Chưa dọn được tài khoản do probe này tạo. Kiểm tra backend local.')
      process.exitCode = 1
    }
  }
}
